from rest_framework import serializers
from .models import Bloc, Chambre, DossierLogement, DocumentLogement, Affectation, Annonce


class BlocSerializer(serializers.ModelSerializer):
    nombre_chambres = serializers.SerializerMethodField()

    class Meta:
        model = Bloc
        fields = ['id', 'nom', 'sexe', 'description', 'nombre_chambres']

    def get_nombre_chambres(self, obj):
        return obj.chambres.count()


class ChambreSerializer(serializers.ModelSerializer):
    bloc_nom = serializers.CharField(source='bloc.nom', read_only=True)
    bloc_sexe = serializers.CharField(source='bloc.sexe', read_only=True)
    places_occupees = serializers.IntegerField(read_only=True)
    places_restantes = serializers.IntegerField(read_only=True)
    est_disponible = serializers.BooleanField(read_only=True)

    class Meta:
        model = Chambre
        fields = [
            'id', 'bloc', 'bloc_nom', 'bloc_sexe', 'numero',
            'capacite', 'etat', 'places_occupees', 'places_restantes',
            'est_disponible',
        ]


class ChambreCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chambre
        fields = ['id', 'bloc', 'numero', 'capacite', 'etat']


class DocumentLogementSerializer(serializers.ModelSerializer):
    fichier_url = serializers.SerializerMethodField()

    class Meta:
        model = DocumentLogement
        fields = ['id', 'type_document', 'fichier_url', 'date_upload']

    def get_fichier_url(self, obj):
        if obj.fichier:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.fichier.url)
            return obj.fichier.url
        return None


class DossierLogementSerializer(serializers.ModelSerializer):
    documents = DocumentLogementSerializer(many=True, read_only=True)
    etudiant_info = serializers.SerializerMethodField()

    class Meta:
        model = DossierLogement
        fields = [
            'id', 'etudiant', 'date_creation', 'statut',
            'commentaire_admin', 'documents', 'etudiant_info',
        ]
        read_only_fields = ['etudiant', 'date_creation', 'statut']

    def get_etudiant_info(self, obj):
        user = obj.etudiant
        info = {
            'matricule': user.username,
            'nom': user.last_name,
            'prenom': user.first_name,
            'email': user.email,
            'telephone': user.telephone,
        }
        if hasattr(user, 'profil_etudiant'):
            profil = user.profil_etudiant
            info.update({
                'sexe': profil.sexe,
                'sexe_display': profil.get_sexe_display() if profil.sexe else '',
                'date_naissance': str(profil.date_naissance) if profil.date_naissance else None,
                'age': profil.age,
                'departement': profil.departement,
                'departement_display': profil.get_departement_display(),
                'annee': profil.annee,
                'statut_etudiant': profil.statut,
            })
        return info


class DossierLogementListSerializer(serializers.ModelSerializer):
    """Version légère pour la liste admin (sans les documents)."""
    etudiant_info = serializers.SerializerMethodField()

    class Meta:
        model = DossierLogement
        fields = [
            'id', 'date_creation', 'statut',
            'commentaire_admin', 'etudiant_info',
        ]

    def get_etudiant_info(self, obj):
        user = obj.etudiant
        info = {
            'matricule': user.username,
            'nom': user.last_name,
            'prenom': user.first_name,
        }
        if hasattr(user, 'profil_etudiant'):
            profil = user.profil_etudiant
            info.update({
                'sexe': profil.sexe,
                'departement': profil.departement,
                'departement_display': profil.get_departement_display(),
                'annee': profil.annee,
            })
        return info


class OccupantSerializer(serializers.Serializer):
    """Sérialiseur pour afficher les occupants d'une chambre."""
    matricule = serializers.CharField()
    nom_complet = serializers.CharField()
    age = serializers.IntegerField(allow_null=True)
    departement = serializers.CharField()
    departement_display = serializers.CharField()
    annee = serializers.IntegerField()


class ChambreDetailSerializer(serializers.ModelSerializer):
    bloc_nom = serializers.CharField(source='bloc.nom', read_only=True)
    bloc_sexe = serializers.CharField(source='bloc.sexe', read_only=True)
    places_occupees = serializers.IntegerField(read_only=True)
    places_restantes = serializers.IntegerField(read_only=True)
    occupants = serializers.SerializerMethodField()

    class Meta:
        model = Chambre
        fields = [
            'id', 'bloc', 'bloc_nom', 'bloc_sexe', 'numero',
            'capacite', 'etat', 'places_occupees', 'places_restantes',
            'occupants',
        ]

    def get_occupants(self, obj):
        occupants = []
        for aff in obj.affectations.select_related('etudiant__profil_etudiant').all():
            user = aff.etudiant
            profil = getattr(user, 'profil_etudiant', None)
            occupants.append({
                'matricule': user.username,
                'nom_complet': f"{user.first_name} {user.last_name}",
                'age': profil.age if profil else None,
                'departement': profil.departement if profil else '',
                'departement_display': profil.get_departement_display() if profil else '',
                'annee': profil.annee if profil else 0,
            })
        return occupants


class AffectationSerializer(serializers.ModelSerializer):
    chambre_info = serializers.SerializerMethodField()
    etudiant_info = serializers.SerializerMethodField()

    class Meta:
        model = Affectation
        fields = ['id', 'etudiant', 'chambre', 'date_affectation', 'chambre_info', 'etudiant_info']
        read_only_fields = ['date_affectation']

    def get_chambre_info(self, obj):
        return {
            'numero': obj.chambre.numero,
            'bloc_nom': obj.chambre.bloc.nom,
            'bloc_sexe': obj.chambre.bloc.sexe,
            'capacite': obj.chambre.capacite,
            'places_occupees': obj.chambre.places_occupees,
            'places_restantes': obj.chambre.places_restantes,
        }

    def get_etudiant_info(self, obj):
        user = obj.etudiant
        info = {
            'matricule': user.username,
            'nom': user.last_name,
            'prenom': user.first_name,
        }
        if hasattr(user, 'profil_etudiant'):
            profil = user.profil_etudiant
            info.update({
                'sexe': profil.sexe,
                'departement': profil.departement,
                'annee': profil.annee,
            })
        return info


class AnnonceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Annonce
        fields = ['id', 'titre', 'contenu', 'date_publication']
        read_only_fields = ['date_publication']
