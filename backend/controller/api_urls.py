# backend/controller/api_urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    ControlUnitViewSet, ControlScheduleViewSet,
    ControlParameterViewSet, ControlStatusViewSet,
    ControlCommandViewSet
)

router = DefaultRouter()
router.register(r'units', ControlUnitViewSet, basename='control-unit')
router.register(r'schedules', ControlScheduleViewSet, basename='control-schedule')
router.register(r'parameters', ControlParameterViewSet, basename='control-parameter')
router.register(r'status', ControlStatusViewSet, basename='control-status')
router.register(r'commands', ControlCommandViewSet, basename='control-command')

urlpatterns = [
    path('', include(router.urls)),
]