from rest_framework import viewsets, status, pagination
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import models
from .models import (
    SeedPurchase, MotherPlantBatch, MotherPlant, 
    FloweringPlantBatch, FloweringPlant, Cutting, CuttingBatch
)
from .serializers import (
    SeedPurchaseSerializer, MotherPlantBatchSerializer, 
    MotherPlantSerializer, FloweringPlantBatchSerializer,
    FloweringPlantSerializer, CuttingBatchSerializer, CuttingSerializer  # CuttingSerializer hinzugefügt
)

class StandardResultsSetPagination(pagination.PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 100

class SeedPurchaseViewSet(viewsets.ModelViewSet):
    queryset = SeedPurchase.objects.all().order_by('-created_at')
    serializer_class = SeedPurchaseSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = SeedPurchase.objects.all().order_by('-created_at')
        
        # Filtern nach Zeitraum
        year = self.request.query_params.get('year', None)
        month = self.request.query_params.get('month', None)
        day = self.request.query_params.get('day', None)
        
        if year:
            queryset = queryset.filter(created_at__year=year)
        if month:
            queryset = queryset.filter(created_at__month=month)
        if day:
            queryset = queryset.filter(created_at__day=day)
        
        # Filtern nach is_destroyed Status
        destroyed = self.request.query_params.get('destroyed', None)
        if destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            queryset = queryset.filter(is_destroyed=is_destroyed)
            
        # Berechne Anzahl für aktive und vernichtete Samen
        active_count = queryset.filter(is_destroyed=False).count()
        destroyed_count = queryset.filter(is_destroyed=True).count()
        
        # Berechne Anzahl für verschiedene Kategorien
        active_seed_count = queryset.filter(is_destroyed=False, remaining_quantity__gt=0).count()
        mother_converted_count = queryset.filter(is_destroyed=False).exclude(mother_batches=None).count()
        flowering_converted_count = queryset.filter(is_destroyed=False).exclude(flowering_batches=None).count()
        
        self.counts = {
            'active_count': active_count,
            'destroyed_count': destroyed_count,
            'active_seed_count': active_seed_count,
            'mother_converted_count': mother_converted_count,
            'flowering_converted_count': flowering_converted_count
        }
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data['counts'] = getattr(self, 'counts', {
            'active_count': 0,
            'destroyed_count': 0,
            'active_seed_count': 0,
            'mother_converted_count': 0,
            'flowering_converted_count': 0
        })
        return response
    
    @action(detail=True, methods=['post'])
    def convert_to_mother(self, request, pk=None):
        seed = self.get_object()
        quantity = int(request.data.get('quantity', 1))
        notes = request.data.get('notes', '')
        member_id = request.data.get('member_id', None)
        room_id = request.data.get('room_id', None)
        
        if quantity > seed.remaining_quantity:
            return Response(
                {"error": "Nicht genügend Samen verfügbar"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Erstelle einen Batch für die Mutterpflanzen
        batch_kwargs = {
            'seed_purchase': seed,
            'quantity': quantity,
            'notes': notes
        }
        
        # Hinzufügen von optionalen Feldern
        if member_id:
            batch_kwargs['member_id'] = member_id
        if room_id:
            batch_kwargs['room_id'] = room_id
            
        batch = MotherPlantBatch.objects.create(**batch_kwargs)
        
        # Erstelle für jede Mutterpflanze einen eigenen Eintrag im Batch mit eindeutiger Chargenummer
        for _ in range(quantity):
            # Die batch_number wird automatisch in der save-Methode generiert
            MotherPlant.objects.create(
                batch=batch,
                notes=notes
            )
            
        # Aktualisiere die verfügbaren Samen
        seed.remaining_quantity -= quantity
        seed.save()
        
        return Response({
            "message": f"{quantity} Mutterpflanzen wurden erstellt",
            "batch": MotherPlantBatchSerializer(batch).data
        })
        
    @action(detail=True, methods=['post'])
    def convert_to_flower(self, request, pk=None):
        seed = self.get_object()
        quantity = int(request.data.get('quantity', 1))
        notes = request.data.get('notes', '')
        member_id = request.data.get('member_id', None)
        room_id = request.data.get('room_id', None)
        
        if quantity > seed.remaining_quantity:
            return Response(
                {"error": "Nicht genügend Samen verfügbar"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Erstelle einen Batch für die Blühpflanzen
        batch_kwargs = {
            'seed_purchase': seed,
            'quantity': quantity,
            'notes': notes
        }
        
        # Hinzufügen von optionalen Feldern
        if member_id:
            batch_kwargs['member_id'] = member_id
        if room_id:
            batch_kwargs['room_id'] = room_id
            
        batch = FloweringPlantBatch.objects.create(**batch_kwargs)
        
        # Erstelle für jede Blühpflanze einen eigenen Eintrag im Batch mit eindeutiger Chargenummer
        for _ in range(quantity):
            # Die batch_number wird automatisch in der save-Methode generiert
            FloweringPlant.objects.create(
                batch=batch,
                notes=notes
            )
            
        # Aktualisiere die verfügbaren Samen
        seed.remaining_quantity -= quantity
        seed.save()
        
        return Response({
            "message": f"{quantity} Blühpflanzen wurden erstellt",
            "batch": FloweringPlantBatchSerializer(batch).data
        })
    
    @action(detail=True, methods=['post'])
    def destroy_seed(self, request, pk=None):
        seed = self.get_object()
        reason = request.data.get('reason', '')
        quantity = int(request.data.get('quantity', seed.remaining_quantity))
        destroyed_by_id = request.data.get('destroyed_by_id', None)
        
        # Validierungslogik bleibt unverändert
        if not reason:
            return Response(
                {"error": "Ein Vernichtungsgrund ist erforderlich"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if quantity <= 0:
            return Response(
                {"error": "Die Menge muss größer als 0 sein"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if quantity > seed.remaining_quantity:
            return Response(
                {"error": f"Nicht genügend Samen verfügbar (verfügbar: {seed.remaining_quantity})"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if quantity == seed.remaining_quantity:
            # Wenn alle verbleibenden Samen vernichtet werden
            seed.is_destroyed = True
            seed.destroy_reason = reason
            seed.destroyed_at = timezone.now()
            seed.destroyed_quantity = quantity  # Setze die vernichtete Menge
            seed.original_seed = seed  # Selbstreferenz bleibt erhalten
            
            if destroyed_by_id:
                seed.destroyed_by_id = destroyed_by_id
                
            seed.save()
            
            message = f"Alle {quantity} Samen wurden vernichtet"
        else:
            # Wenn nur ein Teil vernichtet wird
            destroyed_seed_kwargs = {
                'strain_name': seed.strain_name,
                'quantity': quantity,  # Die quantity bleibt gleich
                'remaining_quantity': 0,
                'destroyed_quantity': quantity,  # Setze die vernichtete Menge explizit
                'is_destroyed': True,
                'destroy_reason': reason,
                'destroyed_at': timezone.now(),
                'original_seed': seed  # Referenz zum Originalsamen bleibt erhalten
            }
            
            if destroyed_by_id:
                destroyed_seed_kwargs['destroyed_by_id'] = destroyed_by_id
                
            destroyed_seed = SeedPurchase.objects.create(**destroyed_seed_kwargs)
            
            # Aktualisiere das Original-Samen-Objekt
            seed.remaining_quantity -= quantity
            seed.save()
            
            message = f"{quantity} von {seed.quantity} Samen wurden vernichtet"
        
        return Response({
            "message": message
        })
    
    @action(detail=False, methods=['get'])
    def counts(self, request):
        # Aktive Samen
        active_seeds = SeedPurchase.objects.filter(is_destroyed=False)
        active_seed_count = active_seeds.filter(remaining_quantity__gt=0).count()
        total_active_quantity = active_seeds.aggregate(total=models.Sum('remaining_quantity'))['total'] or 0
        
        # Vernichtete Samen
        destroyed_seeds = SeedPurchase.objects.filter(is_destroyed=True)
        destroyed_count = destroyed_seeds.count()
        
        # Korrigierte Berechnung der tatsächlich vernichteten Samenmenge
        total_destroyed_quantity = 0
        for seed in destroyed_seeds:
            if seed.original_seed and seed.original_seed.id != seed.id:
                # Bei teilweiser Vernichtung: Direkt die Menge verwenden
                total_destroyed_quantity += seed.quantity
            else:
                # Bei vollständiger Vernichtung: Nur die wirklich vernichteten Samen zählen
                # Berechne, wie viele Samen zu Pflanzen konvertiert wurden
                converted_to_plants = 0
                for mother_batch in seed.mother_batches.all():
                    converted_to_plants += mother_batch.quantity
                for flowering_batch in seed.flowering_batches.all():
                    converted_to_plants += flowering_batch.quantity
                    
                # Nur die tatsächlich vernichteten Samen zählen
                actually_destroyed = seed.quantity - converted_to_plants
                total_destroyed_quantity += actually_destroyed
        
        # Batches und Pflanzen zählen
        mother_batch_count = MotherPlantBatch.objects.count()
        flowering_batch_count = FloweringPlantBatch.objects.count()
        
        mother_plant_count = MotherPlant.objects.filter(is_destroyed=False).count()
        flowering_plant_count = FloweringPlant.objects.filter(is_destroyed=False).count()
        
        return Response({
            'active_seed_count': active_seed_count,
            'total_active_seeds_quantity': total_active_quantity,
            'mother_batch_count': mother_batch_count,
            'mother_plant_count': mother_plant_count,
            'flowering_batch_count': flowering_batch_count,
            'flowering_plant_count': flowering_plant_count,
            'destroyed_count': destroyed_count,
            'total_destroyed_seeds_quantity': total_destroyed_quantity
        })

class MotherPlantBatchViewSet(viewsets.ModelViewSet):
    queryset = MotherPlantBatch.objects.all().order_by('-created_at')
    serializer_class = MotherPlantBatchSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = MotherPlantBatch.objects.all().order_by('-created_at')
        
        # Filtern nach Zeitraum
        year = self.request.query_params.get('year', None)
        month = self.request.query_params.get('month', None)
        day = self.request.query_params.get('day', None)
        
        # Neue Filter für aktive/vernichtete Pflanzen
        has_active = self.request.query_params.get('has_active', None)
        has_destroyed = self.request.query_params.get('has_destroyed', None)
        
        if year:
            queryset = queryset.filter(created_at__year=year)
        if month:
            queryset = queryset.filter(created_at__month=month)
        if day:
            queryset = queryset.filter(created_at__day=day)
        
        # Filter für Batches mit aktiven Pflanzen
        if has_active == 'true':
            queryset = queryset.filter(plants__is_destroyed=False).distinct()
        
        # Filter für Batches mit vernichteten Pflanzen
        if has_destroyed == 'true':
            queryset = queryset.filter(plants__is_destroyed=True).distinct()
            
        # Berechne Anzahl für aktive und vernichtete Pflanzen
        active_plants = 0
        destroyed_plants = 0
        
        for batch in queryset:
            active_plants += batch.plants.filter(is_destroyed=False).count()
            destroyed_plants += batch.plants.filter(is_destroyed=True).count()
        
        self.counts = {
            'active_count': active_plants,
            'destroyed_count': destroyed_plants
        }
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data['counts'] = getattr(self, 'counts', {
            'active_count': 0,
            'destroyed_count': 0
        })
        return response
    
    @action(detail=True, methods=['get'])
    def plants(self, request, pk=None):
        batch = self.get_object()
        destroyed = request.query_params.get('destroyed', None)
        
        plants = batch.plants.all()
        if destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            plants = plants.filter(is_destroyed=is_destroyed)
        
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(plants, request)
        
        if page is not None:
            serializer = MotherPlantSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = MotherPlantSerializer(plants, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def destroy_plants(self, request, pk=None):
        batch = self.get_object()
        plant_ids = request.data.get('plant_ids', [])
        reason = request.data.get('reason', '')
        
        if not plant_ids:
            return Response(
                {"error": "Keine Pflanzen IDs angegeben"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        MotherPlant.objects.filter(id__in=plant_ids, batch=batch).update(
            is_destroyed=True,
            destroy_reason=reason,
            destroyed_at=timezone.now()
        )
        
        return Response({
            "message": f"{len(plant_ids)} Mutterpflanzen wurden als vernichtet markiert"
        })

    @action(detail=False, methods=['get'])
    def counts(self, request):
        """
        Gibt die Anzahl der Batches und Pflanzen je nach Typ zurück.
        """
        count_type = self.request.query_params.get('type', None)
        
        if count_type == 'active':
            # Zählung für aktive Pflanzen
            batches_count = MotherPlantBatch.objects.filter(
                plants__is_destroyed=False
            ).distinct().count()
            plants_count = MotherPlant.objects.filter(is_destroyed=False).count()
            
            return Response({
                "batches_count": batches_count,
                "plants_count": plants_count
            })
            
        elif count_type == 'destroyed':
            # Zählung für vernichtete Pflanzen
            batches_count = MotherPlantBatch.objects.filter(
                plants__is_destroyed=True
            ).distinct().count()
            plants_count = MotherPlant.objects.filter(is_destroyed=True).count()
            
            return Response({
                "batches_count": batches_count,
                "plants_count": plants_count
            })
            
        elif count_type == 'cutting':
            # Zählung für Stecklinge
            batch_count = CuttingBatch.objects.filter(mother_batch__isnull=False).count()
            cutting_count = 0
            for batch in CuttingBatch.objects.filter(mother_batch__isnull=False):
                cutting_count += batch.cuttings.filter(is_destroyed=False).count()
                
            return Response({
                "batch_count": batch_count,
                "cutting_count": cutting_count
            })
        
        else:
            # Wenn kein Typ angegeben ist, gib alle Zahlen zurück
            active_batches = MotherPlantBatch.objects.filter(
                plants__is_destroyed=False
            ).distinct().count()
            active_plants = MotherPlant.objects.filter(is_destroyed=False).count()
            
            destroyed_batches = MotherPlantBatch.objects.filter(
                plants__is_destroyed=True
            ).distinct().count()
            destroyed_plants = MotherPlant.objects.filter(is_destroyed=True).count()
            
            cutting_batches = CuttingBatch.objects.filter(mother_batch__isnull=False).count()
            cutting_count = 0
            for batch in CuttingBatch.objects.filter(mother_batch__isnull=False):
                cutting_count += batch.cuttings.filter(is_destroyed=False).count()
            
            return Response({
                "active_batches_count": active_batches,
                "active_plants_count": active_plants,
                "destroyed_batches_count": destroyed_batches,
                "destroyed_plants_count": destroyed_plants,
                "cutting_batch_count": cutting_batches,
                "cutting_count": cutting_count
            })
        
    @action(detail=True, methods=['post'])
    def create_cuttings(self, request, pk=None):
        """
        Erstellt Stecklinge von einer Mutterpflanzen-Charge.
        """
        mother_batch = self.get_object()
        quantity = int(request.data.get('quantity', 1))
        notes = request.data.get('notes', '')
        member_id = request.data.get('member_id', None)
        room_id = request.data.get('room_id', None)
        
        # Erstelle einen Batch für die Stecklinge
        batch_kwargs = {
            'mother_batch': mother_batch,
            'quantity': quantity,
            'notes': notes
        }
        
        # Hinzufügen von optionalen Feldern
        if member_id:
            batch_kwargs['member_id'] = member_id
        if room_id:
            batch_kwargs['room_id'] = room_id
            
        batch = CuttingBatch.objects.create(**batch_kwargs)
        
        # Erstelle für jeden Steckling einen eigenen Eintrag im Batch mit eindeutiger Chargenummer
        for _ in range(quantity):
            # Die batch_number wird automatisch in der save-Methode generiert
            Cutting.objects.create(
                batch=batch,
                notes=notes
            )
        
        return Response({
            "message": f"{quantity} Stecklinge wurden erstellt",
            "batch": CuttingBatchSerializer(batch).data
        })

class FloweringPlantBatchViewSet(viewsets.ModelViewSet):
    queryset = FloweringPlantBatch.objects.all().order_by('-created_at')
    serializer_class = FloweringPlantBatchSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = FloweringPlantBatch.objects.all().order_by('-created_at')
        
        # Filtern nach Zeitraum
        year = self.request.query_params.get('year', None)
        month = self.request.query_params.get('month', None)
        day = self.request.query_params.get('day', None)
        
        if year:
            queryset = queryset.filter(created_at__year=year)
        if month:
            queryset = queryset.filter(created_at__month=month)
        if day:
            queryset = queryset.filter(created_at__day=day)
            
        # Berechne Anzahl für aktive und vernichtete Pflanzen
        active_plants = 0
        destroyed_plants = 0
        
        for batch in queryset:
            active_plants += batch.plants.filter(is_destroyed=False).count()
            destroyed_plants += batch.plants.filter(is_destroyed=True).count()
        
        self.counts = {
            'active_count': active_plants,
            'destroyed_count': destroyed_plants
        }
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data['counts'] = getattr(self, 'counts', {
            'active_count': 0,
            'destroyed_count': 0
        })
        return response
    
    @action(detail=True, methods=['get'])
    def plants(self, request, pk=None):
        batch = self.get_object()
        destroyed = request.query_params.get('destroyed', None)
        
        plants = batch.plants.all()
        if destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            plants = plants.filter(is_destroyed=is_destroyed)
        
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(plants, request)
        
        if page is not None:
            serializer = FloweringPlantSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = FloweringPlantSerializer(plants, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def destroy_plants(self, request, pk=None):
        batch = self.get_object()
        plant_ids = request.data.get('plant_ids', [])
        reason = request.data.get('reason', '')
        
        if not plant_ids:
            return Response(
                {"error": "Keine Pflanzen IDs angegeben"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        FloweringPlant.objects.filter(id__in=plant_ids, batch=batch).update(
            is_destroyed=True,
            destroy_reason=reason,
            destroyed_at=timezone.now()
        )
        
        return Response({
            "message": f"{len(plant_ids)} Blühpflanzen wurden als vernichtet markiert"
        })
    
    @action(detail=False, methods=['get'])
    def counts(self, request):
        """
        Gibt die Gesamtzahl der aktiven und vernichteten Blühpflanzen zurück
        """
        active_count = FloweringPlant.objects.filter(is_destroyed=False).count()
        destroyed_count = FloweringPlant.objects.filter(is_destroyed=True).count()
        
        return Response({
            "active_count": active_count,
            "destroyed_count": destroyed_count
        })

class CuttingBatchViewSet(viewsets.ModelViewSet):
    queryset = CuttingBatch.objects.all().order_by('-created_at')
    serializer_class = CuttingBatchSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = CuttingBatch.objects.all().order_by('-created_at')
        
        # Filtern nach Zeitraum
        year = self.request.query_params.get('year', None)
        month = self.request.query_params.get('month', None)
        day = self.request.query_params.get('day', None)
        
        # Filtern nach Mutterpflanzen-Batch, falls Parameter vorhanden
        mother_batch_id = self.request.query_params.get('mother_batch_id', None)
        if mother_batch_id:
            queryset = queryset.filter(mother_batch_id=mother_batch_id)
        
        if year:
            queryset = queryset.filter(created_at__year=year)
        if month:
            queryset = queryset.filter(created_at__month=month)
        if day:
            queryset = queryset.filter(created_at__day=day)
            
        # Berechne Anzahl für aktive und vernichtete Stecklinge
        active_cuttings = 0
        destroyed_cuttings = 0
        
        for batch in queryset:
            active_cuttings += batch.cuttings.filter(is_destroyed=False).count()
            destroyed_cuttings += batch.cuttings.filter(is_destroyed=True).count()
        
        self.counts = {
            'active_count': active_cuttings,
            'destroyed_count': destroyed_cuttings
        }
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data['counts'] = getattr(self, 'counts', {
            'active_count': 0,
            'destroyed_count': 0
        })
        return response
    
    @action(detail=True, methods=['get'])
    def cuttings(self, request, pk=None):
        batch = self.get_object()
        destroyed = request.query_params.get('destroyed', None)
        
        cuttings = batch.cuttings.all()
        if destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            cuttings = cuttings.filter(is_destroyed=is_destroyed)
        
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(cuttings, request)
        
        if page is not None:
            serializer = CuttingSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = CuttingSerializer(cuttings, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def destroy_cuttings(self, request, pk=None):
        batch = self.get_object()
        cutting_ids = request.data.get('cutting_ids', [])
        reason = request.data.get('reason', '')
        destroyed_by_id = request.data.get('destroyed_by_id')
        
        if not cutting_ids:
            return Response(
                {"error": "Keine Stecklings-IDs angegeben"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not reason:
            return Response(
                {"error": "Ein Vernichtungsgrund ist erforderlich"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not destroyed_by_id:
            return Response(
                {"error": "Ein verantwortliches Mitglied muss angegeben werden"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        destroy_data = {
            'is_destroyed': True,
            'destroy_reason': reason,
            'destroyed_at': timezone.now()
        }
        
        if destroyed_by_id:
            destroy_data['destroyed_by_id'] = destroyed_by_id
            
        Cutting.objects.filter(id__in=cutting_ids, batch=batch).update(**destroy_data)
        
        return Response({
            "message": f"{len(cutting_ids)} Stecklinge wurden als vernichtet markiert"
        })
    
    @action(detail=False, methods=['get'])
    def counts(self, request):
        """
        Gibt die Gesamtzahl der aktiven und vernichteten Stecklinge zurück
        """
        active_count = Cutting.objects.filter(is_destroyed=False).count()
        destroyed_count = Cutting.objects.filter(is_destroyed=True).count()
        
        return Response({
            "active_count": active_count,
            "destroyed_count": destroyed_count
        })
    

class MotherPlantViewSet(viewsets.ModelViewSet):
    """
    ViewSet für die Verwaltung einzelner Mutterpflanzen.
    """
    queryset = MotherPlant.objects.all()
    serializer_class = MotherPlantSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def create_cuttings(self, request, pk=None):
        """
        Erstellt Stecklinge von einer spezifischen Mutterpflanze.
        """
        plant = self.get_object()
        batch = plant.batch  # Hole den Batch der Mutterpflanze
        
        quantity = int(request.data.get('quantity', 1))
        notes = request.data.get('notes', '')
        member_id = request.data.get('member_id', None)
        room_id = request.data.get('room_id', None)
        
        # Erstelle einen neuen Batch für die Stecklinge
        batch_kwargs = {
            'mother_batch': batch,
            'quantity': quantity,
            'notes': notes
        }
        
        # Hinzufügen von optionalen Feldern
        if member_id:
            batch_kwargs['member_id'] = member_id
        if room_id:
            batch_kwargs['room_id'] = room_id
        
        # In den Notes die Ursprungspflanze vermerken
        plant_notes = f"Erstellt von Mutterpflanze {plant.batch_number} (ID: {plant.id})"
        if notes:
            batch_kwargs['notes'] = f"{notes} - {plant_notes}"
        else:
            batch_kwargs['notes'] = plant_notes
            
        cutting_batch = CuttingBatch.objects.create(**batch_kwargs)
        
        # Erstelle für jeden Steckling einen eigenen Eintrag mit eindeutiger Nummer
        for _ in range(quantity):
            Cutting.objects.create(
                batch=cutting_batch,
                notes=batch_kwargs['notes']
            )
        
        return Response({
            "message": f"{quantity} Stecklinge wurden von Mutterpflanze {plant.batch_number} erstellt",
            "batch": CuttingBatchSerializer(cutting_batch).data
        })

