# trackandtrace/api_views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from members.models import Member

from .models import SeedPurchase, MotherPlant, Cutting, FloweringPlant, Harvest, Drying, Processing, LabTesting, Packaging, ProductDistribution
from .serializers import SeedPurchaseSerializer, MotherPlantSerializer, CuttingSerializer, FloweringPlantSerializer, HarvestSerializer, DryingSerializer, ProcessingSerializer, LabTestingSerializer, PackagingSerializer, ProductDistributionSerializer

class SeedPurchaseViewSet(viewsets.ModelViewSet):
    """API-Endpunkte für Samen-Einkäufe"""
    queryset = SeedPurchase.objects.all()
    serializer_class = SeedPurchaseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtering für aktive/vernichtete/übergeführte Einträge"""
        queryset = SeedPurchase.objects.all()
        destroyed = self.request.query_params.get('destroyed', None)
        transfer_status = self.request.query_params.get('transfer_status', None)
        
        # Filter für Vernichtung anwenden
        if destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            queryset = queryset.filter(is_destroyed=is_destroyed)
            
        # Erweiterter Filter für Überführungsstatus
        if transfer_status is not None:
            if transfer_status == 'transferred':
                # Für Abwärtskompatibilität: is_transferred=True entspricht dem alten Schema
                queryset = queryset.filter(is_transferred=True)
            elif transfer_status == 'not_transferred':
                queryset = queryset.filter(is_transferred=False)
        
        # Standardfilter: Wenn keine Parameter angegeben, zeige aktive (nicht vernichtet, nicht übergeführt)
        if destroyed is None and transfer_status is None:
            queryset = queryset.filter(is_destroyed=False, is_transferred=False)
            
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
        """Filtering für aktive/vernichtete Einträge (Mutterpflanzen werden nicht überführt)"""
        queryset = MotherPlant.objects.all()
        destroyed = self.request.query_params.get('destroyed', None)
        
        # Mutterpflanzen haben nur aktiv/vernichtet als Status
        if destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            queryset = queryset.filter(is_destroyed=is_destroyed)
        else:
            # Keine Parameter - zeige aktive
            queryset = queryset.filter(is_destroyed=False)
            
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
        """Filtering für aktive/vernichtete/übergeführte Einträge"""
        queryset = Cutting.objects.all()
        destroyed = self.request.query_params.get('destroyed', None)
        transfer_status = self.request.query_params.get('transfer_status', None)
        
        # Filter für Vernichtung anwenden
        if destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            queryset = queryset.filter(is_destroyed=is_destroyed)
            
        # Erweiterter Filter für Überführungsstatus
        if transfer_status is not None:
            if transfer_status == 'transferred':
                # Für Abwärtskompatibilität: is_transferred=True entspricht dem alten Schema
                queryset = queryset.filter(is_transferred=True)
            elif transfer_status == 'not_transferred':
                queryset = queryset.filter(is_transferred=False)
        
        # Standardfilter: Wenn keine Parameter angegeben, zeige aktive (nicht vernichtet, nicht übergeführt)
        if destroyed is None and transfer_status is None:
            queryset = queryset.filter(is_destroyed=False, is_transferred=False)
            
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
        transfer_status = self.request.query_params.get('transfer_status', None)
        
        # Filter für Vernichtung anwenden
        if destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            queryset = queryset.filter(is_destroyed=is_destroyed)
        
        # Erweiterter Filter für Überführungsstatus
        if transfer_status is not None:
            if transfer_status == 'transferred':
                # Für Abwärtskompatibilität: is_transferred=True entspricht dem alten Schema
                queryset = queryset.filter(is_transferred=True)
            elif transfer_status == 'not_transferred':
                queryset = queryset.filter(is_transferred=False)
        
        # Standardfilter: Wenn keine Parameter angegeben, zeige aktive
        if destroyed is None and transfer_status is None:
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
        
        # Prüfen ob die Pflanze aktiv ist (weder vernichtet noch überführt)
        if flowering_plant.is_destroyed:
            return Response(
                {'error': 'Vernichtete Pflanzen können nicht aktualisiert werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if flowering_plant.is_transferred:
            return Response(
                {'error': 'Überführte Pflanzen können nicht aktualisiert werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
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
        
        # Speichere verantwortlichen Mitarbeiter, wenn mitgegeben
        responsible_member_id = request.data.get('responsible_member', None)
        if responsible_member_id:
            try:
                responsible_member = Member.objects.get(id=responsible_member_id)
                flowering_plant.responsible_member = responsible_member
            except Member.DoesNotExist:
                pass  # Ignoriere ungültige Mitglieder-IDs
        
        # Setze die neue Wachstumsphase
        flowering_plant.growth_phase = growth_phase
        
        # Wenn Erntereif, automatisch erwartetes Erntedatum setzen
        if growth_phase == 'harvest_ready' and not flowering_plant.expected_harvest_date:
            flowering_plant.expected_harvest_date = timezone.now().date() + timezone.timedelta(days=7)
        
        flowering_plant.save()
        
        serializer = self.get_serializer(flowering_plant)
        return Response(serializer.data)
    

class HarvestViewSet(viewsets.ModelViewSet):
    """API-Endpunkte für Ernten mit erweiterter Überführungslogik"""
    queryset = Harvest.objects.all()
    serializer_class = HarvestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtering für aktive/vernichtete/übergeführte Einträge mit erweitertem Transfer-Status"""
        queryset = Harvest.objects.all()
        destroyed = self.request.query_params.get('destroyed', None)
        transfer_status = self.request.query_params.get('transfer_status', None)
        
        # Filter für Vernichtung anwenden
        if destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            queryset = queryset.filter(is_destroyed=is_destroyed)
        
        # Erweiterter Filter für Überführungsstatus
        if transfer_status is not None:
            if transfer_status == 'transferred':
                # Beide Status abfragen für Abwärtskompatibilität
                queryset = queryset.filter(
                    transfer_status__in=['partially_transferred', 'fully_transferred']
                )
            elif transfer_status in ['not_transferred', 'partially_transferred', 'fully_transferred']:
                queryset = queryset.filter(transfer_status=transfer_status)
        
        # Standardfilter: Wenn keine Parameter angegeben, zeige aktive (nicht vernichtet, nicht vollständig übergeführt)
        if destroyed is None and transfer_status is None:
            queryset = queryset.filter(
                is_destroyed=False, 
                transfer_status__in=['not_transferred', 'partially_transferred']
            )
            
        return queryset
    
    @action(detail=True, methods=['post'])
    def destroy_item(self, request, pk=None):
        """Markiert einen Eintrag als vernichtet"""
        harvest = self.get_object()
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
            
        harvest.mark_as_destroyed(reason, destroying_member)
        
        serializer = self.get_serializer(harvest)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_partially_transferred(self, request, pk=None):
        """Markiert einen Eintrag als teilweise übergeführt"""
        harvest = self.get_object()
        transferring_member_id = request.data.get('transferring_member', None)
        
        if not transferring_member_id:
            return Response(
                {'error': 'Verantwortliches Mitglied für die Überführung muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            transferring_member = Member.objects.get(id=transferring_member_id)
        except Member.DoesNotExist:
            return Response(
                {'error': 'Das angegebene Mitglied existiert nicht'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        harvest.mark_as_partially_transferred(transferring_member)
        
        serializer = self.get_serializer(harvest)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_fully_transferred(self, request, pk=None):
        """Markiert einen Eintrag als vollständig übergeführt"""
        harvest = self.get_object()
        transferring_member_id = request.data.get('transferring_member', None)
        
        if not transferring_member_id:
            return Response(
                {'error': 'Verantwortliches Mitglied für die Überführung muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            transferring_member = Member.objects.get(id=transferring_member_id)
        except Member.DoesNotExist:
            return Response(
                {'error': 'Das angegebene Mitglied existiert nicht'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        harvest.mark_as_fully_transferred(transferring_member)
        
        serializer = self.get_serializer(harvest)
        return Response(serializer.data)
    

class DryingViewSet(viewsets.ModelViewSet):
    """API-Endpunkte für Trocknungen"""
    queryset = Drying.objects.all()
    serializer_class = DryingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtering für aktive/vernichtete/übergeführte Einträge"""
        queryset = Drying.objects.all()
        destroyed = self.request.query_params.get('destroyed', None)
        transfer_status = self.request.query_params.get('transfer_status', None)
        
        # Filter für Vernichtung anwenden
        if destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            queryset = queryset.filter(is_destroyed=is_destroyed)
        
        # Erweiterter Filter für Überführungsstatus
        if transfer_status is not None:
            if transfer_status == 'transferred':
                # Für Abwärtskompatibilität: is_transferred=True entspricht dem alten Schema
                queryset = queryset.filter(is_transferred=True)
            elif transfer_status == 'not_transferred':
                queryset = queryset.filter(is_transferred=False)
        
        # Standardfilter: Wenn keine Parameter angegeben, zeige aktive
        if destroyed is None and transfer_status is None:
            queryset = queryset.filter(is_destroyed=False, is_transferred=False)
            
        return queryset
    
    @action(detail=True, methods=['post'])
    def destroy_item(self, request, pk=None):
        """Markiert einen Eintrag als vernichtet"""
        drying = self.get_object()
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
            
        drying.mark_as_destroyed(reason, destroying_member)
        
        serializer = self.get_serializer(drying)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete_drying(self, request, pk=None):
        """Schließt den Trocknungsprozess ab und setzt das Trockengewicht"""
        drying = self.get_object()
        dried_weight = request.data.get('dried_weight', None)
        
        if not dried_weight:
            return Response(
                {'error': 'Trockengewicht muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            dried_weight = float(dried_weight)
            if dried_weight <= 0:
                raise ValueError("Gewicht muss positiv sein")
                
            if dried_weight > float(drying.fresh_weight):
                return Response(
                    {'error': f'Trockengewicht kann nicht größer als Frischgewicht ({drying.fresh_weight}g) sein'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Ungültiger Wert für Trockengewicht'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Trockengewicht setzen und Enddatum auf heute setzen
        drying.dried_weight = dried_weight
        drying.remaining_dried_weight = dried_weight
        drying.drying_end_date = timezone.now().date()
        drying.save()
        
        serializer = self.get_serializer(drying)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_as_fully_transferred(self, request, pk=None):
        """Markiert einen Eintrag als vollständig übergeführt"""
        drying = self.get_object()
        transferring_member_id = request.data.get('transferring_member', None)
        
        if not transferring_member_id:
            return Response(
                {'error': 'Verantwortliches Mitglied für die Überführung muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            transferring_member = Member.objects.get(id=transferring_member_id)
        except Member.DoesNotExist:
            return Response(
                {'error': 'Das angegebene Mitglied existiert nicht'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        drying.mark_as_fully_transferred(transferring_member)
        
        serializer = self.get_serializer(drying)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_as_partially_transferred(self, request, pk=None):
        """Markiert einen Eintrag als teilweise übergeführt"""
        drying = self.get_object()
        transferring_member_id = request.data.get('transferring_member', None)
        
        if not transferring_member_id:
            return Response(
                {'error': 'Verantwortliches Mitglied für die Überführung muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            transferring_member = Member.objects.get(id=transferring_member_id)
        except Member.DoesNotExist:
            return Response(
                {'error': 'Das angegebene Mitglied existiert nicht'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        drying.mark_as_partially_transferred(transferring_member)
        
        serializer = self.get_serializer(drying)
        return Response(serializer.data)
    

class ProcessingViewSet(viewsets.ModelViewSet):
    """API-Endpunkte für Verarbeitungen mit erweiterter Überführungslogik"""
    queryset = Processing.objects.all()
    serializer_class = ProcessingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtering für aktive/vernichtete/übergeführte Einträge mit erweitertem Transfer-Status"""
        queryset = Processing.objects.all()
        destroyed = self.request.query_params.get('destroyed', None)
        transfer_status = self.request.query_params.get('transfer_status', None)
        
        # Filter für Vernichtung anwenden
        if destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            queryset = queryset.filter(is_destroyed=is_destroyed)
        
        # Erweiterter Filter für Überführungsstatus
        if transfer_status is not None:
            if transfer_status == 'transferred':
                # Beide Status abfragen für Abwärtskompatibilität
                queryset = queryset.filter(
                    transfer_status__in=['partially_transferred', 'fully_transferred']
                )
            elif transfer_status in ['not_transferred', 'partially_transferred', 'fully_transferred']:
                queryset = queryset.filter(transfer_status=transfer_status)
        
        # Standardfilter: Wenn keine Parameter angegeben, zeige aktive (nicht vernichtet, nicht vollständig übergeführt)
        if destroyed is None and transfer_status is None:
            queryset = queryset.filter(
                is_destroyed=False, 
                transfer_status__in=['not_transferred', 'partially_transferred']
            )
            
        return queryset
    
    @action(detail=True, methods=['post'])
    def destroy_item(self, request, pk=None):
        """Markiert einen Eintrag als vernichtet"""
        processing = self.get_object()
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
            
        processing.mark_as_destroyed(reason, destroying_member)
        
        serializer = self.get_serializer(processing)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_partially_transferred(self, request, pk=None):
        """Markiert einen Eintrag als teilweise übergeführt"""
        processing = self.get_object()
        transferring_member_id = request.data.get('transferring_member', None)
        
        if not transferring_member_id:
            return Response(
                {'error': 'Verantwortliches Mitglied für die Überführung muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            transferring_member = Member.objects.get(id=transferring_member_id)
        except Member.DoesNotExist:
            return Response(
                {'error': 'Das angegebene Mitglied existiert nicht'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        processing.mark_as_partially_transferred(transferring_member)
        
        serializer = self.get_serializer(processing)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_fully_transferred(self, request, pk=None):
        """Markiert einen Eintrag als vollständig übergeführt"""
        processing = self.get_object()
        transferring_member_id = request.data.get('transferring_member', None)
        
        if not transferring_member_id:
            return Response(
                {'error': 'Verantwortliches Mitglied für die Überführung muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            transferring_member = Member.objects.get(id=transferring_member_id)
        except Member.DoesNotExist:
            return Response(
                {'error': 'Das angegebene Mitglied existiert nicht'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        processing.mark_as_fully_transferred(transferring_member)
        
        serializer = self.get_serializer(processing)
        return Response(serializer.data)
    

class LabTestingViewSet(viewsets.ModelViewSet):
    """API-Endpunkte für Laborkontrollen mit erweiterter Überführungslogik"""
    queryset = LabTesting.objects.all()
    serializer_class = LabTestingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtering für aktive/vernichtete/übergeführte Einträge mit erweitertem Transfer-Status"""
        queryset = LabTesting.objects.all()
        destroyed = self.request.query_params.get('destroyed', None)
        transfer_status = self.request.query_params.get('transfer_status', None)
        test_status = self.request.query_params.get('test_status', None)
        is_approved = self.request.query_params.get('is_approved', None)
        
        # Filter für Vernichtung anwenden
        if destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            queryset = queryset.filter(is_destroyed=is_destroyed)
        
        # Erweiterter Filter für Überführungsstatus
        if transfer_status is not None:
            if transfer_status == 'transferred':
                # Beide Status abfragen für Abwärtskompatibilität
                queryset = queryset.filter(
                    transfer_status__in=['partially_transferred', 'fully_transferred']
                )
            elif transfer_status in ['not_transferred', 'partially_transferred', 'fully_transferred']:
                queryset = queryset.filter(transfer_status=transfer_status)
        
        # Filter für Teststatus
        if test_status is not None:
            queryset = queryset.filter(test_status=test_status)
            
        # Filter für Freigabestatus
        if is_approved is not None:
            is_approved_bool = is_approved.lower() == 'true'
            queryset = queryset.filter(is_approved=is_approved_bool)
        
        # Standardfilter: Wenn keine Parameter angegeben, zeige aktive (nicht vernichtet, nicht vollständig übergeführt)
        if destroyed is None and transfer_status is None and test_status is None and is_approved is None:
            queryset = queryset.filter(
                is_destroyed=False, 
                transfer_status__in=['not_transferred', 'partially_transferred']
            )
            
        return queryset
    
    @action(detail=True, methods=['post'])
    def destroy_item(self, request, pk=None):
        """Markiert einen Eintrag als vernichtet"""
        lab_testing = self.get_object()
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
            
        lab_testing.mark_as_destroyed(reason, destroying_member)
        
        serializer = self.get_serializer(lab_testing)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_partially_transferred(self, request, pk=None):
        """Markiert einen Eintrag als teilweise übergeführt"""
        lab_testing = self.get_object()
        transferring_member_id = request.data.get('transferring_member', None)
        
        if not transferring_member_id:
            return Response(
                {'error': 'Verantwortliches Mitglied für die Überführung muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            transferring_member = Member.objects.get(id=transferring_member_id)
        except Member.DoesNotExist:
            return Response(
                {'error': 'Das angegebene Mitglied existiert nicht'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        lab_testing.mark_as_partially_transferred(transferring_member)
        
        serializer = self.get_serializer(lab_testing)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_fully_transferred(self, request, pk=None):
        """Markiert einen Eintrag als vollständig übergeführt"""
        lab_testing = self.get_object()
        transferring_member_id = request.data.get('transferring_member', None)
        
        if not transferring_member_id:
            return Response(
                {'error': 'Verantwortliches Mitglied für die Überführung muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            transferring_member = Member.objects.get(id=transferring_member_id)
        except Member.DoesNotExist:
            return Response(
                {'error': 'Das angegebene Mitglied existiert nicht'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        lab_testing.mark_as_fully_transferred(transferring_member)
        
        serializer = self.get_serializer(lab_testing)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_test_status(self, request, pk=None):
        """Aktualisiert den Test-Status"""
        lab_testing = self.get_object()
        test_status = request.data.get('test_status', '')
        
        if not test_status or test_status not in [choice[0] for choice in LabTesting.STATUS_CHOICES]:
            return Response(
                {'error': 'Gültiger Teststatus muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        lab_testing.test_status = test_status
        
        # Wenn Status auf 'completed' gesetzt wird, Datum auf heute setzen
        if test_status == 'completed' and not lab_testing.test_date:
            lab_testing.test_date = timezone.now().date()
            
        lab_testing.save()
        
        serializer = self.get_serializer(lab_testing)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def approve_testing(self, request, pk=None):
        """Markiert einen Test als freigegeben"""
        lab_testing = self.get_object()
        
        if lab_testing.test_status != 'completed':
            return Response(
                {'error': 'Der Test muss zuerst abgeschlossen werden, bevor er freigegeben werden kann'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        lab_testing.is_approved = True
        lab_testing.approval_date = timezone.now().date()
        lab_testing.save()
        
        serializer = self.get_serializer(lab_testing)
        return Response(serializer.data)
    

class PackagingViewSet(viewsets.ModelViewSet):
    """API-Endpunkte für Verpackungen mit erweiterter Überführungslogik"""
    queryset = Packaging.objects.all()
    serializer_class = PackagingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtering für aktive/vernichtete/übergeführte Einträge mit erweitertem Transfer-Status"""
        queryset = Packaging.objects.all()
        destroyed = self.request.query_params.get('destroyed', None)
        transfer_status = self.request.query_params.get('transfer_status', None)
        packaging_type = self.request.query_params.get('packaging_type', None)
        product_type = self.request.query_params.get('product_type', None)
        is_quality_checked = self.request.query_params.get('is_quality_checked', None)
        has_labels = self.request.query_params.get('has_labels', None)
        
        # Filter für Vernichtung anwenden
        if destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            queryset = queryset.filter(is_destroyed=is_destroyed)
        
        # Erweiterter Filter für Überführungsstatus
        if transfer_status is not None:
            if transfer_status == 'transferred':
                # Beide Status abfragen für Abwärtskompatibilität
                queryset = queryset.filter(
                    transfer_status__in=['partially_transferred', 'fully_transferred']
                )
            elif transfer_status in ['not_transferred', 'partially_transferred', 'fully_transferred']:
                queryset = queryset.filter(transfer_status=transfer_status)
        
        # Filter für Verpackungstyp
        if packaging_type is not None:
            queryset = queryset.filter(packaging_type=packaging_type)
            
        # Filter für Produkttyp
        if product_type is not None:
            queryset = queryset.filter(product_type=product_type)
            
        # Filter für Qualitätskontrolle
        if is_quality_checked is not None:
            is_quality_checked_bool = is_quality_checked.lower() == 'true'
            queryset = queryset.filter(is_quality_checked=is_quality_checked_bool)
            
        # Filter für Etikettierung
        if has_labels is not None:
            has_labels_bool = has_labels.lower() == 'true'
            queryset = queryset.filter(has_labels=has_labels_bool)
        
        # Standardfilter: Wenn keine Parameter angegeben, zeige aktive (nicht vernichtet, nicht vollständig übergeführt)
        if all(param is None for param in [destroyed, transfer_status, packaging_type, product_type, is_quality_checked, has_labels]):
            queryset = queryset.filter(
                is_destroyed=False, 
                transfer_status__in=['not_transferred', 'partially_transferred']
            )
            
        return queryset
    
    @action(detail=True, methods=['post'])
    def destroy_item(self, request, pk=None):
        """Markiert einen Eintrag als vernichtet"""
        packaging = self.get_object()
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
            
        packaging.mark_as_destroyed(reason, destroying_member)
        
        serializer = self.get_serializer(packaging)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_partially_transferred(self, request, pk=None):
        """Markiert einen Eintrag als teilweise übergeführt"""
        packaging = self.get_object()
        transferring_member_id = request.data.get('transferring_member', None)
        
        if not transferring_member_id:
            return Response(
                {'error': 'Verantwortliches Mitglied für die Überführung muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            transferring_member = Member.objects.get(id=transferring_member_id)
        except Member.DoesNotExist:
            return Response(
                {'error': 'Das angegebene Mitglied existiert nicht'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        packaging.mark_as_partially_transferred(transferring_member)
        
        serializer = self.get_serializer(packaging)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_fully_transferred(self, request, pk=None):
        """Markiert einen Eintrag als vollständig übergeführt"""
        packaging = self.get_object()
        transferring_member_id = request.data.get('transferring_member', None)
        
        if not transferring_member_id:
            return Response(
                {'error': 'Verantwortliches Mitglied für die Überführung muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            transferring_member = Member.objects.get(id=transferring_member_id)
        except Member.DoesNotExist:
            return Response(
                {'error': 'Das angegebene Mitglied existiert nicht'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        packaging.mark_as_fully_transferred(transferring_member)
        
        serializer = self.get_serializer(packaging)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_quality_checked(self, request, pk=None):
        """Markiert eine Verpackung als qualitätsgeprüft"""
        packaging = self.get_object()
        notes = request.data.get('quality_check_notes', '')
        
        packaging.is_quality_checked = True
        packaging.quality_check_date = timezone.now().date()
        packaging.quality_check_notes = notes
        packaging.save()
        
        serializer = self.get_serializer(packaging)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_labeled(self, request, pk=None):
        """Markiert eine Verpackung als etikettiert"""
        packaging = self.get_object()
        label_details = request.data.get('label_details', '')
        
        packaging.has_labels = True
        packaging.label_details = label_details
        packaging.save()
        
        serializer = self.get_serializer(packaging)
        return Response(serializer.data)
    

class ProductDistributionViewSet(viewsets.ModelViewSet):
    """API-Endpunkte für Produktausgaben mit erweiterter Überführungslogik"""
    queryset = ProductDistribution.objects.all()
    serializer_class = ProductDistributionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtering für aktive/vernichtete/übergeführte Einträge und spezifische Ausgabefilter"""
        queryset = ProductDistribution.objects.all()
        destroyed = self.request.query_params.get('destroyed', None)
        transfer_status = self.request.query_params.get('transfer_status', None)
        distribution_type = self.request.query_params.get('distribution_type', None)
        status = self.request.query_params.get('status', None)
        is_paid = self.request.query_params.get('is_paid', None)
        is_confirmed = self.request.query_params.get('is_confirmed', None)
        receiving_member = self.request.query_params.get('receiving_member', None)
        
        # Filter für Vernichtung anwenden
        if destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            queryset = queryset.filter(is_destroyed=is_destroyed)
        
        # Erweiterter Filter für Überführungsstatus
        if transfer_status is not None:
            if transfer_status == 'transferred':
                # Beide Status abfragen für Abwärtskompatibilität
                queryset = queryset.filter(
                    transfer_status__in=['partially_transferred', 'fully_transferred']
                )
            elif transfer_status in ['not_transferred', 'partially_transferred', 'fully_transferred']:
                queryset = queryset.filter(transfer_status=transfer_status)
        
        # Filter für Ausgabetyp
        if distribution_type is not None:
            queryset = queryset.filter(distribution_type=distribution_type)
            
        # Filter für Status
        if status is not None:
            queryset = queryset.filter(status=status)
            
        # Filter für Bezahlstatus
        if is_paid is not None:
            is_paid_bool = is_paid.lower() == 'true'
            queryset = queryset.filter(is_paid=is_paid_bool)
            
        # Filter für Bestätigungsstatus
        if is_confirmed is not None:
            is_confirmed_bool = is_confirmed.lower() == 'true'
            queryset = queryset.filter(is_confirmed=is_confirmed_bool)
            
        # Filter für Empfänger
        if receiving_member is not None:
            queryset = queryset.filter(receiving_member=receiving_member)
        
        # Standardfilter: Wenn keine Parameter angegeben, zeige aktive (nicht vernichtet, nicht vollständig übergeführt)
        if all(param is None for param in [destroyed, transfer_status, distribution_type, status, is_paid, is_confirmed, receiving_member]):
            queryset = queryset.filter(
                is_destroyed=False, 
                transfer_status__in=['not_transferred', 'partially_transferred']
            )
            
        return queryset
    
    @action(detail=True, methods=['post'])
    def destroy_item(self, request, pk=None):
        """Markiert einen Eintrag als vernichtet"""
        distribution = self.get_object()
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
            
        distribution.mark_as_destroyed(reason, destroying_member)
        
        serializer = self.get_serializer(distribution)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_partially_transferred(self, request, pk=None):
        """Markiert einen Eintrag als teilweise übergeführt"""
        distribution = self.get_object()
        transferring_member_id = request.data.get('transferring_member', None)
        
        if not transferring_member_id:
            return Response(
                {'error': 'Verantwortliches Mitglied für die Überführung muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            transferring_member = Member.objects.get(id=transferring_member_id)
        except Member.DoesNotExist:
            return Response(
                {'error': 'Das angegebene Mitglied existiert nicht'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        distribution.mark_as_partially_transferred(transferring_member)
        
        serializer = self.get_serializer(distribution)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_fully_transferred(self, request, pk=None):
        """Markiert einen Eintrag als vollständig übergeführt"""
        distribution = self.get_object()
        transferring_member_id = request.data.get('transferring_member', None)
        
        if not transferring_member_id:
            return Response(
                {'error': 'Verantwortliches Mitglied für die Überführung muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            transferring_member = Member.objects.get(id=transferring_member_id)
        except Member.DoesNotExist:
            return Response(
                {'error': 'Das angegebene Mitglied existiert nicht'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        distribution.mark_as_fully_transferred(transferring_member)
        
        serializer = self.get_serializer(distribution)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Aktualisiert den Status einer Produktausgabe"""
        distribution = self.get_object()
        new_status = request.data.get('status', None)
        
        if not new_status or new_status not in [choice[0] for choice in ProductDistribution.STATUS_CHOICES]:
            return Response(
                {'error': 'Gültiger Status muss angegeben werden'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        distribution.status = new_status
        
        # Wenn Status auf 'completed' gesetzt wird, automatisch Bestätigung setzen
        if new_status == 'completed' and not distribution.is_confirmed:
            distribution.is_confirmed = True
            distribution.confirmation_date = timezone.now().date()
            
        distribution.save()
        
        serializer = self.get_serializer(distribution)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_paid(self, request, pk=None):
        """Markiert eine Produktausgabe als bezahlt"""
        distribution = self.get_object()
        payment_method = request.data.get('payment_method', '')
        
        distribution.is_paid = True
        distribution.payment_date = timezone.now().date()
        
        if payment_method:
            distribution.payment_method = payment_method
            
        distribution.save()
        
        serializer = self.get_serializer(distribution)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def confirm_receipt(self, request, pk=None):
        """Bestätigt den Empfang einer Produktausgabe"""
        distribution = self.get_object()
        
        distribution.is_confirmed = True
        distribution.confirmation_date = timezone.now().date()
        distribution.save()
        
        serializer = self.get_serializer(distribution)
        return Response(serializer.data)