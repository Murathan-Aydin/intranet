DOCKER_COMPOSE := docker compose

.PHONY: help up down logs restart restart-force ps shell-backend shell-frontend migrate makemigrations superuser

help:
	@printf "Available targets:\n"
	@printf "  up              Build and start the full stack (backend + frontend)\n"
	@printf "  down            Stop and remove containers\n"
	@printf "  logs            Tail logs from all services\n"
	@printf "  restart         Restart containers (no rebuild)\n"
	@printf "  restart-force   Rebuild images from scratch and restart\n"
	@printf "  ps              List running services\n"
	@printf "  migrate         Apply Django migrations in backend container\n"
	@printf "  makemigrations  Create Django migration files in backend container\n"
	@printf "  superuser       Create a Django superuser in backend container\n"
	@printf "  shell-backend   Open shell in backend container\n"
	@printf "  shell-frontend  Open shell in frontend container\n"

up:
	$(DOCKER_COMPOSE) up --build -d
	@printf "\nBackend  -> http://localhost:8000\nFrontend -> http://localhost:3000\n"

down:
	$(DOCKER_COMPOSE) down

logs:
	$(DOCKER_COMPOSE) logs -f --tail=100

restart:
	$(DOCKER_COMPOSE) restart

restart-force:
	$(DOCKER_COMPOSE) down
	$(DOCKER_COMPOSE) build --no-cache
	$(DOCKER_COMPOSE) up -d
	@printf "\nBackend  -> http://localhost:8000\nFrontend -> http://localhost:3000\n"

ps:
	$(DOCKER_COMPOSE) ps

migrate:
	$(DOCKER_COMPOSE) exec backend python manage.py migrate

makemigrations:
	$(DOCKER_COMPOSE) exec backend python manage.py makemigrations

superuser:
	$(DOCKER_COMPOSE) exec backend python manage.py createsuperuser

shell-backend:
	$(DOCKER_COMPOSE) exec backend sh

shell-frontend:
	$(DOCKER_COMPOSE) exec frontend sh
