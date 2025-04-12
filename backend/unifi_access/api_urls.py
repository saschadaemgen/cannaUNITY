from django.urls import path
from . import api_views

urlpatterns = [
    path('events/', api_views.api_latest_events, name='api_latest_events'),
]
