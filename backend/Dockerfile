FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
    python3-pip \
    default-libmysqlclient-dev \
    pkg-config \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN python3 -m pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python3 manage.py collectstatic --noinput

EXPOSE 8000

CMD python3 manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 4 --log-level info --timeout 120
