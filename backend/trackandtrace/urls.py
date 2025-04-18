# trackandtrace/urls.py
from django.urls import path, include

urlpatterns = [
    path('', include('trackandtrace.api_urls')),
]