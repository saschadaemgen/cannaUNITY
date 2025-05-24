# backend/logo_bridge/api_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    LogoDeviceViewSet, LogoVariableViewSet, 
    LogoCommandViewSet, LogoLogViewSet,
    LogoBridgeServiceViewSet
)

router = DefaultRouter()
router.register(r'devices', LogoDeviceViewSet)
router.register(r'variables', LogoVariableViewSet)
router.register(r'commands', LogoCommandViewSet)
router.register(r'logs', LogoLogViewSet)
router.register(r'service', LogoBridgeServiceViewSet, basename='service')

urlpatterns = [
    path('', include(router.urls)),
]