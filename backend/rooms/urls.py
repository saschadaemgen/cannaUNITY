from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from members.api_views import MemberViewSet

router = DefaultRouter()
router.register(r'members', MemberViewSet)
# router.register(r'rooms', RoomViewSet)  # Auskommentiert bis RoomViewSet existiert

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    # path('api/auth/user/', CurrentUserView.as_view(), name='current-user'),  # Auskommentiert
]