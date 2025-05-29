from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import PLCDeviceViewSet, PLCOutputViewSet, PLCLogViewSet

router = DefaultRouter()
router.register(r'devices', PLCDeviceViewSet, basename='plc-device')
router.register(r'outputs', PLCOutputViewSet, basename='plc-output')
router.register(r'logs', PLCLogViewSet, basename='plc-log')

urlpatterns = [
    path('', include(router.urls)),
]