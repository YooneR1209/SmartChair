import os
from pathlib import Path
from dotenv import load_dotenv
from datetime import timedelta

try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent.parent / '.env')

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'insecure-dev-key')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
if os.getenv('RAILWAY_PUBLIC_DOMAIN'):
    ALLOWED_HOSTS.append(os.getenv('RAILWAY_PUBLIC_DOMAIN'))
CSRF_TRUSTED_ORIGINS = os.getenv('CSRF_TRUSTED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',')

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'corsheaders',
    'django_filters',
    'rest_framework_simplejwt.token_blacklist',
]

LOCAL_APPS = [
    'apps.core',
    'apps.accounts',
    'apps.conferences',
    'apps.submissions',
    'apps.reviews',
    'apps.payments',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS + ["apps.notifications.apps.NotificationsConfig"]

try:
    import whitenoise
    WHITENOISE_AVAILABLE = True
except ImportError:
    WHITENOISE_AVAILABLE = False

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
]

if WHITENOISE_AVAILABLE:
    MIDDLEWARE += ['whitenoise.middleware.WhiteNoiseMiddleware']

MIDDLEWARE += [
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Railway MariaDB env vars (any naming convention)
DB_HOST = (
    os.getenv('MARIADB_HOST')
    or os.getenv('MYSQLHOST')
    or os.getenv('MYSQL_HOST')
    or os.getenv('MYSQL_ADDON_HOST')
    or os.getenv('MARIADB_PUBLIC_HOST')
    or os.getenv('DB_HOST')
)
DB_PORT = (
    os.getenv('MARIADB_PORT')
    or os.getenv('MYSQLPORT')
    or os.getenv('MYSQL_PORT')
    or os.getenv('MYSQL_ADDON_PORT')
    or os.getenv('MARIADB_PUBLIC_PORT')
    or os.getenv('DB_PORT')
)
DB_NAME = (
    os.getenv('MARIADB_DATABASE')
    or os.getenv('MARIADB_DB')
    or os.getenv('MYSQLDATABASE')
    or os.getenv('MYSQL_DATABASE')
    or os.getenv('MYSQL_ADDON_DB')
    or os.getenv('DB_NAME')
)
DB_USER = (
    os.getenv('MARIADB_USER')
    or os.getenv('MYSQLUSER')
    or os.getenv('MYSQL_USER')
    or os.getenv('MYSQL_ADDON_USER')
    or os.getenv('DB_USER')
)
DB_PASS = (
    os.getenv('MARIADB_PASSWORD')
    or os.getenv('MARIADB_PWD')
    or os.getenv('MYSQLPASSWORD')
    or os.getenv('MYSQL_PASSWORD')
    or os.getenv('MYSQL_ADDON_PASSWORD')
    or os.getenv('DB_PASSWORD')
)
DB_URL = os.getenv('DATABASE_URL') or os.getenv('MARIADB_URL') or os.getenv('MARIADB_PRIVATE_URL') or os.getenv('MYSQL_URL')

if DB_URL:
    from urllib.parse import urlparse, unquote
    parsed = urlparse(DB_URL)
    if parsed.scheme in ('mysql', 'mariadb') and parsed.hostname and parsed.port:
        DB_NAME = parsed.path.lstrip('/').split('?')[0]
        DB_USER = unquote(parsed.username or '')
        DB_PASS = unquote(parsed.password or '')
        DB_HOST = parsed.hostname
        DB_PORT = str(parsed.port)

import sys
print(f"[DEBUG] DB config -> HOST={DB_HOST!r} PORT={DB_PORT!r} NAME={DB_NAME!r} USER={DB_USER!r} PASS={'***' if DB_PASS else '(empty)'} URL={DB_URL!r}", file=sys.stderr)

DB_SSL = DB_HOST not in ('localhost', '127.0.0.1', '')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': DB_NAME or 'smartchair_db',
        'USER': DB_USER or 'root',
        'PASSWORD': DB_PASS or '',
        'HOST': DB_HOST or 'localhost',
        'PORT': DB_PORT or '3306',
        'OPTIONS': {
            'charset': 'utf8mb4',
        },
    }
}

if DB_SSL:
    # For Railway internal connections, disable SSL verification
    # Railway's internal network uses self-signed certificates
    DATABASES['default']['OPTIONS']['ssl'] = {'check_hostname': False, 'verify_cert': False}

AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=2),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ✅ CORS
CORS_ALLOWED_ORIGINS = [url.rstrip('/') for url in os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174').split(',')]
CORS_ALLOW_CREDENTIALS = True

LANGUAGE_CODE = 'es-ec'
TIME_ZONE = 'America/Guayaquil'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
if WHITENOISE_AVAILABLE:
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Email
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = "no-reply@smartchair.local"

# Stripe
STRIPE_PUBLIC_KEY = os.getenv('STRIPE_PUBLIC_KEY', '')
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', '')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET', '')

# Frontend
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')