#!/bin/bash
set -e

echo "=== Running migrations ==="
python manage.py migrate --noinput

echo "=== Collecting static files ==="
python manage.py collectstatic --noinput --clear

echo "=== Starting Gunicorn ==="
gunicorn config.wsgi --bind 0.0.0.0:${PORT:-8000} --workers 4 --log-level info --timeout 120
