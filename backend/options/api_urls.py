from .api_views import (
    TopbarTitleAPIView, 
    UpdateTopbarTitleAPIView, 
    TopbarTitleStyleAPIView, 
    UpdateTopbarTitleStyleAPIView,
    DesignOptionsAPIView,
    UpdateDesignOptionsAPIView
)
from django.urls import path

urlpatterns = [
    path('title/', TopbarTitleAPIView.as_view(), name='topbar-title'),
    path('update-title/', UpdateTopbarTitleAPIView.as_view(), name='update-topbar-title'),
    path('title-style/', TopbarTitleStyleAPIView.as_view(), name='topbar-title-style'),
    path('update-title-style/', UpdateTopbarTitleStyleAPIView.as_view(), name='update-topbar-title-style'),
    # Neue Routen für erweiterte Design-Optionen
    path('design-options/', DesignOptionsAPIView.as_view(), name='design-options'),
    path('update-design-options/', UpdateDesignOptionsAPIView.as_view(), name='update-design-options'),
]