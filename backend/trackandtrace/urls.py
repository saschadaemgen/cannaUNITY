from django.urls import path, include
from . import api_urls  # <- wichtig: kein zirkulärer Import!

urlpatterns = [
    path('', include(api_urls)),
]
