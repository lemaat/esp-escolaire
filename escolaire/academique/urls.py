# escolaire/academique/urls.py
from django.urls import path
from .views import (
    MesMatieresAPIView,
    CreerEvaluationAPIView,
    GrilleNotesAPIView,
    PublierEvaluationAPIView,
    MesNotesEtudiantAPIView,
    NotesChefDeptAPIView,
    NotesRespPoleAPIView,
)

app_name = "academique"

urlpatterns = [
    # --- Cote professeur ---
    path("api/prof/matieres/", MesMatieresAPIView.as_view(), name="api_prof_matieres"),
    path("api/prof/evaluations/", CreerEvaluationAPIView.as_view(), name="api_prof_creer_evaluation"),
    path("api/prof/evaluations/<int:evaluation_id>/notes/", GrilleNotesAPIView.as_view(), name="api_prof_grille_notes"),
    path("api/prof/evaluations/<int:evaluation_id>/publier/", PublierEvaluationAPIView.as_view(), name="api_prof_publier"),

    # --- Cote consultation (etudiant / chef de dept / resp pole) ---
    path("api/etudiant/notes/", MesNotesEtudiantAPIView.as_view(), name="api_etudiant_notes"),
    path("api/chef/notes/", NotesChefDeptAPIView.as_view(), name="api_chef_notes"),
    path("api/resp-pole/notes/", NotesRespPoleAPIView.as_view(), name="api_resp_pole_notes"),
]