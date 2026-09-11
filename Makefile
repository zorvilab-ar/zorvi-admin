# Zorvi Admin — comandos de un solo paso
# `make up` levanta TODO: base de datos en Docker, schema, datos iniciales y la app.

.PHONY: up down dev db-up db-wait db-push db-seed reset logs build start install studio ensure-env

up: install ensure-env db-up db-wait db-push db-seed dev

ensure-env:
	@test -f .env.local || cp .env.example .env.local

install:
	pnpm install

db-up:
	docker compose up -d db

db-wait:
	@echo "Esperando a Postgres…"
	@until docker compose exec -T db pg_isready -U zorvi -d zorvi > /dev/null 2>&1; do sleep 1; done
	@echo "Postgres listo."

db-push:
	pnpm drizzle-kit push

db-seed:
	pnpm tsx src/lib/db/seed.ts

dev: ensure-env
	pnpm dev

down:
	docker compose down

# Borra TODOS los datos y vuelve a empezar (pide confirmación)
reset:
	@read -p "Esto BORRA toda la base de datos. ¿Seguro? [y/N] " ok && [ "$$ok" = "y" ]
	docker compose down -v
	$(MAKE) db-up db-wait db-push db-seed

logs:
	docker compose logs -f db

studio:
	pnpm drizzle-kit studio

build:
	pnpm build

start: db-up db-wait
	pnpm start
