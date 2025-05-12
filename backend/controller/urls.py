# controller/urls.py
from django.urls import path, include
from django.views.generic import TemplateView

urlpatterns = [
    # Für den Zugriff auf die API-URLs unter /controller/
    path('', include('controller.api_urls')),
    
    # Index-Ansicht für React-App
    path('', TemplateView.as_view(template_name='index.html'), name='controller_index'),
]