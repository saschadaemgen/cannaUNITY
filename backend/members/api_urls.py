# C:\Users\sash710\avre\cannaUNITY\backend\members\api_urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import MemberViewSet, user_info
from .api_views import (
    create_joomla_user_api, update_joomla_user_api, 
    regenerate_joomla_password_api, delete_joomla_user_api,
    create_unifi_user_api, update_unifi_user_api, 
    delete_unifi_user_api, reactivate_unifi_user_api,
    check_unifi_status_api, debug_member_creation  # Debug-Endpoint hinzugefügt
)

# REST API Router für CRUD-Operationen
router = DefaultRouter()
router.register(r'members', MemberViewSet, basename='member')

urlpatterns = [
    # Benutzerinfo-Endpunkt
    path('api/user-info/', user_info, name='api_user_info'),
    
    # Debug-Endpoint für die Mitgliedererstellung
    path('api/members/debug-create/', debug_member_creation, name='debug_member_creation'),
    
    # API-ENDPUNKTE FÜR INTEGRATION
    # Joomla Integration
    path('api/members/<int:member_id>/joomla/create/', 
         create_joomla_user_api, 
         name='create_joomla_user'),
    path('api/members/<int:member_id>/joomla/update/', 
         update_joomla_user_api, 
         name='update_joomla_user'),
    path('api/members/<int:member_id>/joomla/password/', 
         regenerate_joomla_password_api, 
         name='regenerate_joomla_password'),
    path('api/members/<int:member_id>/joomla/delete/', 
         delete_joomla_user_api, 
         name='delete_joomla_user'),
         
    # UniFi Integration
    path('api/members/<int:member_id>/unifi/create/', 
         create_unifi_user_api, 
         name='create_unifi_user'),
    path('api/members/<int:member_id>/unifi/update/', 
         update_unifi_user_api, 
         name='update_unifi_user'),
    path('api/members/<int:member_id>/unifi/delete/', 
         delete_unifi_user_api, 
         name='delete_unifi_user'),
    path('api/members/<int:member_id>/unifi/reactivate/', 
         reactivate_unifi_user_api, 
         name='reactivate_unifi_user'),
    path('api/members/<int:member_id>/unifi/status/', 
         check_unifi_status_api, 
         name='check_unifi_status'),
    
    # Router für Standard CRUD-Operationen einbinden
    path('api/', include(router.urls)),
]