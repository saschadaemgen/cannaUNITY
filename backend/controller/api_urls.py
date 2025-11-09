# backend/controller/api_urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    ControlUnitViewSet, ControlScheduleViewSet,
    ControlParameterViewSet, ControlStatusViewSet,
    ControlCommandViewSet, PLCConfigurationViewSet
)

router = DefaultRouter()
router.register(r'units', ControlUnitViewSet, basename='control-unit')
router.register(r'schedules', ControlScheduleViewSet, basename='control-schedule')
router.register(r'parameters', ControlParameterViewSet, basename='control-parameter')
router.register(r'status', ControlStatusViewSet, basename='control-status')
router.register(r'commands', ControlCommandViewSet, basename='control-command')
router.register(r'plc-config', PLCConfigurationViewSet, basename='plc-config')

# Zusätzliche Custom-URLs für spezielle Actions
unit_extra_patterns = [
    path('units/<uuid:pk>/toggle_led/', 
         ControlUnitViewSet.as_view({'post': 'toggle_led'}), 
         name='control-unit-toggle-led'),
    path('units/<uuid:pk>/save_to_plc/', 
         ControlUnitViewSet.as_view({'post': 'save_to_plc'}), 
         name='control-unit-save-to-plc'),
    path('units/<uuid:pk>/sync_status/', 
         ControlUnitViewSet.as_view({'get': 'sync_status'}), 
         name='control-unit-sync-status'),
]

urlpatterns = [
    path('', include(router.urls)),
] + unit_extra_patterns