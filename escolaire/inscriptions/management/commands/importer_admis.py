# inscriptions/management/commands/importer_admis.py
import secrets
import string

from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction

import openpyxl

from accounts.models import Utilisateur, CandidatCNIM
from inscriptions.models import DossierInscription


def generer_mot_de_passe(longueur=10):
    """Mot de passe temporaire sans caractères ambigus (0/O, 1/l/I, etc.)."""
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
    return "".join(secrets.choice(alphabet) for _ in range(longueur))

class Command(BaseCommand):
    help = "Importe la liste des candidats CNIM depuis un fichier Excel."

    def add_arguments(self, parser):
        parser.add_argument("fichier", type=str, help="Chemin du fichier .xlsx")

    def handle(self, *args, **options):
        chemin = options["fichier"]

        try:
            classeur = openpyxl.load_workbook(chemin)
        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(f"Fichier introuvable : {chemin}"))
            return

        feuille = classeur.active

        comptes_crees = 0
        candidats_importes = 0
        ignores = 0

        # iter_rows : on saute la ligne d'entête (min_row=2)
        for ligne in feuille.iter_rows(min_row=2, values_only=True):
            # Ligne vide -> on arrête
            if ligne is None or ligne[0] is None:
                continue

            matricule, nom, prenom, email, voie, statut = ligne

            # Nettoyage minimal
            matricule = str(matricule).strip()
            statut = str(statut).strip().upper()

            # --- 1. Créer / mettre à jour le CandidatCNIM ---
            candidat, cree = CandidatCNIM.objects.get_or_create(
                matricule_cnim=matricule,
                defaults={
                    "nom": str(nom).strip(),
                    "prenom": str(prenom).strip(),
                    "email": str(email).strip(),
                    "voie": int(voie),
                    "statut": statut,
                },
            )
            if cree:
                candidats_importes += 1

            # --- 2. Si NON_ADMIS : pas de compte ---
            if statut != "ADMIS":
                ignores += 1
                continue

            # --- 3. Si le compte existe déjà : on ne recrée pas ---
            if Utilisateur.objects.filter(username=matricule).exists():
                self.stdout.write(f"  Compte déjà existant : {matricule}")
                continue

            # --- 4. Créer le compte admis ---
            mot_de_passe = generer_mot_de_passe()

            with transaction.atomic():
                user = Utilisateur.objects.create_user(
                    username=matricule,
                    email=str(email).strip(),
                    password=mot_de_passe,
                    role="ADMIS",
                    doit_changer_mdp=True,
                )
                DossierInscription.objects.create(
                    admis=user,
                    candidat=candidat,
                )

            comptes_crees += 1

            # --- 5. Envoyer l'email d'identifiants ---
            self.envoyer_email(email, prenom, matricule, mot_de_passe)

        # Bilan
        self.stdout.write(self.style.SUCCESS(
            f"\nImport terminé : {candidats_importes} candidats importés, "
            f"{comptes_crees} comptes admis créés, {ignores} non-admis ignorés."
        ))

    def envoyer_email(self, email, prenom, matricule, mot_de_passe):
        sujet = "Votre admission à l'ESP — Identifiants de connexion"
        message = (
            f"Bonjour {prenom},\n\n"
            f"Félicitations pour votre admission à l'École Supérieure "
            f"Polytechnique.\n\n"
            f"Voici vos identifiants pour finaliser votre inscription :\n"
            f"  Matricule (identifiant) : {matricule}\n"
            f"  Mot de passe temporaire : {mot_de_passe}\n\n"
            f"Ce mot de passe est temporaire : vous devrez en définir un "
            f"nouveau dès votre première connexion.\n\n"
            f"Connectez-vous sur le portail pour téléverser vos documents.\n\n"
            f"Service des Inscriptions — ESP"
        )
        try:
            send_mail(
                sujet, message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
        except Exception as e:
            self.stderr.write(self.style.WARNING(
                f"  Email non envoyé à {email} : {e}"
            ))