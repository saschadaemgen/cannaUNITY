from django.urls import path
from . import api_views

app_name = 'rfid_bridge'

urlpatterns = [
    path('sessions/', api_views.create_rfid_session, name='create_rfid_session'),
    path('sessions/<uuid:session_id>/check/', api_views.check_latest_rfid, name='check_latest_rfid'),
    path('status/', api_views.status, name='status'),
]