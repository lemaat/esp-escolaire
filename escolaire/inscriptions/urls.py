# escolaire/inscriptions/urls.py
from django.urls import path
from .views import MonDossierAPIView, TeleverserDocumentAPIView

app_name = 'inscriptions'

urlpatterns = [
    path('api/mon-dossier/', MonDossierAPIView.as_view(), name='api_mon_dossier'),
    path('api/mon-dossier/documents/', TeleverserDocumentAPIView.as_view(), name='api_televerser_document'),
]