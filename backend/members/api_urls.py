from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import api_views

# REST API Router
router = DefaultRouter()
router.register(r'', api_views.MemberViewSet)

urlpatterns = [
    # Web-Ansichten
    path('', views.member_list, name='member_list'),
    path('create/', views.member_create, name='member_create'),
    path('update/<int:pk>/', views.member_update, name='member_update'),
    path('delete/<int:pk>/', views.member_delete, name='member_delete'),
    
    # API-Endpunkte
    path('api/user-info/', api_views.user_info, name='api_user_info'),
    path('api/login/', api_views.login_view, name='api_login'),
    path('api/logout/', api_views.logout_view, name='api_logout'),
    
    # Neue Mitgliedersuche API
    path('api/search/', api_views.MemberSearchAPIView.as_view(), name='member_search'),
    
    # Standard API Router
    path('api/', include(router.urls)),
]