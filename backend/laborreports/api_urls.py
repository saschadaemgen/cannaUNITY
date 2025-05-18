# backend/laborreports/api_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    LaboratoryReportViewSet,
    CannabinoidProfileViewSet,
    TerpeneProfileViewSet,
    ContaminantCategoryViewSet,
    ContaminantTestViewSet
)

router = DefaultRouter()
router.register(r'reports', LaboratoryReportViewSet)
router.register(r'cannabinoid-profiles', CannabinoidProfileViewSet)
router.register(r'terpene-profiles', TerpeneProfileViewSet)
router.register(r'contaminant-categories', ContaminantCategoryViewSet)
router.register(r'contaminant-tests', ContaminantTestViewSet)

urlpatterns = [
    path('', include(router.urls)),
]