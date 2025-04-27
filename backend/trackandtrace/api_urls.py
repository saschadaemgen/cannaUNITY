# backend/trackandtrace/api_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    SeedPurchaseViewSet, 
    MotherPlantBatchViewSet, 
    MotherPlantViewSet,
    FloweringPlantBatchViewSet, 
    CuttingBatchViewSet,
    BloomingCuttingBatchViewSet
)

router = DefaultRouter()
router.register(r'seeds', SeedPurchaseViewSet, basename='seeds')
router.register(r'motherbatches', MotherPlantBatchViewSet, basename='motherbatches')
router.register(r'motherplants', MotherPlantViewSet, basename='motherplants')
router.register(r'floweringbatches', FloweringPlantBatchViewSet, basename='floweringbatches')
router.register(r'cuttingbatches', CuttingBatchViewSet, basename='cuttingbatches')
router.register(r'bloomingcuttingbatches', BloomingCuttingBatchViewSet, basename='bloomingcuttingbatches')

urlpatterns = [
    path('', include(router.urls)),
]