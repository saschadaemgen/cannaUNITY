# backend/laborreports/api_views.py
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    LaboratoryReport, 
    CannabinoidProfile, 
    TerpeneProfile, 
    ContaminantCategory, 
    ContaminantTest
)
from .serializers import (
    LaboratoryReportListSerializer,
    LaboratoryReportDetailSerializer,
    CannabinoidProfileSerializer,
    TerpeneProfileSerializer,
    ContaminantCategorySerializer,
    ContaminantTestSerializer
)

class LaboratoryReportViewSet(viewsets.ModelViewSet):
    """ViewSet für Laborberichte mit automatischer Serializer-Auswahl."""
    queryset = LaboratoryReport.objects.all().order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['sample_type', 'overall_status', 'is_gmp_compliant', 'is_gacp_compliant']
    search_fields = ['report_number', 'sample_name', 'sample_id']
    ordering_fields = ['created_at', 'analysis_date', 'collection_date']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return LaboratoryReportListSerializer
        return LaboratoryReportDetailSerializer
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Endpunkt zum Aktualisieren des Gesamtstatus eines Berichts."""
        report = self.get_object()
        new_status = request.data.get('overall_status')
        
        if new_status not in ['passed', 'failed', 'pending']:
            return Response(
                {'error': 'Ungültiger Status. Erlaubt: passed, failed, pending'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        report.overall_status = new_status
        report.save()
        
        return Response({
            'status': 'success',
            'message': f'Status aktualisiert auf {new_status}'
        })

class CannabinoidProfileViewSet(viewsets.ModelViewSet):
    """ViewSet für Cannabinoid-Profile."""
    queryset = CannabinoidProfile.objects.all()
    serializer_class = CannabinoidProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['report']

class TerpeneProfileViewSet(viewsets.ModelViewSet):
    """ViewSet für Terpen-Profile."""
    queryset = TerpeneProfile.objects.all()
    serializer_class = TerpeneProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['report']

class ContaminantCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet für Verunreinigungskategorien."""
    queryset = ContaminantCategory.objects.all()
    serializer_class = ContaminantCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

class ContaminantTestViewSet(viewsets.ModelViewSet):
    """ViewSet für Verunreinigungstests."""
    queryset = ContaminantTest.objects.all()
    serializer_class = ContaminantTestSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['report', 'category', 'status']
    search_fields = ['name']