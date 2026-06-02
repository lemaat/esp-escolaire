from django.contrib import admin
from .models import Bloc, Chambre, DossierLogement, DocumentLogement, Affectation, Annonce


@admin.register(Bloc)
class BlocAdmin(admin.ModelAdmin):
    list_display = ('nom', 'sexe', 'description')
    list_filter = ('sexe',)


@admin.register(Chambre)
class ChambreAdmin(admin.ModelAdmin):
    list_display = ('numero', 'bloc', 'capacite', 'etat')
    list_filter = ('etat', 'bloc')


class DocumentInline(admin.TabularInline):
    model = DocumentLogement
    extra = 0


@admin.register(DossierLogement)
class DossierLogementAdmin(admin.ModelAdmin):
    list_display = ('etudiant', 'statut', 'date_creation')
    list_filter = ('statut',)
    search_fields = ('etudiant__username', 'etudiant__first_name', 'etudiant__last_name')
    inlines = [DocumentInline]


@admin.register(Affectation)
class AffectationAdmin(admin.ModelAdmin):
    list_display = ('etudiant', 'chambre', 'date_affectation')
    list_filter = ('chambre__bloc',)


@admin.register(Annonce)
class AnnonceAdmin(admin.ModelAdmin):
    list_display = ('titre', 'date_publication')
    ordering = ('-date_publication',)
