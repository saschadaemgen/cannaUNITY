# backend/trackandtrace/api_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import SeedPurchaseViewSet, MotherPlantBatchViewSet, FloweringPlantBatchViewSet

router = DefaultRouter()
router.register(r'seeds', SeedPurchaseViewSet, basename='seeds')
router.register(r'motherbatches', MotherPlantBatchViewSet, basename='motherbatches')
router.register(r'floweringbatches', FloweringPlantBatchViewSet, basename='floweringbatches')

urlpatterns = [
    path('', include(router.urls)),
]