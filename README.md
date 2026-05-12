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

## Deploiement en production (Coolify)

Stack: `docker-compose.prod.yml` (backend Gunicorn + WhiteNoise, frontend Next.js standalone, SQLite sur volume persistant).

### Etapes Coolify

1. **Nouvelle application** -> "Docker Compose" -> pointer le repo git.
2. **Compose file path** : `docker-compose.prod.yml`.
3. **Environment variables** : copier le contenu de `.env.prod.example` et remplir les valeurs.
   - `DJANGO_SECRET_KEY` : generer une cle longue aleatoire.
   - `DJANGO_CSRF_TRUSTED_ORIGINS` / `DJANGO_CORS_ALLOWED_ORIGINS` : URLs publiques HTTPS (Coolify les attribue apres le 1er deploy).
   - `NEXT_PUBLIC_API_BASE_URL` : URL publique du backend (figee au build, redeployer si elle change).
   - `FRONTEND_BASE_URL` : URL publique du frontend (utilisee dans les emails d'invitation).
4. **Domains / Ports** : exposer `frontend` sur 3000 et `backend` sur 8000, chacun avec son sous-domaine (ex. `app.*.sslip.io` et `api.*.sslip.io`). Coolify gere HTTPS via Traefik.
5. **Persistent storage** : le volume nomme `sqlite_data` est cree automatiquement (chemin `/app/data` dans le conteneur backend). A sauvegarder regulierement.
6. **Deploy**. Les migrations s'executent au demarrage du backend via l'entrypoint.

### Premier admin en prod

Le seed n'est PAS execute en prod. Creer un superuser apres le premier deploy :

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

### Test prod en local

```bash
cp .env.prod.example .env.prod
# editer .env.prod
docker compose -f docker-compose.prod.yml --env-file .env.prod up --build
```

## Fonctionnalites couvertes

- **Roles** : Student, Instructor, Secretary, Admin (chaque role voit uniquement ce qu'il doit voir)
- **Planning** : creation/modification/suppression des rendez-vous, blocage si l'eleve n'a plus assez d'heures
- **Forfaits** : ajout par les secretaires, achat en ligne (mock) par les eleves
- **Bonus** : code de la route - les instructeurs creent des series de questions, les eleves jouent
- **Backend** : modeles + fixtures + vues generiques + form classes + moteur de templates Django + routes
- **API REST** documentee via OpenAPI (drf-spectacular)
