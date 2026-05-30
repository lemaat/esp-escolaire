# escolaire/inscriptions/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status

from .models import DossierInscription, DocumentJustificatif


class MonDossierAPIView(APIView):
    """
    GET : renvoie le dossier de l'admis connecté et ses documents déjà téléversés.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Seuls les admis ont un dossier d'inscription
        if user.role != "ADMIS":
            return Response(
                {"erreur": "Aucun dossier d'inscription pour cet utilisateur."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            dossier = user.dossier_inscription
        except DossierInscription.DoesNotExist:
            return Response(
                {"erreur": "Dossier introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # On serialize manuellement (simple et lisible pour ce projet)
        documents = [
            {
                "type_document": d.type_document,
                "statut": d.statut,
                "motif_refus": d.motif_refus,
                "fichier_url": d.fichier.url if d.fichier else None,
                "televerse_le": d.televerse_le,
            }
            for d in dossier.documents.all()
        ]

        return Response({
            "statut_dossier": dossier.statut,
            "documents": documents,
        })


class TeleverserDocumentAPIView(APIView):
    """
    POST : reçoit un fichier pour un type de document donné.
    Si une pièce du même type existe déjà, on supprime l'ancien fichier
    sur disque puis on enregistre le nouveau.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        user = request.user

        if user.role != "ADMIS":
            return Response(
                {"erreur": "Action réservée aux admis."},
                status=status.HTTP_403_FORBIDDEN,
            )

        type_document = request.data.get("type_document")
        fichier = request.FILES.get("fichier")

        if not type_document or not fichier:
            return Response(
                {"erreur": "type_document et fichier sont requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        types_valides = [c[0] for c in DocumentJustificatif.Type.choices]
        if type_document not in types_valides:
            return Response(
                {"erreur": f"Type de document inconnu : {type_document}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        dossier = user.dossier_inscription

        # Si une pièce du même type existe déjà : on supprime l'ancien fichier
        # sur disque AVANT de la remplacer (sinon l'ancien reste orphelin)
        ancien = DocumentJustificatif.objects.filter(
            dossier=dossier, type_document=type_document,
        ).first()
        if ancien and ancien.fichier:
            ancien.fichier.delete(save=False)  # supprime le fichier disque

        # Maintenant on remplace l'enregistrement en base
        doc, cree = DocumentJustificatif.objects.update_or_create(
            dossier=dossier,
            type_document=type_document,
            defaults={
                "fichier": fichier,
                "statut": DocumentJustificatif.Statut.EN_ATTENTE,
                "motif_refus": "",
            },
        )

        return Response({
            "message": "Document téléversé avec succès.",
            "type_document": doc.type_document,
            "statut": doc.statut,
            "fichier_url": doc.fichier.url,
        }, status=status.HTTP_201_CREATED if cree else status.HTTP_200_OK)
    
from django.db.models import Count
from accounts.models import Utilisateur


class ListerDossiersAPIView(APIView):
    """
    GET : renvoie la liste des dossiers selon le filtre demande.
    Reserve aux RESP_INSCRIPTION.
    Parametre query : ?statut=en_attente | valides | manquants
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role != "RESP_INSCRIPTION":
            return Response(
                {"erreur": "Acces reserve aux responsables des inscriptions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        filtre = request.query_params.get("statut", "en_attente")

        if filtre == "manquants":
            return self._lister_manquants()
        elif filtre == "valides":
            return self._lister_valides()
        else:
            return self._lister_en_attente()

    # === Onglet 1 : En attente ===
    def _lister_en_attente(self):
        """
        Dossiers ou l'admis a televerse au moins 1 doc
        et la validation finale n'est pas encore faite.
        """
        dossiers = DossierInscription.objects.filter(
            admis__role="ADMIS",
        ).annotate(
            nb_docs=Count("documents"),
        ).filter(nb_docs__gt=0).order_by("cree_le")

        data = []
        for d in dossiers:
            u = d.admis
            data.append({
                "matricule": u.username,
                "nom": u.last_name or (d.candidat.nom if d.candidat else ""),
                "prenom": u.first_name or (d.candidat.prenom if d.candidat else ""),
                "email": u.email,
                "telephone": u.telephone or "",
                "nb_docs_televerse": d.documents.count(),
                "nb_docs_valides": d.documents.filter(statut="VALIDE").count(),
                "nb_docs_refuses": d.documents.filter(statut="REFUSE").count(),
                "nb_docs_en_attente": d.documents.filter(statut="EN_ATTENTE").count(),
                "date_soumission": d.cree_le.isoformat(),
            })
        return Response({"dossiers": data, "total": len(data)})

    # === Onglet 2 : Valides ===
    def _lister_valides(self):
        """
        Admis devenus ETUDIANT (validation finale faite).
        """
        etudiants = Utilisateur.objects.filter(
            role="ETUDIANT",
        ).order_by("username")

        data = []
        for u in etudiants:
            try:
                dossier = u.dossier_inscription
            except DossierInscription.DoesNotExist:
                continue
            data.append({
                "matricule": u.username,
                "nom": u.last_name,
                "prenom": u.first_name,
                "email": u.email,
                "email_institutionnel": f"{u.username}@esp.mr",
                "date_validation": dossier.maj_le.isoformat() if dossier.maj_le else None,
            })
        return Response({"dossiers": data, "total": len(data)})

    # === Onglet 3 : Manquants ===
    def _lister_manquants(self):
        """
        Admis qui n'ont pas commence :
        - Soit pas connecte (doit_changer_mdp=True)
        - Soit connecte mais 0 doc televerse
        """
        # Cas 1 : pas connectes du tout
        non_connectes = Utilisateur.objects.filter(
            role="ADMIS", doit_changer_mdp=True,
        )

        # Cas 2 : connectes mais 0 document
        sans_doc = Utilisateur.objects.filter(
            role="ADMIS", doit_changer_mdp=False,
        ).annotate(
            nb_docs=Count("dossier_inscription__documents"),
        ).filter(nb_docs=0)

        # Union des deux ensembles
        manquants_ids = list(non_connectes.values_list("id", flat=True)) + \
                        list(sans_doc.values_list("id", flat=True))
        manquants = Utilisateur.objects.filter(id__in=manquants_ids).order_by("username")

        data = []
        for u in manquants:
            # Recuperer infos depuis CandidatCNIM si manquantes sur Utilisateur
            candidat = None
            try:
                candidat = u.dossier_inscription.candidat
            except DossierInscription.DoesNotExist:
                pass

            data.append({
                "matricule": u.username,
                "nom": u.last_name or (candidat.nom if candidat else ""),
                "prenom": u.first_name or (candidat.prenom if candidat else ""),
                "email": u.email,
                "telephone": u.telephone or (candidat.telephone if candidat else ""),
                "voie": candidat.voie if candidat else None,
                "a_change_mdp": not u.doit_changer_mdp,
                "statut_detail": "Inactif" if not u.doit_changer_mdp else "Pas connecte",
            })
        return Response({"dossiers": data, "total": len(data)})
    
class DetailDossierAPIView(APIView):
    """
    GET : renvoie le detail d'un dossier (infos admis + documents).
    Reserve aux RESP_INSCRIPTION.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, matricule):
        user = request.user

        if user.role != "RESP_INSCRIPTION":
            return Response(
                {"erreur": "Acces reserve aux responsables des inscriptions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Trouver l'admis (ou ex-admis devenu etudiant)
        from accounts.models import Utilisateur
        try:
            admis = Utilisateur.objects.get(username=matricule)
        except Utilisateur.DoesNotExist:
            return Response(
                {"erreur": f"Aucun utilisateur avec le matricule {matricule}."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            dossier = admis.dossier_inscription
        except DossierInscription.DoesNotExist:
            return Response(
                {"erreur": "Cet utilisateur n'a pas de dossier d'inscription."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Recuperer le candidat CNIM pour les infos officielles
        candidat = dossier.candidat

        # Documents avec URL absolue (pour que le frontend puisse les afficher)
        documents = []
        for doc in dossier.documents.all():
            documents.append({
                "id": doc.id,
                "type_document": doc.type_document,
                "type_document_libelle": doc.get_type_document_display(),
                "statut": doc.statut,
                "motif_refus": doc.motif_refus,
                "fichier_url": request.build_absolute_uri(doc.fichier.url) if doc.fichier else None,
                "fichier_nom": doc.fichier.name.split("/")[-1] if doc.fichier else None,
                "televerse_le": doc.televerse_le.isoformat() if hasattr(doc, "televerse_le") and doc.televerse_le else None,
            })

        # Determiner si validation finale possible : 4 documents tous VALIDES
        tous_valides = (
            dossier.documents.count() == 4
            and dossier.documents.filter(statut="VALIDE").count() == 4
        )

        return Response({
            "admis": {
                "matricule": admis.username,
                "nom": admis.last_name or (candidat.nom if candidat else ""),
                "prenom": admis.first_name or (candidat.prenom if candidat else ""),
                "email": admis.email,
                "telephone": admis.telephone or (candidat.telephone if candidat else ""),
                "voie": candidat.voie if candidat else None,
                "role_actuel": admis.role,
            },
            "dossier": {
                "statut": dossier.statut,
                "cree_le": dossier.cree_le.isoformat(),
                "tous_documents_valides": tous_valides,
                "deja_finalise": admis.role == "ETUDIANT",
            },
            "documents": documents,
        })
    

class ValiderDocumentAPIView(APIView):
    """
    POST : valide un document (passe son statut a VALIDE).
    Body : { "document_id": 1 }
    Reserve aux RESP_INSCRIPTION.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "RESP_INSCRIPTION":
            return Response(
                {"erreur": "Acces reserve aux responsables des inscriptions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        document_id = request.data.get("document_id")
        if not document_id:
            return Response(
                {"erreur": "document_id requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            doc = DocumentJustificatif.objects.get(id=document_id)
        except DocumentJustificatif.DoesNotExist:
            return Response(
                {"erreur": "Document introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        doc.statut = DocumentJustificatif.Statut.VALIDE
        doc.motif_refus = ""
        doc.save()

        return Response({
            "message": "Document valide.",
            "document_id": doc.id,
            "statut": doc.statut,
        })


class RefuserDocumentAPIView(APIView):
    """
    POST : refuse un document avec motif obligatoire.
    Body : { "document_id": 1, "motif": "Document illisible" }
    Reserve aux RESP_INSCRIPTION.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "RESP_INSCRIPTION":
            return Response(
                {"erreur": "Acces reserve aux responsables des inscriptions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        document_id = request.data.get("document_id")
        motif = (request.data.get("motif") or "").strip()

        if not document_id:
            return Response(
                {"erreur": "document_id requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not motif:
            return Response(
                {"erreur": "Le motif du refus est obligatoire."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            doc = DocumentJustificatif.objects.get(id=document_id)
        except DocumentJustificatif.DoesNotExist:
            return Response(
                {"erreur": "Document introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        doc.statut = DocumentJustificatif.Statut.REFUSE
        doc.motif_refus = motif
        doc.save()

        return Response({
            "message": "Document refuse.",
            "document_id": doc.id,
            "statut": doc.statut,
            "motif_refus": doc.motif_refus,
        })


class ValiderDossierFinalAPIView(APIView):
    """
    POST : validation finale du dossier.
    Bascule ADMIS -> ETUDIANT, genere email_institutionnel.
    Body : { "matricule": "251023" }
    Reserve aux RESP_INSCRIPTION.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "RESP_INSCRIPTION":
            return Response(
                {"erreur": "Acces reserve aux responsables des inscriptions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        matricule = request.data.get("matricule")
        if not matricule:
            return Response(
                {"erreur": "matricule requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from accounts.models import Utilisateur
        try:
            admis = Utilisateur.objects.get(username=matricule)
        except Utilisateur.DoesNotExist:
            return Response(
                {"erreur": "Admis introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if admis.role != "ADMIS":
            return Response(
                {"erreur": f"Cet utilisateur n'est plus ADMIS (role actuel : {admis.role})."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            dossier = admis.dossier_inscription
        except DossierInscription.DoesNotExist:
            return Response(
                {"erreur": "Aucun dossier d'inscription trouve."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Verification critique : les 4 documents doivent etre VALIDES
        nb_docs = dossier.documents.count()
        nb_valides = dossier.documents.filter(statut="VALIDE").count()

        if nb_docs < 4 or nb_valides < 4:
            return Response({
                "erreur": f"Tous les documents doivent etre valides avant validation finale "
                          f"({nb_valides}/4 valides actuellement).",
            }, status=status.HTTP_400_BAD_REQUEST)

        # === LA BASCULE ===
        from django.db import transaction
        with transaction.atomic():
            # 1. Changer le role
            admis.role = "ETUDIANT"
            # 2. Generer l'email institutionnel
            admis.email_institutionnel = f"{admis.username}@esp.mr"
            admis.save()

            # 3. Marquer le dossier comme valide
            dossier.statut = "VALIDE"
            dossier.save()

        # Email de notification (best effort, ne bloque pas si echec)
        self._envoyer_email_validation(admis)

        return Response({
            "message": "Dossier valide definitivement.",
            "matricule": admis.username,
            "nouveau_role": admis.role,
            "email_institutionnel": admis.email_institutionnel,
        })

    def _envoyer_email_validation(self, etudiant):
        from django.core.mail import send_mail
        from django.conf import settings
        try:
            send_mail(
                f"Bonjour {etudiant.first_name},\n\n"
                f"Felicitations !\n\n"
                f"Votre dossier d'inscription a l'Ecole Superieure Polytechnique a ete "
                f"valide avec succes. Vous etes desormais officiellement etudiant de l'ESP.\n\n"
                f"=== Informations importantes ===\n\n"
                f"Matricule : {etudiant.username}\n"
                f"Email institutionnel : {etudiant.email_institutionnel}\n\n"
                f"Cet email institutionnel sera l'adresse officielle utilisee tout au long "
                f"de votre scolarite a l'ESP.\n\n"
                f"=== Prochaines etapes ===\n\n"
                f"Connectez-vous sur le portail pour acceder a votre espace etudiant :\n"
                f"http://localhost:5173/login\n\n"
                f"Vous y trouverez vos cours, votre emploi du temps, vos notes, et la "
                f"possibilite de faire vos demandes de logement.\n\n"
                f"Nous vous souhaitons une excellente scolarite parmi nous.\n\n"
                f"Cordialement,\n"
                f"Le Service des Inscriptions\n"
                f"Ecole Superieure Polytechnique",
                settings.DEFAULT_FROM_EMAIL,
                [etudiant.email],
                fail_silently=True,
            )
        except Exception:
            pass  # On ne fait pas planter la validation si l'email echoue