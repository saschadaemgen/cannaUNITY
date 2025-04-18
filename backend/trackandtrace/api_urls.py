# trackandtrace/api_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import api_views

# REST API Router
router = DefaultRouter()
router.register(r'seeds', api_views.SeedPurchaseViewSet)
router.register(r'motherplants', api_views.MotherPlantViewSet)
router.register(r'cuttings', api_views.CuttingViewSet)
router.register(r'floweringplants', api_views.FloweringPlantViewSet)

urlpatterns = [
    # Standard API Router
    path('', include(router.urls)),
]