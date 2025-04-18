# trackandtrace/api_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import api_views

# REST API Router
router = DefaultRouter()
router.register(r'seeds', api_views.SeedPurchaseViewSet)

urlpatterns = [
    # Standard API Router
    path('', include(router.urls)),
]