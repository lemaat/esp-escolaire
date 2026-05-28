# Escolaire — Système de Gestion Scolaire ESP

## Contexte
Application web de gestion scolaire pour l'École Supérieure Polytechnique (ESP) de Nouakchott.  
Digitalisation complète de la gestion des inscriptions, notes, logement, réclamations et ressources pédagogiques.

## Equipe
| Membre | Rôle | Apps |
|--------|------|------|
| Lemat (Chef de projet) | Lead dev + intégration | `accounts` |
| Membre 2 | Dev backend | `inscriptions`, `reclamations` |
| Membre 3 | Dev backend | `academique`, `ressources` |
| Membre 4 | Dev backend + frontend | `logement`, templates |

## Méthodologie
Agile Scrum — 2 sprints d'une semaine

### Sprint 1 — Semaine 1 (modèles & socle)
- [x] Structure du projet Django
- [x] Création des apps
- [ ] Modèles `accounts` (Utilisateur, ProfilEtudiant, CandidatCNIM)
- [ ] Authentification (login, logout, rôles)
- [ ] Modèles `inscriptions` (Dossier, Documents, CodeAcces)
- [ ] Modèles `academique` (Semestre, Module, Matiere, Note, Bulletin)
- [ ] Modèles `logement` (Bloc, Chambre, Affectation, Annonce)

### Sprint 2 — Semaine 2 (vues, templates & intégration)
- [ ] Vues + templates inscription
- [ ] Vues + templates notes + bulletin PDF
- [ ] Vues + templates logement + annonces
- [ ] Réclamations
- [ ] Ressources pédagogiques
- [ ] Intégration générale + tests

## Stack technique
- **Backend** : Django 4.x / Python 3.11+
- **Base de données** : SQLite (dev) / PostgreSQL (prod)
- **PDF** : ReportLab ou WeasyPrint
- **Versioning** : Git / GitHub
- **Environnement** : venv

## Installation

```bash
git clone https://github.com/votre-compte/escolaire.git
cd escolaire
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / Mac
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Structure du projet

```
escolaire/
├── accounts/       # Utilisateurs, rôles, authentification
├── inscriptions/   # Candidats CNIM, dossiers, validation
├── academique/     # Modules, matières, notes, bulletins
├── logement/       # Blocs, chambres, affectations, annonces
├── reclamations/   # Réclamations de notes
├── ressources/     # Ressources pédagogiques
├── escolaire/      # Configuration Django
├── manage.py
└── requirements.txt
```

## Workflow Git

```bash
# Chaque matin
git checkout dev
git pull origin dev
git checkout feature/ma-tache
git merge dev

# Chaque soir
git add .
git commit -m "feat(app): description"
git push origin feature/ma-tache
# ouvrir une Pull Request sur GitHub vers dev
```

## Convention de commits
```
feat(app): nouvelle fonctionnalité
fix(app): correction de bug
chore: config, dépendances
```

---
*Projet Génie Logiciel — ESP Nouakchott — 2025/2026*