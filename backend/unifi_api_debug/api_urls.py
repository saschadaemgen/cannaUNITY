# Datei: unifi_api_debug/api_urls.py

from django.urls import path
from . import api_views

urlpatterns = [
    path("test-nfc-session/", api_views.TestNfcSessionView.as_view(), name="test_nfc_session"),
    path("debug-logs/", api_views.DebugLogListView.as_view(), name="debug_log_list"),  # 👈 HIER
]
