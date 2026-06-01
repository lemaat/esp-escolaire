# escolaire/academique/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from accounts.models import Utilisateur, ProfilPersonnel
from .models import Matiere, Evaluation, Note


# =====================================================================
#  COTE PROFESSEUR
# =====================================================================

class MesMatieresAPIView(APIView):
    """GET : liste des matieres enseignees par le professeur connecte."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "PROFESSEUR":
            return Response(
                {"erreur": "Action reservee aux professeurs."},
                status=status.HTTP_403_FORBIDDEN,
            )

        matieres = Matiere.objects.filter(professeur=user).order_by("code")
        data = [
            {
                "id": m.id,
                "code": m.code,
                "nom": m.nom,
                "departement": m.departement,
                "pole": m.pole,
                "annee": m.annee,
                "semestre": m.semestre,
                "nb_evaluations": m.evaluations.count(),
            }
            for m in matieres
        ]
        return Response({"matieres": data})


class CreerEvaluationAPIView(APIView):
    """POST : le professeur cree une evaluation dans une de ses matieres."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != "PROFESSEUR":
            return Response({"erreur": "Action reservee aux professeurs."}, status=403)

        matiere_id = request.data.get("matiere_id")
        titre = request.data.get("titre")
        type_evaluation = request.data.get("type_evaluation", "DEVOIR")
        date_eval = request.data.get("date")
        coefficient = request.data.get("coefficient", 1)

        if not matiere_id or not titre or not date_eval:
            return Response(
                {"erreur": "matiere_id, titre et date sont requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            matiere = Matiere.objects.get(id=matiere_id, professeur=user)
        except Matiere.DoesNotExist:
            return Response(
                {"erreur": "Matiere introuvable ou ne vous appartient pas."},
                status=status.HTTP_404_NOT_FOUND,
            )

        evalu = Evaluation.objects.create(
            matiere=matiere,
            titre=titre,
            type_evaluation=type_evaluation,
            date=date_eval,
            coefficient=coefficient,
            publiee=False,
        )
        return Response(
            {
                "message": "Evaluation creee.",
                "id": evalu.id,
                "titre": evalu.titre,
                "publiee": evalu.publiee,
            },
            status=status.HTTP_201_CREATED,
        )


class GrilleNotesAPIView(APIView):
    """
    GET  : grille de saisie d'une evaluation = etudiants + leur note actuelle.
    POST : enregistre/modifie les notes saisies par le professeur (en une fois).
    """
    permission_classes = [IsAuthenticated]

    def _evaluation_du_prof(self, request, evaluation_id):
        return Evaluation.objects.filter(
            id=evaluation_id, matiere__professeur=request.user
        ).first()

    def get(self, request, evaluation_id):
        user = request.user
        if user.role != "PROFESSEUR":
            return Response({"erreur": "Action reservee aux professeurs."}, status=403)

        evalu = self._evaluation_du_prof(request, evaluation_id)
        if evalu is None:
            return Response(
                {"erreur": "Evaluation introuvable ou ne vous appartient pas."},
                status=status.HTTP_404_NOT_FOUND,
            )

        notes_existantes = {n.etudiant_id: n.valeur for n in evalu.notes.all()}

        # --- CHOIX MVP : tous les etudiants. ---
        # Pour filtrer par departement/annee plus tard (quand les ProfilEtudiant
        # seront remplis), remplacer par un filtre du type :
        #   .filter(profil_etudiant__departement=evalu.matiere.departement,
        #           profil_etudiant__annee=evalu.matiere.annee)
        etudiants = Utilisateur.objects.filter(role="ETUDIANT").order_by("username")

        lignes = [
            {
                "etudiant_id": e.id,
                "username": e.username,
                "nom_complet": f"{e.first_name} {e.last_name}".strip() or e.username,
                "valeur": notes_existantes.get(e.id),
            }
            for e in etudiants
        ]

        return Response({
            "evaluation": {
                "id": evalu.id,
                "titre": evalu.titre,
                "matiere": evalu.matiere.code,
                "publiee": evalu.publiee,
            },
            "etudiants": lignes,
        })

    def post(self, request, evaluation_id):
        user = request.user
        if user.role != "PROFESSEUR":
            return Response({"erreur": "Action reservee aux professeurs."}, status=403)

        evalu = self._evaluation_du_prof(request, evaluation_id)
        if evalu is None:
            return Response(
                {"erreur": "Evaluation introuvable ou ne vous appartient pas."},
                status=status.HTTP_404_NOT_FOUND,
            )

        notes_recues = request.data.get("notes", [])
        if not isinstance(notes_recues, list):
            return Response(
                {"erreur": "Le champ 'notes' doit etre une liste."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        enregistrees = 0
        erreurs = []
        for ligne in notes_recues:
            etudiant_id = ligne.get("etudiant_id")
            valeur = ligne.get("valeur")

            if valeur is None or valeur == "":
                continue

            try:
                valeur = float(valeur)
            except (TypeError, ValueError):
                erreurs.append(f"Note invalide pour l'etudiant {etudiant_id}.")
                continue
            if valeur < 0 or valeur > 20:
                erreurs.append(f"La note de l'etudiant {etudiant_id} doit etre entre 0 et 20.")
                continue

            etudiant = Utilisateur.objects.filter(id=etudiant_id, role="ETUDIANT").first()
            if etudiant is None:
                erreurs.append(f"Etudiant {etudiant_id} introuvable.")
                continue

            Note.objects.update_or_create(
                etudiant=etudiant,
                evaluation=evalu,
                defaults={"valeur": valeur},
            )
            enregistrees += 1

        return Response({
            "message": f"{enregistrees} note(s) enregistree(s).",
            "erreurs": erreurs,
        })


class PublierEvaluationAPIView(APIView):
    """POST : bascule publiee = True (rend les notes visibles aux consultants)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, evaluation_id):
        user = request.user
        if user.role != "PROFESSEUR":
            return Response({"erreur": "Action reservee aux professeurs."}, status=403)

        evalu = Evaluation.objects.filter(
            id=evaluation_id, matiere__professeur=user
        ).first()
        if evalu is None:
            return Response(
                {"erreur": "Evaluation introuvable ou ne vous appartient pas."},
                status=status.HTTP_404_NOT_FOUND,
            )

        evalu.publiee = True
        evalu.save()
        return Response({"message": "Evaluation publiee.", "publiee": True})


# =====================================================================
#  COTE ETUDIANT
# =====================================================================

class MesNotesEtudiantAPIView(APIView):
    """
    GET : notes de l'etudiant connecte, uniquement pour les evaluations PUBLIEES,
    regroupees par semestre puis par matiere, avec moyennes.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "ETUDIANT":
            return Response({"erreur": "Action reservee aux etudiants."}, status=403)

        # Seules les notes des evaluations publiees sont visibles
        notes = Note.objects.filter(
            etudiant=user, evaluation__publiee=True
        ).select_related("evaluation", "evaluation__matiere")

        # Regroupement intermediaire : { semestre: { matiere_id: {...} } }
        semestres = {}
        for n in notes:
            evalu = n.evaluation
            matiere = evalu.matiere
            sem_bloc = semestres.setdefault(matiere.semestre, {})
            m_bloc = sem_bloc.setdefault(matiere.id, {
                "code": matiere.code,
                "nom": matiere.nom,
                "notes": [],
                "_somme": 0.0,       # somme (note * coef) pour la moyenne ponderee
                "_somme_coef": 0.0,  # somme des coefficients
            })
            coef = float(evalu.coefficient)
            valeur = float(n.valeur)
            m_bloc["notes"].append({
                "evaluation": evalu.titre,
                "type": evalu.type_evaluation,
                "date": evalu.date,
                "coefficient": coef,
                "valeur": valeur,
            })
            m_bloc["_somme"] += valeur * coef
            m_bloc["_somme_coef"] += coef

        # Construction de la reponse avec les moyennes
        resultat = {}
        for sem, matieres_bloc in semestres.items():
            liste_matieres = []
            moyennes_matieres = []
            for m in matieres_bloc.values():
                # Moyenne matiere = moyenne ponderee par le coefficient des evaluations
                moyenne_matiere = (
                    round(m["_somme"] / m["_somme_coef"], 2) if m["_somme_coef"] else None
                )
                if moyenne_matiere is not None:
                    moyennes_matieres.append(moyenne_matiere)
                liste_matieres.append({
                    "code": m["code"],
                    "nom": m["nom"],
                    "notes": m["notes"],
                    "moyenne": moyenne_matiere,
                })
            # Moyenne semestre = moyenne SIMPLE des moyennes de matieres.
            # (Pas de ponderation entre matieres : Matiere n'a pas de coefficient.
            #  Pour ponderer, ajouter un champ coefficient sur Matiere.)
            moyenne_semestre = (
                round(sum(moyennes_matieres) / len(moyennes_matieres), 2)
                if moyennes_matieres else None
            )
            resultat[sem] = {
                "matieres": liste_matieres,
                "moyenne_semestre": moyenne_semestre,
            }

        return Response({"semestres": resultat})


# =====================================================================
#  COTE CHEF DE DEPARTEMENT / RESPONSABLE DE POLE (consultation)
# =====================================================================

def _consultation_par_matieres(matieres_qs):
    """
    Construit, pour une liste de matieres, leurs evaluations PUBLIEES
    et les notes de chaque etudiant. Utilise par le chef et le resp pole.
    """
    data = []
    for m in matieres_qs.order_by("code"):
        evals = []
        for evalu in m.evaluations.filter(publiee=True).order_by("date"):
            notes = [
                {"etudiant": n.etudiant.username, "valeur": float(n.valeur)}
                for n in evalu.notes.select_related("etudiant")
            ]
            evals.append({
                "titre": evalu.titre,
                "type": evalu.type_evaluation,
                "date": evalu.date,
                "coefficient": float(evalu.coefficient),
                "notes": notes,
            })
        data.append({
            "code": m.code,
            "nom": m.nom,
            "departement": m.departement,
            "pole": m.pole,
            "evaluations": evals,
        })
    return data


def _profil_personnel(user):
    """Renvoie le ProfilPersonnel de l'utilisateur, ou None s'il n'en a pas."""
    try:
        return user.profil_personnel
    except ProfilPersonnel.DoesNotExist:
        return None


class NotesChefDeptAPIView(APIView):
    """GET : notes des matieres du departement gere par le chef connecte."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "CHEF_DEPT":
            return Response({"erreur": "Action reservee aux chefs de departement."}, status=403)

        profil = _profil_personnel(user)
        if profil is None or not profil.departement_gere:
            return Response(
                {"erreur": "Aucun departement n'est rattache a ce compte."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        matieres = Matiere.objects.filter(departement=profil.departement_gere)
        return Response({
            "departement": profil.departement_gere,
            "matieres": _consultation_par_matieres(matieres),
        })


class NotesRespPoleAPIView(APIView):
    """GET : notes des matieres du pole gere par le responsable connecte."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "RESP_POLE":
            return Response({"erreur": "Action reservee aux responsables de pole."}, status=403)

        profil = _profil_personnel(user)
        if profil is None or not profil.pole_gere:
            return Response(
                {"erreur": "Aucun pole n'est rattache a ce compte."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        matieres = Matiere.objects.filter(pole=profil.pole_gere)
        return Response({
            "pole": profil.pole_gere,
            "matieres": _consultation_par_matieres(matieres),
        })