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