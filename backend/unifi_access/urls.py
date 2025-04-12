from django.urls import path
from . import views

app_name = 'unifi_access'

urlpatterns = [
    path('api/events/', views.get_events, name='get_events'),
    path('api/status/', views.ha_status, name='ha_status'),
    path('latest-rfid/', views.latest_rfid_event, name='latest_rfid_event'),
]
