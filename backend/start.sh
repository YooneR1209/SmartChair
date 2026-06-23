#!/bin/bash
echo "=== RAILWAY ENV VARS (DB/MYSQL/MARIADB) ==="
env | grep -iE '(MARIADB|MYSQL|DB_|^PORT$|^RAILWAY)' | sort || echo "(none found)"
echo "=== END ==="
echo "=== ALL ENV VARS ==="
env | sort
echo "=== END ALL ==="
echo "Running: python3 manage.py migrate --noinput"
python3 manage.py migrate --noinput
echo "Starting gunicorn on 0.0.0.0:$PORT"
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 4 --log-level debug --timeout 120
