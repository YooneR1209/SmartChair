<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->

# SmartChair - Academic Conference Management

## Stack
- **Backend:** Django 5.2 + Django REST Framework + SimpleJWT
- **Frontend:** React (Vite) + Tailwind CSS
- **Database:** MariaDB (Railway)
- **Deploy:** Railway (2 servicios separados: frontend + backend)

## Estructura
- `/backend/` - Django API (config/urls.py, config/settings.py)
- `/frontend/` - React SPA (src/modules/auth/pages/Login.jsx)
- Rama principal: `develop` (protegida, requiere PR)
- Rama de trabajo: `feature/payments`

## Estado del proyecto
- URL frontend: https://heartfelt-curiosity-production-2dc9.up.railway.app
- URL backend: https://smartchair-production-2687.up.railway.app
- Login: registro funciona, login da error 500
- Base de datos: MariaDB en Railway (usuario `railway`, DB `railway`)

## Problema actual (Junio 2026)
- Backend tiene `MARIADB_HOST` y `MARIADB_PORT` como shared vars desde MariaDB
- Conexión falla: `smartchair.railway.internal:3306` → Connection refused
- `MARIADB_PRIVATE_URL` no está disponible en backend (servicios no vinculados)
- Solución real: vincular MariaDB service → backend en Railway dashboard
- Solución código (workaround): `MARIADB_PUBLIC_HOST`/`MARIADB_PUBLIC_PORT` agregados como fallback en settings.py
- Se agregó `pymysql` como driver alternativo y `DATABASE_URL`/`MARIADB_PRIVATE_URL` a las variables chequeadas

## Configuración DB en settings.py
- Variable `DB_URL` chequea: DATABASE_URL → MARIADB_URL → MARIADB_PRIVATE_URL → MYSQL_URL
- Fallback individual: MARIADB_HOST → MYSQLHOST → MYSQL_HOST → MYSQL_ADDON_HOST → MARIADB_PUBLIC_HOST → DB_HOST
- SSL activado para hosts remotos
- Regex URL acepta mysql:// y mariadb://

## Enlaces Railway
- MariaDB Host: reseau.proxy.rlwy.net:13834 (público)
- MariaDB DB: railway
- MariaDB User: railway
- MariaDB Password (público): ~uDkrSjkpV6U7EU58lF9.6ZgCD824ZF4
