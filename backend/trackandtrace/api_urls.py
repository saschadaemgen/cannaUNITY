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
router.register(r'harvests', api_views.HarvestViewSet)
router.register(r'dryings', api_views.DryingViewSet)
router.register(r'processings', api_views.ProcessingViewSet)
router.register(r'labtestings', api_views.LabTestingViewSet)
router.register(r'packagings', api_views.PackagingViewSet)
router.register(r'distributions', api_views.ProductDistributionViewSet)

urlpatterns = [
    # Standard API Router
    path('', include(router.urls)),
]