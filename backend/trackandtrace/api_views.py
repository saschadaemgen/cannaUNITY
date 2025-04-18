# trackandtrace/api_views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from members.models import Member

from .models import SeedPurchase, MotherPlant, Cutting, FloweringPlant
from .serializers import SeedPurchaseSerializer, MotherPlantSerializer, CuttingSerializer, FloweringPlantSerializer

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
            
        return queryset
    
    @action(detail=True, methods=['post'])
    def destroy_item(self, request, pk=None):
        """Markiert einen Eintrag als vernichtet"""
        seed_purchase = self.get_object()
        reason = request.data.get('reason', '')
        destroying_member_id = request.data.get('destroying_member', None)
        
        if not reason:
            return Response(
                {'error': 'Vernichtungsgrund muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not destroying_member_id:
            return Response(
                {'error': 'Verantwortliches Mitglied für die Vernichtung muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            destroying_member = Member.objects.get(id=destroying_member_id)
        except Member.DoesNotExist:
            return Response(
                {'error': 'Das angegebene Mitglied existiert nicht'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        seed_purchase.is_destroyed = True
        seed_purchase.destruction_reason = reason
        seed_purchase.destruction_date = timezone.now()
        seed_purchase.destroying_member = destroying_member
        seed_purchase.save()
        
        serializer = self.get_serializer(seed_purchase)
        return Response(serializer.data)

class MotherPlantViewSet(viewsets.ModelViewSet):
    """API-Endpunkte für Mutterpflanzen"""
    queryset = MotherPlant.objects.all()
    serializer_class = MotherPlantSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtering für aktive/vernichtete Einträge"""
        queryset = MotherPlant.objects.all()
        destroyed = self.request.query_params.get('destroyed', None)
        
        if destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            queryset = queryset.filter(is_destroyed=is_destroyed)
            
        return queryset
    
    @action(detail=True, methods=['post'])
    def destroy_item(self, request, pk=None):
        """Markiert einen Eintrag als vernichtet"""
        mother_plant = self.get_object()
        reason = request.data.get('reason', '')
        destroying_member_id = request.data.get('destroying_member', None)
        
        if not reason:
            return Response(
                {'error': 'Vernichtungsgrund muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not destroying_member_id:
            return Response(
                {'error': 'Verantwortliches Mitglied für die Vernichtung muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            destroying_member = Member.objects.get(id=destroying_member_id)
        except Member.DoesNotExist:
            return Response(
                {'error': 'Das angegebene Mitglied existiert nicht'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        mother_plant.is_destroyed = True
        mother_plant.destruction_reason = reason
        mother_plant.destruction_date = timezone.now()
        mother_plant.destroying_member = destroying_member
        mother_plant.save()
        
        serializer = self.get_serializer(mother_plant)
        return Response(serializer.data)
    
class CuttingViewSet(viewsets.ModelViewSet):
    """API-Endpunkte für Stecklinge"""
    queryset = Cutting.objects.all()
    serializer_class = CuttingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtering für aktive/vernichtete Einträge"""
        queryset = Cutting.objects.all()
        destroyed = self.request.query_params.get('destroyed', None)
        
        if destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            queryset = queryset.filter(is_destroyed=is_destroyed)
            
        return queryset
    
    @action(detail=True, methods=['post'])
    def destroy_item(self, request, pk=None):
        """Markiert einen Eintrag als vernichtet"""
        cutting = self.get_object()
        reason = request.data.get('reason', '')
        destroying_member_id = request.data.get('destroying_member', None)
        
        if not reason:
            return Response(
                {'error': 'Vernichtungsgrund muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not destroying_member_id:
            return Response(
                {'error': 'Verantwortliches Mitglied für die Vernichtung muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            destroying_member = Member.objects.get(id=destroying_member_id)
        except Member.DoesNotExist:
            return Response(
                {'error': 'Das angegebene Mitglied existiert nicht'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        cutting.is_destroyed = True
        cutting.destruction_reason = reason
        cutting.destruction_date = timezone.now()
        cutting.destroying_member = destroying_member
        cutting.save()
        
        serializer = self.get_serializer(cutting)
        return Response(serializer.data)
        
    @action(detail=True, methods=['post'])
    def update_growth_phase(self, request, pk=None):
        """Aktualisiert die Wachstumsphase eines Stecklings"""
        cutting = self.get_object()
        growth_phase = request.data.get('growth_phase', '')
        
        if not growth_phase:
            return Response(
                {'error': 'Wachstumsphase muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if growth_phase not in [choice[0] for choice in Cutting._meta.get_field('growth_phase').choices]:
            return Response(
                {'error': 'Ungültige Wachstumsphase'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        cutting.growth_phase = growth_phase
        cutting.save()
        
        serializer = self.get_serializer(cutting)
        return Response(serializer.data)
    

class FloweringPlantViewSet(viewsets.ModelViewSet):
    """API-Endpunkte für Blühpflanzen"""
    queryset = FloweringPlant.objects.all()
    serializer_class = FloweringPlantSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtering für aktive/vernichtete/übergeführte Einträge"""
        queryset = FloweringPlant.objects.all()
        destroyed = self.request.query_params.get('destroyed', None)
        transferred = self.request.query_params.get('transferred', None)
        
        # Drei mögliche Status: aktiv, vernichtet, übergeführt
        if destroyed is not None and transferred is not None:
            # Beide Parameter angegeben - ungültige Kombination
            return FloweringPlant.objects.none()
        elif destroyed is not None:
            # Nur destroyed Parameter
            is_destroyed = destroyed.lower() == 'true'
            queryset = queryset.filter(is_destroyed=is_destroyed, is_transferred=False)
        elif transferred is not None:
            # Nur transferred Parameter
            is_transferred = transferred.lower() == 'true'
            queryset = queryset.filter(is_transferred=is_transferred, is_destroyed=False)
        else:
            # Keine Parameter - zeige aktive (weder vernichtet noch übergeführt)
            queryset = queryset.filter(is_destroyed=False, is_transferred=False)
            
        return queryset
    
    @action(detail=True, methods=['post'])
    def destroy_item(self, request, pk=None):
        """Markiert einen Eintrag als vernichtet"""
        flowering_plant = self.get_object()
        reason = request.data.get('reason', '')
        destroying_member_id = request.data.get('destroying_member', None)
        
        if not reason:
            return Response(
                {'error': 'Vernichtungsgrund muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not destroying_member_id:
            return Response(
                {'error': 'Verantwortliches Mitglied für die Vernichtung muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            destroying_member = Member.objects.get(id=destroying_member_id)
        except Member.DoesNotExist:
            return Response(
                {'error': 'Das angegebene Mitglied existiert nicht'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        flowering_plant.mark_as_destroyed(reason, destroying_member)
        
        serializer = self.get_serializer(flowering_plant)
        return Response(serializer.data)
        
    @action(detail=True, methods=['post'])
    def update_growth_phase(self, request, pk=None):
        """Aktualisiert die Wachstumsphase einer Blühpflanze"""
        flowering_plant = self.get_object()
        growth_phase = request.data.get('growth_phase', '')
        
        if not growth_phase:
            return Response(
                {'error': 'Wachstumsphase muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if growth_phase not in [choice[0] for choice in FloweringPlant._meta.get_field('growth_phase').choices]:
            return Response(
                {'error': 'Ungültige Wachstumsphase'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        flowering_plant.growth_phase = growth_phase
        flowering_plant.save()
        
        serializer = self.get_serializer(flowering_plant)
        return Response(serializer.data)