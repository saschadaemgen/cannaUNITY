# trackandtrace/api_views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import SeedPurchase
from .serializers import SeedPurchaseSerializer

class SeedPurchaseViewSet(viewsets.ModelViewSet):
    """API-Endpunkte für Samen-Einkäufe"""
    queryset = SeedPurchase.objects.all()
    serializer_class = SeedPurchaseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtering für aktive/vernichtete Einträge"""
        queryset = SeedPurchase.objects.all()
        destroyed = self.request.query_params.get('destroyed', None)
        
        if destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            queryset = queryset.filter(is_destroyed=is_destroyed)
        
        # Debug-Log hinzufügen
        print(f"SeedPurchase Query: {queryset.query}")
        print(f"Destroyed param: {destroyed}")
        print(f"Results count: {queryset.count()}")
            
        return queryset
    
    @action(detail=True, methods=['post'])
    def destroy_item(self, request, pk=None):
        """Markiert einen Eintrag als vernichtet"""
        seed_purchase = self.get_object()
        reason = request.data.get('reason', '')
        
        if not reason:
            return Response(
                {'error': 'Vernichtungsgrund muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        seed_purchase.is_destroyed = True
        seed_purchase.destruction_reason = reason
        seed_purchase.destruction_date = timezone.now()
        seed_purchase.save()
        
        serializer = self.get_serializer(seed_purchase)
        return Response(serializer.data)