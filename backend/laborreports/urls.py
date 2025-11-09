# backend/laborreports/urls.py
from django.urls import path, include
from .api_urls import urlpatterns as api_urlpatterns

urlpatterns = api_urlpatterns