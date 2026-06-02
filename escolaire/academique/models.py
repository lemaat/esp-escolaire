# escolaire/academique/models.py
from django.db import models
from django.conf import settings


class Matiere(models.Model):
    """
    Une matière enseignée : soit une matière de département (ex. IRT11),
    soit une matière de tronc commun rattachée à un pôle (ex. ST11, HE12).
    """

    class Semestre(models.TextChoices):
        S1 = "S1", "Semestre 1"
        S2 = "S2", "Semestre 2"

    # Mêmes choix de département que dans accounts.ProfilEtudiant
    # (on reste cohérent avec le reste du projet).
    DEPARTEMENT_CHOICES = [
        ("IRT", "Informatique  Réseaux de Télécommunication"),
        ("GE", "Génie Électrique"),
        ("GM", "Génie Mécanique"),
        ("MPG", "Mines Pétrole et Gaz"),
        ("SID", "Statistiques et Ingenierie des Données"),
        ("GC", "Génie Civil"),
        ("TC", "Tronc Commun"),
    ]

    # Mêmes choix de pôle que dans accounts.ProfilPersonnel
    POLE_CHOICES = [
        ("HE", "Humanités et Entreprise"),
        ("ST", "Sciences et Techniques"),
    ]

    code = models.CharField(max_length=20, unique=True)          # ex. "IRT11"
    nom = models.CharField(max_length=150)                       # ex. "Algorithmique 1"
    departement = models.CharField(max_length=10, choices=DEPARTEMENT_CHOICES)
    # pole : rempli UNIQUEMENT pour les matières de tronc commun (departement = TC).
    # Vide pour les matières de département (supervisées par le chef de dept).
    pole = models.CharField(max_length=10, choices=POLE_CHOICES, blank=True, default="")
    annee = models.IntegerField(default=1)
    semestre = models.CharField(max_length=2, choices=Semestre.choices, default=Semestre.S1)

    # Le professeur qui enseigne la matière (un Utilisateur de rôle PROFESSEUR).
    professeur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="matieres_enseignees",
        limit_choices_to={"role": "PROFESSEUR"},
    )

    def __str__(self):
        return f"{self.code} - {self.nom}"


class Evaluation(models.Model):
    """
    Une évaluation dans une matière : un devoir, un examen ou un TP.
    Le professeur la crée, saisit les notes, puis la PUBLIE.
    Tant que publiee = False, les notes ne sont visibles que du professeur.
    """

    class Type(models.TextChoices):
        DEVOIR = "DEVOIR", "Devoir"
        EXAMEN = "EXAMEN", "Examen"
        TP = "TP", "Travaux pratiques"

    matiere = models.ForeignKey(
        Matiere,
        on_delete=models.CASCADE,
        related_name="evaluations",
    )
    type_evaluation = models.CharField(
        max_length=10, choices=Type.choices, default=Type.DEVOIR,
    )
    titre = models.CharField(max_length=150)                     # ex. "Devoir 1"
    date = models.DateField()
    coefficient = models.DecimalField(max_digits=4, decimal_places=2, default=1)
    publiee = models.BooleanField(default=False)
    cree_le = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.matiere.code} - {self.titre}"


class Note(models.Model):
    """
    La note d'un étudiant pour une évaluation donnée.
    Un étudiant ne peut avoir qu'UNE note par évaluation (unique_together).
    """

    etudiant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notes",
        limit_choices_to={"role": "ETUDIANT"},
    )
    evaluation = models.ForeignKey(
        Evaluation,
        on_delete=models.CASCADE,
        related_name="notes",
    )
    valeur = models.DecimalField(max_digits=4, decimal_places=2)  # note /20, ex. 14.50
    saisie_le = models.DateTimeField(auto_now_add=True)
    maj_le = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("etudiant", "evaluation")

    def __str__(self):
        return f"{self.etudiant.username} - {self.evaluation} : {self.valeur}/20"
