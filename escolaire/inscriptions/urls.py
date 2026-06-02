from django.urls import path
from .views import (
    MonDossierAPIView,
    TeleverserDocumentAPIView,
    ListerDossiersAPIView,
    DetailDossierAPIView,
    ValiderDocumentAPIView,
    RefuserDocumentAPIView,
    ValiderDossierFinalAPIView,
)

app_name = 'inscriptions'

urlpatterns = [
    # Cote admis
    path('api/mon-dossier/', MonDossierAPIView.as_view(), name='api_mon_dossier'),
    path('api/mon-dossier/documents/', TeleverserDocumentAPIView.as_view(), name='api_televerser_document'),

    # Cote responsable
    path('api/resp/dossiers/', ListerDossiersAPIView.as_view(), name='api_lister_dossiers'),
    path('api/resp/dossiers/finaliser/', ValiderDossierFinalAPIView.as_view(), name='api_finaliser_dossier'),   # ← AVANT
    path('api/resp/dossiers/<str:matricule>/', DetailDossierAPIView.as_view(), name='api_detail_dossier'),    # ← APRES
    path('api/resp/documents/valider/', ValiderDocumentAPIView.as_view(), name='api_valider_document'),
    path('api/resp/documents/refuser/', RefuserDocumentAPIView.as_view(), name='api_refuser_document'),
]