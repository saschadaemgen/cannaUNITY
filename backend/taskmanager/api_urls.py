# backend/taskmanager/api_urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    TaskTypeViewSet, TaskScheduleViewSet, TimeSlotViewSet,
    TaskBookingViewSet, DashboardViewSet
)

router = DefaultRouter()
router.register(r'task-types', TaskTypeViewSet, basename='task-types')
router.register(r'schedules', TaskScheduleViewSet, basename='schedules')
router.register(r'time-slots', TimeSlotViewSet, basename='time-slots')
router.register(r'bookings', TaskBookingViewSet, basename='bookings')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
]