from django.db import models
from django.contrib.auth.models import AbstractUser

class Utilisateur(AbstractUser):
    ROLE_CHOICES = [
        ('ADMIS', 'Admis (inscription en cours)'),
        ('ETUDIANT', 'Etudiant'),
        ('PROFESSEUR', 'Professeur'),
        ('CHEF_DEPT', 'Chef de département'),
        ('RESP_POLE', 'Responsable de pôle'),
        ('RESP_INSCRIPTION', 'Responsable inscriptions'),
        ('RESP_LOGEMENT', 'Responsable logement'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    telephone = models.CharField(max_length=20, blank=True)
    doit_changer_mdp = models.BooleanField(default=False) 
    email_institutionnel = models.EmailField(
        blank=True,
        default="",
        help_text="Email officiel ESP genere a la validation finale (matricule@esp.mr)",
    )
    
    def __str__(self):
        return f"{self.username} - {self.role}"

class CandidatCNIM(models.Model):
    VOIE_CHOICES = [
        (1, 'Classes préparatoires'),
        (2, 'Licence professionnelle'),
    ]
    STATUT_CHOICES = [
        ('ADMIS', 'Admis'),
        ('NON_ADMIS', 'Non admis'),
    ]
    
    matricule_cnim = models.CharField(max_length=20, unique=True)
    voie = models.IntegerField(choices=VOIE_CHOICES)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES)
    email = models.EmailField(unique=True)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    telephone = models.CharField(max_length=20, blank=True, default="")   # ← AJOUTER
    
    def __str__(self):
        return f"{self.matricule_cnim} - {self.nom} {self.prenom}"

class ProfilEtudiant(models.Model):
    STATUT_CHOICES = [
        ('ACTIF', 'Actif'),
        ('REDOUBLANT', 'Redoublant'),
        ('EXCLU', 'Exclu'),
    ]
    DEPARTEMENT_CHOICES = [
        ('IRT', 'Informatique et Réseaux de Télécommunication'),
        ('GE', 'Génie Électrique'),
        ('GM', 'Génie Mécanique'),
        ('MPG', 'Mathématiques et Physique pour l\'Ingénieur'),
        ('SID', 'Systèmes d\'Information et de Décision'),
        ('GC', 'Génie Civil'),
        ('TC', 'Tronc Commun'),
    ]
    SEXE_CHOICES = [
        ('M', 'Masculin'),
        ('F', 'Féminin'),
    ]

    user = models.OneToOneField(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name='profil_etudiant'
    )
    candidat = models.OneToOneField(
        CandidatCNIM,
        on_delete=models.SET_NULL,
        null=True,
        related_name='profil'
    )
    annee = models.IntegerField(default=1)
    departement = models.CharField(max_length=10, choices=DEPARTEMENT_CHOICES, default='TC')
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='ACTIF')
    date_inscription = models.DateField(auto_now_add=True)
    sexe = models.CharField(max_length=1, choices=SEXE_CHOICES, blank=True, default='')
    date_naissance = models.DateField(null=True, blank=True)

    @property
    def age(self):
        from datetime import date
        if not self.date_naissance:
            return None
        today = date.today()
        return today.year - self.date_naissance.year - (
            (today.month, today.day) < (self.date_naissance.month, self.date_naissance.day)
        )

    def __str__(self):
        return f"{self.user.username} - {self.departement} - Année {self.annee}"
    
class ProfilPersonnel(models.Model):
    """ Profil pour les Professeurs, Chefs de Dept et Responsables de Pôles """
    
    # Choix des deux pôles de tronc commun pour le Responsable de Pôle
    POLE_TRONC_COMMUN_CHOICES = [
        ('HE', 'Humanités et Entreprise'),
        ('ST', 'Sciences et Techniques'),
    ]
    
    DEPARTEMENT_CHOICES = ProfilEtudiant.DEPARTEMENT_CHOICES[:-1] # On exclut 'TC'

    user = models.OneToOneField(
        Utilisateur, 
        on_delete=models.CASCADE, 
        related_name='profil_personnel'
    )
    specialite = models.CharField(max_length=100, blank=True, help_text="Ex: Algorithmique, Électronique, Anglais")
    bureau = models.CharField(max_length=50, blank=True)
    
    # --- Rôles de Management ---
    # Rempli uniquement si role == 'RESP_POLE' (gère soit HE, soit ST)
    pole_gere = models.CharField(max_length=10, choices=POLE_TRONC_COMMUN_CHOICES, blank=True, null=True)
    
    # Rempli uniquement si role == 'CHEF_DEPT' (gère un des 6 départements de SP)
    departement_gere = models.CharField(max_length=10, choices=DEPARTEMENT_CHOICES, blank=True, null=True)

    def __str__(self):
        if self.user.role == 'CHEF_DEPT':
            return f"Chef Dept {self.departement_gere} - {self.user.last_name}"
        elif self.user.role == 'RESP_POLE':
            return f"Responsable Pôle {self.pole_gere} - {self.user.last_name}"
        return f"Prof. {self.user.last_name} ({self.specialite})"