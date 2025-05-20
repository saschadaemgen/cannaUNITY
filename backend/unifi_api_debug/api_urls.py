# Datei: backend/unifi_api_debug/api_urls.py

from django.urls import path
from .api_views import (
    TestNfcSessionView,
    DebugLogListView,
    BindRfidSessionView,
    SecureMemberBindingView,
    CancelRfidSessionView,
)

urlpatterns = [
    path('test-nfc-session/', TestNfcSessionView.as_view(), name='test-nfc-session'),
    path('debug-log/', DebugLogListView.as_view(), name='debug-log'),
    path('bind-rfid-session/', BindRfidSessionView.as_view(), name='bind-rfid-session'),
    path('secure-member-binding/', SecureMemberBindingView.as_view(), name='secure-member-binding'),
    path('cancel-rfid-session/', CancelRfidSessionView.as_view(), name='cancel-rfid-session'),

]
