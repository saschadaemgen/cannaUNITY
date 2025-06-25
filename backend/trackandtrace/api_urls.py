# backend/trackandtrace/api_urls.py - ERWEITERT

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    SeedPurchaseViewSet, MotherPlantBatchViewSet, MotherPlantViewSet,
    FloweringPlantBatchViewSet, CuttingBatchViewSet, BloomingCuttingBatchViewSet,
    HarvestBatchViewSet, DryingBatchViewSet, ProcessingBatchViewSet, LabTestingBatchViewSet, 
    PackagingBatchViewSet, PackagingUnitViewSet, ProductDistributionViewSet,
    StrainCardViewSet, SeedPurchaseImageViewSet, MotherPlantBatchImageViewSet,
    CuttingBatchImageSerializer, CuttingBatchImageViewSet, BloomingCuttingBatchImageSerializer,
    BloomingCuttingBatchImageViewSet, FloweringPlantBatchImageSerializer, FloweringPlantBatchImageViewSet,
    HarvestBatchViewSet, HarvestBatchImageViewSet, HarvestBatchSerializer, DryingBatchImageViewSet,
    validate_distribution_limits
)

router = DefaultRouter()
router.register(r'seeds', SeedPurchaseViewSet, basename='seeds')
router.register(r'motherbatches', MotherPlantBatchViewSet, basename='motherbatches')
router.register(r'motherplants', MotherPlantViewSet, basename='motherplants')
router.register(r'floweringbatches', FloweringPlantBatchViewSet, basename='floweringbatches')
router.register(r'cuttingbatches', CuttingBatchViewSet, basename='cuttingbatches')
router.register(r'bloomingcuttingbatches', BloomingCuttingBatchViewSet, basename='bloomingcuttingbatches')
router.register(r'harvests', HarvestBatchViewSet, basename='harvests')
router.register(r'drying', DryingBatchViewSet, basename='drying')
router.register(r'processing', ProcessingBatchViewSet, basename='processing')
router.register(r'labtesting', LabTestingBatchViewSet, basename='labtesting')
router.register(r'packaging', PackagingBatchViewSet, basename='packaging')
router.register(r'packaging-units', PackagingUnitViewSet, basename='packaging-units')
router.register(r'distributions', ProductDistributionViewSet, basename='distributions')
router.register(r'seed-images', SeedPurchaseImageViewSet, basename='seed-images')
router.register(r'mother-batch-images', MotherPlantBatchImageViewSet, basename='mother-batch-images')
router.register(r'cutting-batch-images', CuttingBatchImageViewSet, basename='cutting-batch-images')
router.register(r'blooming-cutting-batch-images', BloomingCuttingBatchImageViewSet, basename='blooming-cutting-batch-images')
router.register(r'flowering-plant-batch-images', FloweringPlantBatchImageViewSet, basename='flowering-plant-batch-images')
router.register(r'harvest-batch-images', HarvestBatchImageViewSet, basename='harvest-batch-images')
router.register(r'drying-batch-images', DryingBatchImageViewSet, basename='drying-batch-images')


# NEU: StrainCard API für optimierte Performance
router.register(r'strain-cards', StrainCardViewSet, basename='strain-cards')

urlpatterns = [
    # Spezifische Endpunkte
    path('distributions/validate_distribution_limits/', 
         validate_distribution_limits, 
         name='validate_distribution_limits'),
    
    # Router URLs
    path('', include(router.urls)),
]