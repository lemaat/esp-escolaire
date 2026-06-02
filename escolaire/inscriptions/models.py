# escolaire/inscriptions/models.py
from django.db import models
from django.conf import settings


import os
import uuid

def chemin_document(instance, filename):
    """
    Stocke chaque fichier avec un nom propre, sans caracteres speciaux.
    Format : documents/<matricule>/<type_document>_<uuid>.<extension>
    Exemple : documents/251023/CNI_RECTO_a3f9b2c1.jpg
    """
    matricule = instance.dossier.admis.username
    # Recuperer l'extension originale (jpg, png, pdf)
    _, extension = os.path.splitext(filename)
    extension = extension.lower()
    # Generer un nom propre
    nom_propre = f"{instance.type_document}_{uuid.uuid4().hex[:8]}{extension}"
    return f"documents/{matricule}/{nom_propre}"


class DossierInscription(models.Model):

    class Statut(models.TextChoices):
        EN_ATTENTE = "EN_ATTENTE", "En attente"
        EN_COURS = "EN_COURS", "En cours de traitement"
        VALIDE = "VALIDE", "Validé"
        REFUSE = "REFUSE", "Refusé"

    admis = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="dossier_inscription",
    )
    candidat = models.OneToOneField(
        "accounts.CandidatCNIM",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="dossier",
    )
    statut = models.CharField(
        max_length=20, choices=Statut.choices, default=Statut.EN_ATTENTE,
    )
    cree_le = models.DateTimeField(auto_now_add=True)
    maj_le = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Dossier {self.admis.username} — {self.get_statut_display()}"

    @property
    def tous_documents_valides(self):
        """Pré-condition : les 4 pièces sont validées. N'enclenche rien seul."""
        docs = self.documents.all()
        if docs.count() < 4:
            return False
        return all(d.statut == DocumentJustificatif.Statut.VALIDE for d in docs)


class DocumentJustificatif(models.Model):

    class Type(models.TextChoices):
        CNI_RECTO = "CNI_RECTO", "Carte d'identité — Recto"
        CNI_VERSO = "CNI_VERSO", "Carte d'identité — Verso"
        ACTE_NAISSANCE = "ACTE_NAISSANCE", "Attestation de naissance"
        ATTESTATION_CNIM = "ATTESTATION_CNIM", "Attestation CNIM"

    class Statut(models.TextChoices):
        EN_ATTENTE = "EN_ATTENTE", "En attente"
        VALIDE = "VALIDE", "Validé"
        REFUSE = "REFUSE", "Refusé"

    dossier = models.ForeignKey(
        DossierInscription, on_delete=models.CASCADE, related_name="documents",
    )
    type_document = models.CharField(max_length=20, choices=Type.choices)
    fichier = models.FileField(upload_to=chemin_document)
    statut = models.CharField(
        max_length=20, choices=Statut.choices, default=Statut.EN_ATTENTE,
    )
    motif_refus = models.TextField(blank=True, default="")
    televerse_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("dossier", "type_document")

    def __str__(self):
        return f"{self.get_type_document_display()} — {self.get_statut_display()}"