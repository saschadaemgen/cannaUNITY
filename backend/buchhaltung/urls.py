from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views_api import (
    AccountViewSet,
    BookingViewSet,                     # 🔧 Hinzugefügt
    BookingDashboardAPIView,
    AccountImportAPIView,
    BookingCreateAPIView,
    BookingDetailAPIView,
    MainBookAPIView,
    ProfitLossAPIView,
    BalanceSheetAPIView,
)

router = DefaultRouter()
router.register(r'accounts', AccountViewSet)
router.register(r'bookings', BookingViewSet)  # ✅ Damit /bookings/<id>/delete-with-rollback/ funktioniert

urlpatterns = [
    path('dashboard/', BookingDashboardAPIView.as_view(), name='dashboard-api'),
    path('accounts/import/', AccountImportAPIView.as_view(), name='accounts-import'),
    path('', include(router.urls)),  # Enthält nun /accounts/ UND /bookings/
    path("bookings/create/", BookingCreateAPIView.as_view(), name="api-buchung-anlegen"),  # optional: Pfad ändern
    path("bookings/<int:pk>/", BookingDetailAPIView.as_view(), name="booking-detail"),
    path("mainbook/", MainBookAPIView.as_view(), name="hauptbuch"),
    path("guv/", ProfitLossAPIView.as_view(), name="guv"),
    path("bilanz/", BalanceSheetAPIView.as_view(), name="bilanz"),
]
