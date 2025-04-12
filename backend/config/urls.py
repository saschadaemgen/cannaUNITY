from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.views.generic import TemplateView
from rest_framework.authtoken.views import obtain_auth_token
from interface.views import index_view 

from members.api_views import MemberViewSet, user_info, login_view, logout_view
from rooms.api_views import RoomViewSet

router = DefaultRouter()
router.register(r'members', MemberViewSet)
router.register(r'rooms', RoomViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/user-info/', user_info),
    path('api/login/', login_view),
    path('api/logout/', logout_view),

    # ⬇️ Token-Authentifizierung aktivieren
    path('api/token/', obtain_auth_token, name='api_token'),
    path('', index_view, name='index'),
]
