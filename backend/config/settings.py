from pathlib import Path

# 📌 Projektbasisverzeichnis
BASE_DIR = Path(__file__).resolve().parent.parent

# 🚨 Sicherheit
SECRET_KEY = 'django-insecure-g_l0=^1d1+v%$7t0k4^4z@@6_8cmwj8=vfsx^%un!cz-=_01rz'
DEBUG = True
ALLOWED_HOSTS = []

# 📦 Installierte Apps
INSTALLED_APPS = [
    # Django-Standard
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Drittanbieter
    'rest_framework',             # 🔁 Django REST Framework
    'rest_framework.authtoken',   # 🔐 Token-Auth für API-Login
    'corsheaders',                # 🌐 CORS für Vite-Frontend

    # Eigene Apps
    'members',
    'rooms',
    "interface",
    'unifi_access',
]

# 🔄 Middleware
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # 🌐 Muss ganz oben stehen!
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# 🌐 URL-Konfiguration
ROOT_URLCONF = 'config.urls'
import os

# 🖼️ Templates
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# 🔗 Wo findet Django das Manifest und die Assets?
DJANGO_VITE = {
    "dev_mode": DEBUG,  # im DEV-Modus direkt auf Vite-Dev-Server zugreifen
    "static_url": "/static/",  # wo du deine Bundles erwartest
    "dev_server_port": 5173,   # Port von `npm run dev`
    "build_dir": BASE_DIR / "backend" / "static" / "frontend",  # wo `npm run build` landet
    "manifest_path": BASE_DIR / "backend" / "static" / "frontend" / "manifest.json",
}

# ⚙️ WSGI
WSGI_APPLICATION = 'config.wsgi.application'

# 🌐 CORS Einstellungen (für Vite unter localhost:5173)
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = True
CSRF_TRUSTED_ORIGINS = ['http://localhost:5173']

# 🔐 Django REST Framework Einstellungen
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],

    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 25,
}

# 💾 Datenbank (SQLite – ideal für lokale Entwicklung)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# 🔑 Passwort-Validierung
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# 🌍 Lokalisierung
LANGUAGE_CODE = 'de-de'
TIME_ZONE = 'Europe/Berlin'
USE_I18N = True
USE_TZ = True

# 📁 Statische Dateien
STATIC_URL = 'static/'

# 🆔 Primärschlüssel-Typ
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ganz unten ergänzen
import os

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "static"),
]
