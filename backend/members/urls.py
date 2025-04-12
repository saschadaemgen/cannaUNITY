from django.urls import path, include
from . import api_urls

urlpatterns = [
    path('api/', include(api_urls)),
]
