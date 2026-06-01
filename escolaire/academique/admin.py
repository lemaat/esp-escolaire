

# Register your models here.
# escolaire/academique/admin.py
from django.contrib import admin
from .models import Matiere, Evaluation, Note


@admin.register(Matiere)
class MatiereAdmin(admin.ModelAdmin):
    list_display = ("code", "nom", "departement", "pole", "annee", "semestre", "professeur")
    list_filter = ("departement", "pole", "semestre", "annee")
    search_fields = ("code", "nom")


@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = ("titre", "matiere", "type_evaluation", "date", "coefficient", "publiee")
    list_filter = ("type_evaluation", "publiee", "matiere")


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ("etudiant", "evaluation", "valeur", "saisie_le")
    list_filter = ("evaluation__matiere",)
    search_fields = ("etudiant__username",)