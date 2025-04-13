from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from interface.views import index_view

from members.api_views import MemberViewSet, user_info, login_view, logout_view
from rooms.api_views import RoomViewSet
from options.api_views import OptionListAPIView

router = DefaultRouter()
router.register(r'members', MemberViewSet)
router.register(r'rooms', RoomViewSet)

urlpatterns = [
    # Adminbereich
    path('admin/', admin.site.urls),

    # API-Routen für REST-Framework
    path('api/', include(router.urls)),
    path('api/user-info/', user_info),
    path('api/login/', login_view),
    path('api/logout/', logout_view),
    path('api/token/', obtain_auth_token, name='api_token'),

    # React-Index-Seite (Startseite)
    path('', index_view, name='index'),

    # ✅ UniFi-Zugriffs-API für React-Frontend UND Port 8000
    path("unifi_access/", include("unifi_access.urls")),             # Für Port 8000 (Django direkt)
    path("api/unifi_access/", include("unifi_access.urls")),         # Für React-Testserver

   path("api/options/", OptionListAPIView.as_view(), name="api-options"),
]
