from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Utilisateur

# On enregistre le modèle Utilisateur en utilisant le panneau d'administration de base de Django
@admin.register(Utilisateur)
class CustomUserAdmin(UserAdmin):
    # On ajoute notre champ personnalisable "role" pour qu'il apparaisse dans l'éditeur Django
    fieldsets = UserAdmin.fieldsets + (
        ('Informations ESP', {'fields': ('role',)}),
    )