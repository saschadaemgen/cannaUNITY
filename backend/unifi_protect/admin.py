# backend/unifi_protect/admin.py

from django.contrib import admin
from .models import ProtectSensor

admin.site.register(ProtectSensor)
