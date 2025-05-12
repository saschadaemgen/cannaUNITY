# controller/api_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .api_views import (
    IrrigationControllerViewSet, IrrigationScheduleViewSet,
    LightControllerViewSet, LightScheduleViewSet, LightSchedulePointViewSet,
    ControllerLogViewSet, ResourceUsageViewSet
)

router = DefaultRouter()
router.register(r'irrigation', IrrigationControllerViewSet, basename='irrigation_controller')
router.register(r'irrigation-schedules', IrrigationScheduleViewSet, basename='irrigation_schedule')
router.register(r'light', LightControllerViewSet, basename='light_controller')
router.register(r'light-schedules', LightScheduleViewSet, basename='light_schedule')
router.register(r'light-schedule-points', LightSchedulePointViewSet, basename='light_schedule_point')
router.register(r'logs', ControllerLogViewSet, basename='controller_log')
router.register(r'resource-usage', ResourceUsageViewSet, basename='resource_usage')

urlpatterns = [
    path('', include(router.urls)),
]