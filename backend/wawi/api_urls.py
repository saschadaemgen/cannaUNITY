# wawi/api_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import CannabisStrainViewSet

router = DefaultRouter()
router.register(r'strains', CannabisStrainViewSet, basename='strain')

urlpatterns = [
    path('', include(router.urls)),
]