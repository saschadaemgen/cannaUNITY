from django.urls import path
from .api_views import MemberViewSet, user_info, login_view, logout_view
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'members', MemberViewSet)

urlpatterns = router.urls + [
    path('user-info/', user_info, name='user-info'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),  # 🆕 Logout-Route
]
