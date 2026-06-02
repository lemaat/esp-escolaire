from datetime import date

from django.db.models import Sum, Count, Q, F
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status

from accounts.models import ProfilEtudiant
from .models import (
    Bloc, Chambre, DossierLogement, DocumentLogement, Affectation, Annonce,
)
from .serializers import (
    BlocSerializer, ChambreSerializer, ChambreCreateSerializer,
    ChambreDetailSerializer, DossierLogementSerializer,
    DossierLogementListSerializer, DocumentLogementSerializer,
    AffectationSerializer, AnnonceSerializer,
)
from .permissions import IsStudent, IsRespLogement


# ──────────────────────────────────────────────
#  Annonces  (lecture pour tous, CRUD pour admin)
# ──────────────────────────────────────────────

class AnnoncesListAPIView(APIView):
    """GET : liste des annonces (accessible aux étudiants et admin)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        annonces = Annonce.objects.all()
        serializer = AnnonceSerializer(annonces, many=True)
        return Response(serializer.data)


class AnnonceAdminAPIView(APIView):
    """POST : créer une annonce ; DELETE : supprimer."""
    permission_classes = [IsRespLogement]

    def post(self, request):
        serializer = AnnonceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        try:
            annonce = Annonce.objects.get(pk=pk)
        except Annonce.DoesNotExist:
            return Response(
                {"erreur": "Annonce introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )
        annonce.delete()
        return Response({"message": "Annonce supprimée."}, status=status.HTTP_200_OK)


# ──────────────────────────────────────────────
#  Espace Étudiant — Demande de logement
# ──────────────────────────────────────────────

class DemandeLogementAPIView(APIView):
    """
    GET  — récupère le dossier existant (ou un état « vide »).
    POST — crée le dossier en brouillon.
    """
    permission_classes = [IsStudent]

    def get(self, request):
        try:
            dossier = request.user.dossier_logement
        except DossierLogement.DoesNotExist:
            # Pas encore de dossier → renvoie les infos du profil
            return Response({
                "dossier": None,
                "profil": self._profil(request.user),
            })

        serializer = DossierLogementSerializer(
            dossier, context={'request': request}
        )
        return Response({
            "dossier": serializer.data,
            "profil": self._profil(request.user),
        })

    def post(self, request):
        # On ne crée qu'un seul dossier par étudiant
        if DossierLogement.objects.filter(etudiant=request.user).exists():
            return Response(
                {"erreur": "Vous avez déjà un dossier de logement."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        dossier = DossierLogement.objects.create(
            etudiant=request.user, statut='BROUILLON'
        )
        serializer = DossierLogementSerializer(
            dossier, context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @staticmethod
    def _profil(user):
        info = {
            'matricule': user.username,
            'nom': user.last_name,
            'prenom': user.first_name,
            'email': user.email,
            'telephone': user.telephone,
        }
        if hasattr(user, 'profil_etudiant'):
            p = user.profil_etudiant
            info.update({
                'sexe': p.sexe,
                'sexe_display': p.get_sexe_display() if p.sexe else '',
                'date_naissance': str(p.date_naissance) if p.date_naissance else None,
                'age': p.age,
                'departement': p.departement,
                'departement_display': p.get_departement_display(),
                'annee': p.annee,
            })
        return info


class SoumettreDemandeAPIView(APIView):
    """POST — passe le dossier de BROUILLON à SOUMIS."""
    permission_classes = [IsStudent]

    def post(self, request):
        try:
            dossier = request.user.dossier_logement
        except DossierLogement.DoesNotExist:
            return Response(
                {"erreur": "Aucun dossier trouvé."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if dossier.statut != 'BROUILLON':
            return Response(
                {"erreur": "Le dossier a déjà été soumis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Vérifier que les 3 documents obligatoires sont présents
        types_obligatoires = {'SCOLARITE', 'CNI', 'PHOTO'}
        types_presents = set(
            dossier.documents.values_list('type_document', flat=True)
        )
        manquants = types_obligatoires - types_presents
        if manquants:
            labels = dict(DocumentLogement.TYPE_CHOICES)
            noms = [labels.get(t, t) for t in manquants]
            return Response(
                {"erreur": f"Documents manquants : {', '.join(noms)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        dossier.statut = 'SOUMIS'
        dossier.save()
        return Response({"message": "Demande soumise avec succès.", "statut": "SOUMIS"})


class TeleverserDocumentLogementAPIView(APIView):
    """POST — upload un document au dossier logement de l'étudiant."""
    permission_classes = [IsStudent]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        try:
            dossier = request.user.dossier_logement
        except DossierLogement.DoesNotExist:
            return Response(
                {"erreur": "Créez d'abord un dossier de logement."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if dossier.statut not in ('BROUILLON', 'REFUSE'):
            return Response(
                {"erreur": "Le dossier ne peut plus être modifié."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        type_document = request.data.get('type_document')
        fichier = request.FILES.get('fichier')

        if not type_document or not fichier:
            return Response(
                {"erreur": "type_document et fichier sont requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        types_valides = [c[0] for c in DocumentLogement.TYPE_CHOICES]
        if type_document not in types_valides:
            return Response(
                {"erreur": f"Type de document inconnu : {type_document}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Remplacer un document existant du même type
        ancien = DocumentLogement.objects.filter(
            dossier=dossier, type_document=type_document,
        ).first()
        if ancien and ancien.fichier:
            ancien.fichier.delete(save=False)

        doc, cree = DocumentLogement.objects.update_or_create(
            dossier=dossier,
            type_document=type_document,
            defaults={"fichier": fichier},
        )

        return Response({
            "message": "Document téléversé avec succès.",
            "type_document": doc.type_document,
            "fichier_url": request.build_absolute_uri(doc.fichier.url),
        }, status=status.HTTP_201_CREATED if cree else status.HTTP_200_OK)


class MonAffectationAPIView(APIView):
    """GET — l'étudiant consulte son affectation de chambre."""
    permission_classes = [IsStudent]

    def get(self, request):
        try:
            affectation = request.user.affectation_logement
        except Affectation.DoesNotExist:
            return Response({"affectation": None})

        serializer = AffectationSerializer(affectation)
        # Ajouter les colocataires
        chambre = affectation.chambre
        colocataires = []
        for aff in chambre.affectations.select_related(
            'etudiant__profil_etudiant'
        ).exclude(etudiant=request.user):
            u = aff.etudiant
            p = getattr(u, 'profil_etudiant', None)
            colocataires.append({
                'nom_complet': f"{u.first_name} {u.last_name}",
                'age': p.age if p else None,
                'departement': p.get_departement_display() if p else '',
                'annee': p.annee if p else 0,
            })

        data = serializer.data
        data['colocataires'] = colocataires
        return Response({"affectation": data})


# ──────────────────────────────────────────────
#  Administration — Blocs & Chambres (CRUD)
# ──────────────────────────────────────────────

class BlocListCreateAPIView(APIView):
    permission_classes = [IsRespLogement]

    def get(self, request):
        blocs = Bloc.objects.all()
        serializer = BlocSerializer(blocs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = BlocSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BlocDetailAPIView(APIView):
    permission_classes = [IsRespLogement]

    def put(self, request, pk):
        try:
            bloc = Bloc.objects.get(pk=pk)
        except Bloc.DoesNotExist:
            return Response({"erreur": "Bloc introuvable."}, status=status.HTTP_404_NOT_FOUND)
        serializer = BlocSerializer(bloc, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            bloc = Bloc.objects.get(pk=pk)
        except Bloc.DoesNotExist:
            return Response({"erreur": "Bloc introuvable."}, status=status.HTTP_404_NOT_FOUND)
        bloc.delete()
        return Response({"message": "Bloc supprimé."})


class ChambreListCreateAPIView(APIView):
    permission_classes = [IsRespLogement]

    def get(self, request):
        chambres = Chambre.objects.select_related('bloc').all()
        # Filtre optionnel par bloc
        bloc_id = request.query_params.get('bloc')
        if bloc_id:
            chambres = chambres.filter(bloc_id=bloc_id)
        serializer = ChambreSerializer(chambres, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ChambreCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChambreDetailAPIView(APIView):
    permission_classes = [IsRespLogement]

    def get(self, request, pk):
        try:
            chambre = Chambre.objects.select_related('bloc').get(pk=pk)
        except Chambre.DoesNotExist:
            return Response({"erreur": "Chambre introuvable."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ChambreDetailSerializer(chambre)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            chambre = Chambre.objects.get(pk=pk)
        except Chambre.DoesNotExist:
            return Response({"erreur": "Chambre introuvable."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ChambreCreateSerializer(chambre, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            chambre = Chambre.objects.get(pk=pk)
        except Chambre.DoesNotExist:
            return Response({"erreur": "Chambre introuvable."}, status=status.HTTP_404_NOT_FOUND)
        chambre.delete()
        return Response({"message": "Chambre supprimée."})


# ──────────────────────────────────────────────
#  Administration — Validation des dossiers
# ──────────────────────────────────────────────

class DossierListAdminAPIView(APIView):
    """GET — liste des dossiers avec filtrage multicritère."""
    permission_classes = [IsRespLogement]

    def get(self, request):
        dossiers = DossierLogement.objects.select_related(
            'etudiant__profil_etudiant'
        ).all()

        # Filtres
        statut = request.query_params.get('statut')
        if statut:
            dossiers = dossiers.filter(statut=statut)

        departement = request.query_params.get('departement')
        if departement:
            dossiers = dossiers.filter(
                etudiant__profil_etudiant__departement=departement
            )

        annee = request.query_params.get('annee')
        if annee:
            dossiers = dossiers.filter(
                etudiant__profil_etudiant__annee=annee
            )

        sexe = request.query_params.get('sexe')
        if sexe:
            dossiers = dossiers.filter(
                etudiant__profil_etudiant__sexe=sexe
            )

        # Recherche par nom/matricule
        q = request.query_params.get('q')
        if q:
            dossiers = dossiers.filter(
                Q(etudiant__username__icontains=q)
                | Q(etudiant__first_name__icontains=q)
                | Q(etudiant__last_name__icontains=q)
            )

        serializer = DossierLogementListSerializer(dossiers, many=True)
        return Response(serializer.data)


class DossierDetailAdminAPIView(APIView):
    """GET — détail complet d'un dossier (avec documents)."""
    permission_classes = [IsRespLogement]

    def get(self, request, pk):
        try:
            dossier = DossierLogement.objects.select_related(
                'etudiant__profil_etudiant'
            ).prefetch_related('documents').get(pk=pk)
        except DossierLogement.DoesNotExist:
            return Response(
                {"erreur": "Dossier introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = DossierLogementSerializer(
            dossier, context={'request': request}
        )
        return Response(serializer.data)


class DecisionDossierAPIView(APIView):
    """POST — accepter ou refuser un dossier."""
    permission_classes = [IsRespLogement]

    def post(self, request, pk):
        try:
            dossier = DossierLogement.objects.get(pk=pk)
        except DossierLogement.DoesNotExist:
            return Response(
                {"erreur": "Dossier introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        decision = request.data.get('decision')  # ACCEPTE ou REFUSE
        commentaire = request.data.get('commentaire', '')

        if decision not in ('ACCEPTE', 'REFUSE'):
            return Response(
                {"erreur": "Décision invalide. Utilisez ACCEPTE ou REFUSE."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        dossier.statut = decision
        dossier.commentaire_admin = commentaire
        dossier.save()

        return Response({
            "message": f"Dossier {dossier.get_statut_display()}.",
            "statut": dossier.statut,
        })


# ──────────────────────────────────────────────
#  Administration — Affectation des chambres
# ──────────────────────────────────────────────

class AffectationAdminAPIView(APIView):
    """
    GET  — liste toutes les affectations.
    POST — affecter un étudiant à une chambre.
    """
    permission_classes = [IsRespLogement]

    def get(self, request):
        affectations = Affectation.objects.select_related(
            'etudiant__profil_etudiant', 'chambre__bloc'
        ).all()
        serializer = AffectationSerializer(affectations, many=True)
        return Response(serializer.data)

    def post(self, request):
        etudiant_id = request.data.get('etudiant')
        chambre_id = request.data.get('chambre')

        if not etudiant_id or not chambre_id:
            return Response(
                {"erreur": "etudiant et chambre sont requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Vérifier que le dossier est accepté
        try:
            dossier = DossierLogement.objects.get(etudiant_id=etudiant_id)
        except DossierLogement.DoesNotExist:
            return Response(
                {"erreur": "Cet étudiant n'a pas de dossier de logement."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if dossier.statut != 'ACCEPTE':
            return Response(
                {"erreur": "Le dossier de l'étudiant n'est pas encore accepté."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Vérifier s'il est déjà affecté
        if Affectation.objects.filter(etudiant_id=etudiant_id).exists():
            return Response(
                {"erreur": "Cet étudiant est déjà affecté à une chambre."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Vérifier la chambre
        try:
            chambre = Chambre.objects.select_related('bloc').get(pk=chambre_id)
        except Chambre.DoesNotExist:
            return Response(
                {"erreur": "Chambre introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not chambre.est_disponible:
            return Response(
                {"erreur": "Cette chambre est complète ou en maintenance."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Vérifier la concordance du sexe
        profil = getattr(dossier.etudiant, 'profil_etudiant', None)
        if profil and profil.sexe and profil.sexe != chambre.bloc.sexe:
            return Response(
                {"erreur": "Le sexe de l'étudiant ne correspond pas au bloc."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Créer l'affectation
        affectation = Affectation.objects.create(
            etudiant_id=etudiant_id, chambre=chambre
        )

        # Mettre à jour le statut du dossier
        dossier.statut = 'AFFECTE'
        dossier.save()

        # Si la chambre est maintenant pleine, la marquer comme complète
        if chambre.places_restantes == 0:
            chambre.etat = 'COMPLETE'
            chambre.save()

        serializer = AffectationSerializer(affectation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DesaffectationAPIView(APIView):
    """DELETE — retirer un étudiant d'une chambre."""
    permission_classes = [IsRespLogement]

    def delete(self, request, pk):
        try:
            affectation = Affectation.objects.select_related(
                'chambre', 'etudiant'
            ).get(pk=pk)
        except Affectation.DoesNotExist:
            return Response(
                {"erreur": "Affectation introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        chambre = affectation.chambre
        etudiant = affectation.etudiant

        affectation.delete()

        # Remettre la chambre en disponible si elle était complète
        if chambre.etat == 'COMPLETE':
            chambre.etat = 'DISPONIBLE'
            chambre.save()

        # Remettre le dossier à ACCEPTE
        try:
            dossier = etudiant.dossier_logement
            if dossier.statut == 'AFFECTE':
                dossier.statut = 'ACCEPTE'
                dossier.save()
        except DossierLogement.DoesNotExist:
            pass

        return Response({"message": "Étudiant désaffecté avec succès."})


# ──────────────────────────────────────────────
#  Tableau de bord — Statistiques
# ──────────────────────────────────────────────

class StatistiquesAPIView(APIView):
    """GET — tableau de bord complet pour le responsable logement."""
    permission_classes = [IsRespLogement]

    def get(self, request):
        # --- Statistiques générales ---
        nb_blocs = Bloc.objects.count()
        nb_chambres = Chambre.objects.count()
        total_places = Chambre.objects.aggregate(total=Sum('capacite'))['total'] or 0
        nb_affectations = Affectation.objects.count()
        places_libres = total_places - nb_affectations

        # --- Dossiers ---
        dossiers_stats = {
            'total': DossierLogement.objects.count(),
            'brouillon': DossierLogement.objects.filter(statut='BROUILLON').count(),
            'soumis': DossierLogement.objects.filter(statut='SOUMIS').count(),
            'examen': DossierLogement.objects.filter(statut='EXAMEN').count(),
            'acceptes': DossierLogement.objects.filter(statut='ACCEPTE').count(),
            'refuses': DossierLogement.objects.filter(statut='REFUSE').count(),
            'affectes': DossierLogement.objects.filter(statut='AFFECTE').count(),
        }

        # --- Répartition par sexe (étudiants logés) ---
        etudiants_loges_ids = Affectation.objects.values_list('etudiant_id', flat=True)
        profils_loges = ProfilEtudiant.objects.filter(user_id__in=etudiants_loges_ids)

        par_sexe = {
            'hommes': profils_loges.filter(sexe='M').count(),
            'femmes': profils_loges.filter(sexe='F').count(),
        }

        # --- Répartition par filière (étudiants logés) ---
        par_filiere = list(
            profils_loges.values('departement')
            .annotate(nombre=Count('id'))
            .order_by('departement')
        )

        # --- Répartition par niveau / année (étudiants logés) ---
        par_niveau = list(
            profils_loges.values('annee')
            .annotate(nombre=Count('id'))
            .order_by('annee')
        )

        # --- Répartition par tranche d'âge (étudiants logés) ---
        today = date.today()
        par_age = {'18-20': 0, '21-23': 0, '24-26': 0, '27+': 0}
        for profil in profils_loges.exclude(date_naissance__isnull=True):
            age = profil.age
            if age is None:
                continue
            if age <= 20:
                par_age['18-20'] += 1
            elif age <= 23:
                par_age['21-23'] += 1
            elif age <= 26:
                par_age['24-26'] += 1
            else:
                par_age['27+'] += 1

        return Response({
            'general': {
                'blocs': nb_blocs,
                'chambres': nb_chambres,
                'total_places': total_places,
                'places_occupees': nb_affectations,
                'places_libres': places_libres,
                'etudiants_loges': nb_affectations,
            },
            'dossiers': dossiers_stats,
            'par_sexe': par_sexe,
            'par_filiere': par_filiere,
            'par_niveau': par_niveau,
            'par_age': par_age,
        })
