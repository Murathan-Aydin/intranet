# My Driving School - Intranet Auto-ecole

Intranet de gestion d'une auto-ecole. Stack :

- **Backend** : Django 5 + Django REST Framework (SQLite, JWT, Swagger)
- **Frontend** : Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- **DevOps** : Docker + docker-compose

## Lancement avec Docker

```bash
cp .env.example .env
docker compose up --build
```

Une fois les conteneurs en route :

- Front Next.js : http://localhost:3000
- API Django : http://localhost:8000
- Swagger : http://localhost:8000/api/docs/
- Admin Django : http://localhost:8000/admin/

Le seed est lance automatiquement au demarrage du backend (idempotent).

## Comptes de demonstration

Mot de passe de tous les comptes : **`Password123!`**

| Identifiant | Role |
|-------------|------|
| `admin` | Admin |
| `secretary` | Secretary |
| `instructor`, `instructor2` | Instructor |
| `student`, `student2` | Student |

## Lancement sans Docker (local)

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Fonctionnalites couvertes

- **Roles** : Student, Instructor, Secretary, Admin (chaque role voit uniquement ce qu'il doit voir)
- **Planning** : creation/modification/suppression des rendez-vous, blocage si l'eleve n'a plus assez d'heures
- **Forfaits** : ajout par les secretaires, achat en ligne (mock) par les eleves
- **Bonus** : code de la route - les instructeurs creent des series de questions, les eleves jouent
- **Backend** : modeles + fixtures + vues generiques + form classes + moteur de templates Django + routes
- **API REST** documentee via OpenAPI (drf-spectacular)
