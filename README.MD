# Community Dashboard (DaisyUI + MySQL)

Application Node/Express avec authentification, dashboard DaisyUI et création de cards.

## Démarrage rapide

```bash
docker compose up --build
```

- Application: http://localhost:3000
- MySQL: localhost:3306 (user: `community`, password: `community`)

## Variables d'environnement

Les variables sont définies dans `app/.env.example` (utilisé par Docker Compose) :

- `PORT`
- `SESSION_SECRET`
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

## Structure

- `app/server.js`: serveur Express, auth, dashboard.
- `app/views/`: templates EJS DaisyUI.
- `app/sql/init.sql`: schéma MySQL.
