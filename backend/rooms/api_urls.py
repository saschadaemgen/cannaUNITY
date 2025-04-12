from rest_framework.routers import DefaultRouter
from .api_views import RoomViewSet

router = DefaultRouter()
router.register(r'rooms', RoomViewSet)

urlpatterns = router.urls