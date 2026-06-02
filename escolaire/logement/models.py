from django.db import models
from django.conf import settings


class Bloc(models.Model):
    SEXE_CHOICES = [
        ('M', 'Hommes'),
        ('F', 'Femmes'),
    ]

    nom = models.CharField(max_length=100, unique=True)
    sexe = models.CharField(max_length=1, choices=SEXE_CHOICES)
    description = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['nom']

    def __str__(self):
        return f"{self.nom} ({self.get_sexe_display()})"


class Chambre(models.Model):
    ETAT_CHOICES = [
        ('DISPONIBLE', 'Disponible'),
        ('COMPLETE', 'Complète'),
        ('MAINTENANCE', 'Maintenance'),
    ]

    bloc = models.ForeignKey(
        Bloc,
        on_delete=models.CASCADE,
        related_name='chambres'
    )
    numero = models.CharField(max_length=20)
    capacite = models.PositiveIntegerField(default=2)
    etat = models.CharField(
        max_length=20,
        choices=ETAT_CHOICES,
        default='DISPONIBLE'
    )

    class Meta:
        unique_together = ('bloc', 'numero')
        ordering = ['bloc__nom', 'numero']

    @property
    def places_occupees(self):
        return self.affectations.count()

    @property
    def places_restantes(self):
        return max(0, self.capacite - self.places_occupees)

    @property
    def est_disponible(self):
        return self.etat == 'DISPONIBLE' and self.places_restantes > 0

    def __str__(self):
        return f"Chambre {self.numero} - {self.bloc.nom}"


def chemin_document_logement(instance, filename):
    """Upload path: logement/documents/<username>/<filename>"""
    username = instance.dossier.etudiant.username
    return f"logement/documents/{username}/{filename}"


class DossierLogement(models.Model):
    STATUT_CHOICES = [
        ('BROUILLON', 'Brouillon'),
        ('SOUMIS', 'Soumis'),
        ('EXAMEN', 'En cours d\'examen'),
        ('ACCEPTE', 'Accepté'),
        ('REFUSE', 'Refusé'),
        ('AFFECTE', 'Affecté'),
    ]

    etudiant = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='dossier_logement'
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(
        max_length=30,
        choices=STATUT_CHOICES,
        default='BROUILLON'
    )
    commentaire_admin = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-date_creation']

    def __str__(self):
        return f"Dossier logement {self.etudiant.username} — {self.get_statut_display()}"


class DocumentLogement(models.Model):
    TYPE_CHOICES = [
        ('SCOLARITE', 'Justificatif de scolarité'),
        ('CNI', 'Copie de la CNI'),
        ('PHOTO', 'Photo d\'identité'),
        ('COMPLEMENTAIRE', 'Document complémentaire'),
    ]

    dossier = models.ForeignKey(
        DossierLogement,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    type_document = models.CharField(max_length=100, choices=TYPE_CHOICES)
    fichier = models.FileField(upload_to=chemin_document_logement)
    date_upload = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['type_document']

    def __str__(self):
        return f"{self.get_type_document_display()} — {self.dossier.etudiant.username}"


class Affectation(models.Model):
    etudiant = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='affectation_logement'
    )
    chambre = models.ForeignKey(
        Chambre,
        on_delete=models.CASCADE,
        related_name='affectations'
    )
    date_affectation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_affectation']

    def __str__(self):
        return f"{self.etudiant.username} → {self.chambre}"


class Annonce(models.Model):
    titre = models.CharField(max_length=255)
    contenu = models.TextField()
    date_publication = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_publication']

    def __str__(self):
        return self.titre
