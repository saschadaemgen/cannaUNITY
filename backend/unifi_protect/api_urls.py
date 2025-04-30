# unifi_protect/api_urls.py

from rest_framework import routers
from .api_views import ProtectSensorViewSet, ProtectSensorHistoryViewSet

router = routers.DefaultRouter()
router.register(r"sensors", ProtectSensorViewSet, basename="sensor")
# Neuen Endpunkt für Historieneinträge registrieren
router.register(r"history", ProtectSensorHistoryViewSet, basename="history")

urlpatterns = router.urls