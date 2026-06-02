from django.urls import path
from .views import (
    AnnoncesListAPIView, AnnonceAdminAPIView,
    DemandeLogementAPIView, SoumettreDemandeAPIView,
    TeleverserDocumentLogementAPIView, MonAffectationAPIView,
    BlocListCreateAPIView, BlocDetailAPIView,
    ChambreListCreateAPIView, ChambreDetailAPIView,
    DossierListAdminAPIView, DossierDetailAdminAPIView,
    DecisionDossierAPIView,
    AffectationAdminAPIView, DesaffectationAPIView,
    StatistiquesAPIView,
)

app_name = 'logement'

urlpatterns = [
    # ── Annonces (lecture pour tous, CRUD admin) ──
    path('api/annonces/', AnnoncesListAPIView.as_view(), name='api_annonces'),
    path('api/admin/annonces/', AnnonceAdminAPIView.as_view(), name='api_annonce_create'),
    path('api/admin/annonces/<int:pk>/', AnnonceAdminAPIView.as_view(), name='api_annonce_delete'),

    # ── Espace étudiant ──
    path('api/demande/', DemandeLogementAPIView.as_view(), name='api_demande'),
    path('api/demande/soumettre/', SoumettreDemandeAPIView.as_view(), name='api_soumettre'),
    path('api/demande/documents/', TeleverserDocumentLogementAPIView.as_view(), name='api_doc_upload'),
    path('api/demande/affectation/', MonAffectationAPIView.as_view(), name='api_mon_affectation'),

    # ── Admin — Blocs & Chambres ──
    path('api/admin/blocs/', BlocListCreateAPIView.as_view(), name='api_blocs'),
    path('api/admin/blocs/<int:pk>/', BlocDetailAPIView.as_view(), name='api_bloc_detail'),
    path('api/admin/chambres/', ChambreListCreateAPIView.as_view(), name='api_chambres'),
    path('api/admin/chambres/<int:pk>/', ChambreDetailAPIView.as_view(), name='api_chambre_detail'),

    # ── Admin — Dossiers & Validation ──
    path('api/admin/dossiers/', DossierListAdminAPIView.as_view(), name='api_dossiers_admin'),
    path('api/admin/dossiers/<int:pk>/', DossierDetailAdminAPIView.as_view(), name='api_dossier_detail_admin'),
    path('api/admin/dossiers/<int:pk>/decision/', DecisionDossierAPIView.as_view(), name='api_decision'),

    # ── Admin — Affectations ──
    path('api/admin/affectations/', AffectationAdminAPIView.as_view(), name='api_affectations'),
    path('api/admin/affectations/<int:pk>/', DesaffectationAPIView.as_view(), name='api_desaffectation'),

    # ── Admin — Statistiques ──
    path('api/admin/stats/', StatistiquesAPIView.as_view(), name='api_stats'),
]
