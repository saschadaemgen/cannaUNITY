# /api_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import api_views

# REST API Router
router = DefaultRouter()
router.register(r'', api_views.MemberViewSet)

urlpatterns = [
    # API-Endpunkte
    path('api/user-info/', api_views.user_info, name='api_user_info'),
    path('api/login/', api_views.login_view, name='api_login'),
    path('api/logout/', api_views.logout_view, name='api_logout'),
    
    # Mitgliedersuche API
    path('api/search/', api_views.MemberSearchAPIView.as_view(), name='member_search'),
    
    # Standard API Router für Members
    path('api/', include(router.urls)),
]