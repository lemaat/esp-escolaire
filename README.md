# Escolaire ESP

Plateforme de gestion académique intégrée pour l'École Supérieure Polytechnique.

Architecture découplée : backend Django REST Framework + frontend React (Vite + Tailwind v4).

---

## Démarrage rapide

### Pré-requis
- Python 3.12+ (ou 3.14 si tu suis la même version que le dépôt)
- Node.js 18+
- Git

### 1. Cloner le dépôt

```bash
git clone https://github.com/lemaat/esp-escolaire.git
cd esp-escolaire
```

### 2. Basculer sur la branche dev

C'est sur `dev` qu'on travaille. La branche `master` est réservée aux versions stables.

```bash
git checkout dev
```

### 3. Backend Django

```bash
cd escolaire

# Créer et activer le venv
python -m venv venv
# Windows :
.\venv\Scripts\Activate.ps1
# Linux/Mac :
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Créer le fichier .env à la racine d'escolaire/ (à côté de manage.py)
# Voir la section "Variables d'environnement" plus bas

# Appliquer les migrations
python manage.py migrate

# Créer un superutilisateur pour accéder à l'admin Django
python manage.py createsuperuser

# Lancer le serveur
python manage.py runserver
```

Le backend tourne sur `http://localhost:8000`.

### 4. Frontend React

Dans **un autre terminal** (laisser Django tourner) :

```bash
cd frontend
npm install
npm run dev
```

Le frontend tourne sur `http://localhost:5173`.

---

## Variables d'environnement

Crée un fichier `escolaire/.env` (jamais committé, déjà dans le `.gitignore`) :

```env
ESP_EMAIL_PASSWORD=ton_mot_de_passe_gmail_application
```

Si tu n'as pas besoin d'envoyer de vrais emails (cas le plus courant en développement), tu peux mettre n'importe quelle valeur — l'envoi ne marchera pas mais le reste tournera. Pour envoyer de vrais emails, génère un "mot de passe d'application" sur ton compte Google (Sécurité → Mots de passe d'application).

---

## Créer des comptes de test

Le projet utilise un modèle `Utilisateur` multi-rôles. Pour tester l'application, tu dois créer toi-même tes comptes.

### Option A : Via l'admin Django (rapide, pour comptes prof/étudiant/responsable)

1. Va sur `http://localhost:8000/admin/`
2. Connecte-toi avec ton superutilisateur
3. Dans la section **Accounts → Utilisateurs**, clique « Ajouter »
4. Remplis :
   - `username` : un identifiant (ex. `prof01`, `etu01`)
   - `password` : un mot de passe de test
   - **Crée**, puis sur la page d'édition, choisis le `role` (ETUDIANT, PROFESSEUR, CHEF_DEPT, RESP_POLE, RESP_INSCRIPTION, RESP_LOGEMENT)
   - Sauvegarde

5. Connecte-toi sur `http://localhost:5173` avec ces identifiants.

### Option B : Via la commande d'import (pour tester le flux ADMIS)

Le rôle `ADMIS` est créé via le module d'inscriptions à partir d'un fichier Excel.

1. Crée un fichier `escolaire/mon_test.xlsx` avec les colonnes :
   `matricule | nom | prenom | email | voie | statut | telephone`
   Et au moins une ligne avec `statut = admis` et **ton vrai email**.

2. Lance l'import :
```bash
   python manage.py importer_admis mon_test.xlsx
```

3. Si l'envoi d'email est configuré (`.env` rempli), tu reçois un email avec un mot de passe temporaire. Sinon, réinitialise le mot de passe manuellement :
```bash
   python manage.py shell
```
```python
   from accounts.models import Utilisateur
   u = Utilisateur.objects.get(username="<matricule>")
   u.set_password("test1234")
   u.save()
```

4. Connecte-toi sur le frontend avec ce compte → tu seras redirigé vers le changement de mot de passe → puis vers la page d'inscription avec stepper et upload.

---

## Structure du projet

```
esp-escolaire/
├── escolaire/                  # Backend Django
│   ├── accounts/               # Utilisateurs & profils (TERMINÉ)
│   ├── inscriptions/           # Module admissions (TERMINÉ — côté admis)
│   ├── academique/             # Notes & bulletins (À DÉVELOPPER)
│   ├── logement/               # Campus militaire (À DÉVELOPPER)
│   ├── reclamations/           # Réclamations (À DÉVELOPPER)
│   ├── ressources/             # Ressources pédagogiques (À DÉVELOPPER)
│   ├── escolaire/              # Config (settings, urls)
│   ├── manage.py
│   └── requirements.txt
└── frontend/                   # React + Vite + Tailwind v4
    └── src/
        ├── pages/
        │   ├── login.jsx
        │   ├── ChangerMotDePasse.jsx
        │   └── espaces/        # Un dashboard par rôle
        ├── components/         # Composants partagés
        ├── App.jsx
        └── index.css           # Palette ESP (@theme)
```

---

## Convention de développement

### Workflow Git

- **`master`** : branche stable. Aucun commit direct.
- **`dev`** : branche d'intégration. Vos branches fusionnent ici.
- **`feature/xxx`** : une branche par fonctionnalité.

Exemple pour développer le module Notes :
```bash
git checkout dev
git pull
git checkout -b feature/notes
# ... tu codes, tu commits ...
git push -u origin feature/notes
# Puis Pull Request vers dev sur GitHub
```

### Palette de couleurs

Toutes les couleurs sont dans `frontend/src/index.css` via la directive `@theme` de Tailwind v4. **Utiliser uniquement** les classes `bg-esp-*`, `text-esp-*`, etc. Jamais de couleurs arbitraires (`bg-blue-500` interdit).

| Classe | Usage |
|---|---|
| `esp-green` | Couleur primaire (boutons, liens) |
| `esp-gold` | Accents (étapes actives, badges) |
| `esp-red` | **Sémantique uniquement** — erreurs, refus |

### Conventions de code

- **Une fonctionnalité = une branche Git** + Pull Request
- **Commits clairs** : `Module : ce que fait le commit`
- **Backend** : routes API sous `/[app]/api/`, réponses JSON
- **Frontend** : `credentials: 'include'` + `X-CSRFToken` sur tous les POST
- **Pas de secrets dans le code** : utiliser `.env` (déjà ignoré)

---

## État du projet (Sprint 2)

| Module | Statut | Responsable |
|---|---|---|
| Authentification & login | ✅ Terminé | Lemat |
| Inscriptions (admis) | ✅ Terminé | Lemat |
| Inscriptions (responsable) | ✅ Terminé | Lemat |
| Académique (notes) | 🔄 En cours | Moctar, Mariem |
| Logement | 🔄 En cours | Sara |
| Réclamations | ⏳ À démarrer | À attribuer |
| Ressources | ⏳ À démarrer | À attribuer |
| UI/UX dashboards | 🔄 Squelettes | Toute l'équipe |

Voir `escolaire_esp_avancement.pdf` pour le détail des tâches attribuables.

