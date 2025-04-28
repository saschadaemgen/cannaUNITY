# backend/rooms/api_urls.py
from rest_framework.routers import DefaultRouter
from .api_views import RoomViewSet, RoomItemTypeViewSet, RoomItemViewSet, SensorViewSet

router = DefaultRouter()
router.register(r'rooms', RoomViewSet)
router.register(r'room-item-types', RoomItemTypeViewSet)
router.register(r'room-items', RoomItemViewSet)
router.register(r'sensors', SensorViewSet)

urlpatterns = router.urls