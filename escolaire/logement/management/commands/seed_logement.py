"""
Management command : python manage.py seed_logement
Crée des données de démonstration pour tester le module logement :
  - 1 compte RESP_LOGEMENT
  - 5 comptes ETUDIANT avec ProfilEtudiant (sexe, date_naissance, département)
  - 4 blocs (2 hommes, 2 femmes)
  - 8 chambres (2 par bloc)
  - 2 annonces
"""
from datetime import date
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import Utilisateur, ProfilEtudiant


class Command(BaseCommand):
    help = "Crée des données de test pour le module logement."

    @transaction.atomic
    def handle(self, *args, **options):
        from logement.models import Bloc, Chambre, Annonce

        # ── Responsable logement ──
        resp, created = Utilisateur.objects.get_or_create(
            username='resp_logement',
            defaults={
                'email': 'resp_logement@esp.mr',
                'role': 'RESP_LOGEMENT',
                'first_name': 'Admin',
                'last_name': 'Logement',
            }
        )
        if created:
            resp.set_password('password123')
            resp.save()
            self.stdout.write(self.style.SUCCESS('Compte resp_logement créé (mdp: password123)'))
        else:
            self.stdout.write('  Compte resp_logement existe déjà.')

        # ── Étudiants ──
        etudiants_data = [
            ('E001', 'Ahmed', 'Ba', 'M', date(2003, 3, 15), 'IRT', 1, 'ahmed@esp.mr'),
            ('E002', 'Fatima', 'Mint Sidi', 'F', date(2004, 7, 22), 'GC', 2, 'fatima@esp.mr'),
            ('E003', 'Mohamed', 'Ould Cheikh', 'M', date(2001, 11, 3), 'GE', 3, 'mohamed@esp.mr'),
            ('E004', 'Mariam', 'Sy', 'F', date(2005, 1, 10), 'SID', 1, 'mariam@esp.mr'),
            ('E005', 'Ousmane', 'Diallo', 'M', date(2002, 5, 28), 'GM', 2, 'ousmane@esp.mr'),
        ]

        for matricule, prenom, nom, sexe, dob, dept, annee, email in etudiants_data:
            user, created = Utilisateur.objects.get_or_create(
                username=matricule,
                defaults={
                    'email': email,
                    'role': 'ETUDIANT',
                    'first_name': prenom,
                    'last_name': nom,
                    'telephone': '22334455',
                }
            )
            if created:
                user.set_password('password123')
                user.save()
                ProfilEtudiant.objects.create(
                    user=user,
                    sexe=sexe,
                    date_naissance=dob,
                    departement=dept,
                    annee=annee,
                )
                self.stdout.write(self.style.SUCCESS(f'  SUCCESS Étudiant {matricule} ({prenom} {nom}) créé'))
            else:
                self.stdout.write(f'  Étudiant {matricule} existe déjà.')

        # ── Blocs ──
        blocs_data = [
            ('Bloc A', 'M', 'Résidence hommes — bâtiment principal'),
            ('Bloc B', 'M', 'Résidence hommes — annexe'),
            ('Bloc C', 'F', 'Résidence femmes — bâtiment principal'),
            ('Bloc D', 'F', 'Résidence femmes — annexe'),
        ]

        for nom, sexe, desc in blocs_data:
            bloc, created = Bloc.objects.get_or_create(
                nom=nom, defaults={'sexe': sexe, 'description': desc}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  SUCCESS Bloc {nom} créé'))
                # Créer 2 chambres par bloc
                for num in range(1, 3):
                    Chambre.objects.create(
                        bloc=bloc,
                        numero=f"{nom[-1]}{num:02d}",
                        capacite=3,
                    )
                    self.stdout.write(f'    Chambre {nom[-1]}{num:02d} créée')

        # ── Annonces ──
        if Annonce.objects.count() == 0:
            Annonce.objects.create(
                titre="Ouverture des demandes de logement 2025-2026",
                contenu="Les étudiants peuvent dès à présent soumettre leur demande de logement "
                        "en ligne via le portail E-Scolaire. Connectez-vous avec votre compte "
                        "étudiant et accédez au module Logement."
            )
            Annonce.objects.create(
                titre="Documents requis pour le dossier de logement",
                contenu="Pour que votre demande soit recevable, vous devez fournir :\n"
                        "1. Un justificatif de scolarité\n"
                        "2. Une copie de votre CNI\n"
                        "3. Une photo d'identité récente\n\n"
                        "Les dossiers incomplets seront refusés."
            )
            self.stdout.write(self.style.SUCCESS('  SUCCESS 2 annonces créées'))

        self.stdout.write(self.style.SUCCESS('\nSeed terminé ! Connectez-vous avec :\n  - resp_logement / password123 (admin logement)\n  - E001 / password123 (étudiant homme)\n  - E002 / password123 (étudiante femme)\n'))
