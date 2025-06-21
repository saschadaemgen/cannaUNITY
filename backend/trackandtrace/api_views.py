# Standard library imports
from datetime import datetime, timedelta
from collections import OrderedDict, defaultdict

# Third-party imports
from dateutil.relativedelta import relativedelta
from django.db import models
from django.db.models import Q, Sum, Count, Avg, Min, F, Case, When, Value, CharField
from django.utils import timezone
from rest_framework import pagination, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import SeedPurchase 
from collections import OrderedDict

# Local application imports
from .models import (
    BloomingCuttingBatch,
    BloomingCuttingPlant,
    Cutting,
    CuttingBatch,
    DryingBatch,
    FloweringPlant,
    FloweringPlantBatch,
    HarvestBatch,
    LabTestingBatch,
    MotherPlant,
    MotherPlantBatch,
    PackagingBatch,
    PackagingUnit,
    ProcessingBatch,
    ProductDistribution,
    SeedPurchase,
)
from .serializers import (
    BloomingCuttingBatchSerializer,
    BloomingCuttingPlantSerializer,
    CuttingBatchSerializer,
    CuttingSerializer,
    DryingBatchSerializer,
    FloweringPlantBatchSerializer,
    FloweringPlantSerializer,
    HarvestBatchSerializer,
    LabTestingBatchSerializer,
    MotherPlantBatchSerializer,
    MotherPlantSerializer,
    PackagingBatchSerializer,
    PackagingUnitSerializer,
    ProcessingBatchSerializer,
    ProductDistributionSerializer,
    SeedPurchaseSerializer,
)

# External app imports
from wawi.models import CannabisStrain
from wawi.serializers import CannabisStrainSerializer

class StandardResultsSetPagination(pagination.PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_page_size(self, request):
        """
        Überschreiben der get_page_size-Methode, um die Verarbeitung 
        des page_size-Parameters zu verbessern und zu debuggen
        """
        # Versuche, den page_size-Parameter aus der Anfrage zu lesen
        page_size = request.query_params.get(self.page_size_query_param)
        
        if page_size:
            try:
                # Explizite Umwandlung in einen Integer
                parsed_size = int(page_size)

                # Überprüfung auf gültige Größe
                if parsed_size < 1:
                    return self.page_size
                    
                if self.max_page_size and parsed_size > self.max_page_size:
                    return self.max_page_size
                    
                # Gültiger Wert
                return parsed_size
                
            except ValueError:
                # Fehler bei der Umwandlung, verwende Standard
                return self.page_size
        
        # Kein page_size-Parameter, verwende Standard
        return self.page_size

class StrainCardPagination(pagination.PageNumberPagination):
    """Pagination speziell für StrainCards"""
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 50

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
    
    @action(detail=False, methods=['get'])
    def strain_options(self, request):
        """
        Liefert eine Liste aller verfügbaren Cannabis-Sorten für die Dropdown-Auswahl
        """
        strains = CannabisStrain.objects.filter(is_active=True).order_by('name')
        
        # Einfacher Serializer für die Dropdown-Optionen
        from rest_framework import serializers
        class StrainOptionSerializer(serializers.ModelSerializer):
            class Meta:
                model = CannabisStrain
                fields = ['id', 'name', 'breeder', 'thc_percentage_min', 'thc_percentage_max',
                          'cbd_percentage_min', 'cbd_percentage_max', 'flowering_time_min', 
                          'flowering_time_max', 'strain_type']
        
        serializer = StrainOptionSerializer(strains, many=True)
        return Response(serializer.data)
    

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
        
        # Filter für aktive/vernichtete/geerntete Pflanzen
        has_active = self.request.query_params.get('has_active', None)
        has_destroyed = self.request.query_params.get('has_destroyed', None)
        has_harvested = self.request.query_params.get('has_harvested', None)
        
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
            queryset = queryset.filter(
                plants__is_destroyed=True
            ).exclude(
                plants__destroy_reason__icontains="Zur Ernte konvertiert"
            ).distinct()
            
        # Filter für Batches mit zu Ernte überführten Pflanzen
        if has_harvested == 'true':
            queryset = queryset.filter(
                plants__is_destroyed=True,
                plants__destroy_reason__icontains="Zur Ernte konvertiert"
            ).distinct()
            
        # Berechne Anzahl für aktive, vernichtete und geerntete Pflanzen
        active_plants = 0
        destroyed_plants = 0
        harvested_plants = 0
        
        for batch in queryset:
            active_plants += batch.plants.filter(is_destroyed=False).count()
            
            # Zähle vernichtete Pflanzen (nicht zu Ernte überführt)
            destroyed_plants += batch.plants.filter(
                is_destroyed=True
            ).exclude(
                destroy_reason__icontains="Zur Ernte konvertiert"
            ).count()
            
            # Zähle zu Ernte überführte Pflanzen
            harvested_plants += batch.plants.filter(
                is_destroyed=True,
                destroy_reason__icontains="Zur Ernte konvertiert"
            ).count()
        
        self.counts = {
            'active_count': active_plants,
            'destroyed_count': destroyed_plants,
            'harvested_count': harvested_plants
        }
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data['counts'] = getattr(self, 'counts', {
            'active_count': 0,
            'destroyed_count': 0,
            'harvested_count': 0
        })
        return response
    
    @action(detail=True, methods=['get'])
    def plants(self, request, pk=None):
        batch = self.get_object()
        destroyed = request.query_params.get('destroyed', None)
        converted_to_harvest = request.query_params.get('converted_to_harvest', None)
        
        plants = batch.plants.all()
        
        if converted_to_harvest is not None:
            is_converted = converted_to_harvest.lower() == 'true'
            if is_converted:
                plants = plants.filter(
                    is_destroyed=True,
                    destroy_reason__icontains="Zur Ernte konvertiert"
                )
            else:
                plants = plants.exclude(
                    is_destroyed=True,
                    destroy_reason__icontains="Zur Ernte konvertiert"
                )
        elif destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            
            if is_destroyed:
                # Vernichtete Pflanzen anzeigen, aber keine zur Ernte überführten
                plants = plants.filter(is_destroyed=True).exclude(
                    destroy_reason__icontains="Zur Ernte konvertiert"
                )
            else:
                # Nur aktive Pflanzen anzeigen
                plants = plants.filter(is_destroyed=False)
        
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
        Gibt die Anzahl der Batches und Pflanzen je nach Typ zurück.
        """
        count_type = self.request.query_params.get('type', None)
        
        if count_type == 'active':
            # Zählung für aktive Pflanzen
            batches_count = FloweringPlantBatch.objects.filter(
                plants__is_destroyed=False
            ).distinct().count()
            plants_count = FloweringPlant.objects.filter(is_destroyed=False).count()
            
            return Response({
                "batches_count": batches_count,
                "plants_count": plants_count
            })
            
        elif count_type == 'destroyed':
            # Zählung für vernichtete Pflanzen (ohne zu Ernte überführte)
            destroyed_plants = FloweringPlant.objects.filter(
                is_destroyed=True
            ).exclude(
                destroy_reason__icontains="Zur Ernte konvertiert"
            )
            
            batches_count = FloweringPlantBatch.objects.filter(
                plants__in=destroyed_plants
            ).distinct().count()
            plants_count = destroyed_plants.count()
            
            return Response({
                "batches_count": batches_count,
                "plants_count": plants_count
            })
            
        elif count_type == 'harvested':
            # Zählung für zu Ernte überführte Pflanzen
            harvested_plants = FloweringPlant.objects.filter(
                is_destroyed=True,
                destroy_reason__icontains="Zur Ernte konvertiert"
            )
            
            batches_count = FloweringPlantBatch.objects.filter(
                plants__in=harvested_plants
            ).distinct().count()
            plants_count = harvested_plants.count()
            
            return Response({
                "batches_count": batches_count,
                "harvested_plants_count": plants_count
            })
        
        else:
            # Wenn kein Typ angegeben ist, gib alle Zahlen zurück
            active_plants = FloweringPlant.objects.filter(is_destroyed=False)
            
            destroyed_plants = FloweringPlant.objects.filter(
                is_destroyed=True
            ).exclude(
                destroy_reason__icontains="Zur Ernte konvertiert"
            )
            
            harvested_plants = FloweringPlant.objects.filter(
                is_destroyed=True,
                destroy_reason__icontains="Zur Ernte konvertiert"
            )
            
            active_batches = FloweringPlantBatch.objects.filter(
                plants__in=active_plants
            ).distinct().count()
            
            destroyed_batches = FloweringPlantBatch.objects.filter(
                plants__in=destroyed_plants
            ).distinct().count()
            
            harvested_batches = FloweringPlantBatch.objects.filter(
                plants__in=harvested_plants
            ).distinct().count()
            
            return Response({
                "active_batches_count": active_batches,
                "active_plants_count": active_plants.count(),
                "destroyed_batches_count": destroyed_batches,
                "destroyed_plants_count": destroyed_plants.count(),
                "harvested_batches_count": harvested_batches,
                "harvested_plants_count": harvested_plants.count()
            })
            
    @action(detail=True, methods=['post'])
    def convert_to_harvest(self, request, pk=None):
        """
        Konvertiert ausgewählte Blühpflanzen zu einer Ernte.
        """
        batch = self.get_object()
        weight = request.data.get('weight', 0)
        notes = request.data.get('notes', '')
        member_id = request.data.get('member_id', None)
        room_id = request.data.get('room_id', None)
        plant_ids = request.data.get('plant_ids', [])
        
        # Validierung
        try:
            weight = float(weight)
            if weight <= 0:
                return Response(
                    {"error": "Das Gewicht muss größer als 0 sein"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (TypeError, ValueError):
            return Response(
                {"error": "Ungültiges Gewicht"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Erstelle Ernte-Batch
        harvest_kwargs = {
            'flowering_batch': batch,
            'weight': weight,
            'notes': notes
        }
        
        # Hinzufügen von optionalen Feldern
        if member_id:
            harvest_kwargs['member_id'] = member_id
        if room_id:
            harvest_kwargs['room_id'] = room_id
        
        harvest = HarvestBatch.objects.create(**harvest_kwargs)
        
        # Optional: Markiere die verwendeten Pflanzen als geerntet
        if plant_ids:
            # Überprüfe, ob die Pflanzen zu diesem Batch gehören
            plants = FloweringPlant.objects.filter(id__in=plant_ids, batch=batch)
            
            for plant in plants:
                plant.is_destroyed = True
                plant.destroy_reason = f"Zur Ernte konvertiert (Charge: {harvest.batch_number})"
                plant.destroyed_at = timezone.now()
                if member_id:
                    plant.destroyed_by_id = member_id
                plant.save()
        
        return Response({
            "message": f"Ernte mit {weight}g wurde erstellt",
            "harvest": HarvestBatchSerializer(harvest).data
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
        
        # Filter für aktive/vernichtete/konvertierte Stecklinge
        has_active = self.request.query_params.get('has_active', None)
        has_destroyed = self.request.query_params.get('has_destroyed', None)
        has_converted = self.request.query_params.get('has_converted', None)
        
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
        
        # Filter für Batches mit aktiven Stecklingen
        if has_active == 'true':
            queryset = queryset.filter(cuttings__is_destroyed=False).distinct()
        
        # Filter für Batches mit vernichteten Stecklingen
        if has_destroyed == 'true':
            queryset = queryset.filter(cuttings__is_destroyed=True).distinct()
            
        # Neuer Filter für Batches mit zu Blühpflanzen konvertierten Stecklingen
        if has_converted == 'true':
            converted_query = Q(is_destroyed=True, destroy_reason__icontains="Zu Blühpflanze konvertiert")
            queryset = queryset.filter(cuttings__in=Cutting.objects.filter(converted_query)).distinct()
            
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
        converted = request.query_params.get('converted', None)
        
        cuttings = batch.cuttings.all()
        
        if destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            cuttings = cuttings.filter(is_destroyed=is_destroyed)
        
        if converted is not None:
            is_converted = converted.lower() == 'true'
            # Filtern nach Stecklingen, die zu Blühpflanzen konvertiert wurden
            if is_converted:
                cuttings = cuttings.filter(
                    is_destroyed=True,
                    destroy_reason__icontains="Zu Blühpflanze konvertiert"
                )
        
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
        Gibt die Anzahl der Batches und Stecklinge je nach Typ zurück.
        """
        count_type = self.request.query_params.get('type', None)
        
        if count_type == 'all':
            # Alle Zähler auf einmal zurückgeben
            active_batches = CuttingBatch.objects.filter(
                cuttings__is_destroyed=False
            ).distinct().count()
            active_count = Cutting.objects.filter(is_destroyed=False).count()
            
            destroyed_batches = CuttingBatch.objects.filter(
                cuttings__is_destroyed=True
            ).distinct().count()
            destroyed_count = Cutting.objects.filter(is_destroyed=True).count()
            
            # Zu Blühpflanzen konvertierte Stecklinge zählen
            converted_query = Q(is_destroyed=True, destroy_reason__icontains="Zu Blühpflanze konvertiert")
            converted_batches = CuttingBatch.objects.filter(
                cuttings__in=Cutting.objects.filter(converted_query)
            ).distinct().count()
            converted_count = Cutting.objects.filter(converted_query).count()
            
            return Response({
                "active_batches_count": active_batches,
                "active_count": active_count,
                "destroyed_batches_count": destroyed_batches,
                "destroyed_count": destroyed_count,
                "converted_batches_count": converted_batches,
                "converted_count": converted_count
            })
        
        # Standardverhalten: nur aktive/vernichtete Zähler zurückgeben
        active_count = Cutting.objects.filter(is_destroyed=False).count()
        destroyed_count = Cutting.objects.filter(is_destroyed=True).count()
        
        return Response({
            "active_count": active_count,
            "destroyed_count": destroyed_count
        })
        
    @action(detail=True, methods=['post'])
    def convert_to_blooming(self, request, pk=None):
        """
        Konvertiert Stecklinge zu Blühpflanzen aus Stecklingen.
        """
        cutting_batch = self.get_object()
        quantity = int(request.data.get('quantity', 1))
        notes = request.data.get('notes', '')
        member_id = request.data.get('member_id', None)
        room_id = request.data.get('room_id', None)
        cutting_ids = request.data.get('cutting_ids', [])
                
        # Filtere ungültige IDs heraus
        if cutting_ids and isinstance(cutting_ids, list):
            cutting_ids = [id for id in cutting_ids if id is not None]
        
        # Prüfen, ob genügend aktive Stecklinge vorhanden sind
        active_cuttings = cutting_batch.cuttings.filter(is_destroyed=False)
        
        if cutting_ids:
            # Nur bestimmte Stecklinge verwenden
            selected_cuttings = active_cuttings.filter(id__in=cutting_ids)
            
            if selected_cuttings.count() < len(cutting_ids):
                return Response(
                    {"error": "Einige ausgewählte Stecklinge wurden nicht gefunden oder sind bereits vernichtet"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if selected_cuttings.count() < quantity:
                return Response(
                    {"error": f"Nicht genügend ausgewählte Stecklinge verfügbar (verfügbar: {selected_cuttings.count()})"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            cuttings_to_use = selected_cuttings
        else:
            # Alle aktiven Stecklinge verwenden
            if active_cuttings.count() < quantity:
                return Response(
                    {"error": f"Nicht genügend aktive Stecklinge verfügbar (verfügbar: {active_cuttings.count()})"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            cuttings_to_use = active_cuttings
        
        # Erstelle einen Batch für die Blühpflanzen aus Stecklingen
        batch_kwargs = {
            'cutting_batch': cutting_batch,
            'quantity': quantity,
            'notes': notes
        }
        
        # Hinzufügen von optionalen Feldern
        if member_id:
            batch_kwargs['member_id'] = member_id
        if room_id:
            batch_kwargs['room_id'] = room_id
            
        try:
            batch = BloomingCuttingBatch.objects.create(**batch_kwargs)
            
            # Erstelle für jede Blühpflanze einen eigenen Eintrag im Batch mit eindeutiger Chargenummer
            for _ in range(quantity):
                # Die batch_number wird automatisch in der save-Methode generiert
                BloomingCuttingPlant.objects.create(
                    batch=batch,
                    notes=notes
                )
            
            # Markiere die verwendeten Stecklinge als vernichtet und konvertiert
            cuttings_to_mark = cuttings_to_use[:quantity]
            conversion_time = timezone.now()
            
            for cutting in cuttings_to_mark:
                cutting.is_destroyed = True
                cutting.destroy_reason = f"Zu Blühpflanze konvertiert (Charge: {batch.batch_number})"
                cutting.destroyed_at = conversion_time
                cutting.destroyed_by_id = member_id
                cutting.converted_to = batch.id  # Speichern der Ziel-Batch-ID
                cutting.converted_at = conversion_time
                cutting.converted_by_id = member_id
                cutting.save()
                
            return Response({
                "message": f"{quantity} Blühpflanzen wurden aus Stecklingen erstellt",
                "batch": BloomingCuttingBatchSerializer(batch).data
            })
        
        except Exception as e:
            return Response(
                {"error": f"Fehler bei der Konvertierung: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

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

class BloomingCuttingBatchViewSet(viewsets.ModelViewSet):
    queryset = BloomingCuttingBatch.objects.all().order_by('-created_at')
    serializer_class = BloomingCuttingBatchSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = BloomingCuttingBatch.objects.all().order_by('-created_at')
        
        # Filtern nach Zeitraum
        year = self.request.query_params.get('year', None)
        month = self.request.query_params.get('month', None)
        day = self.request.query_params.get('day', None)
        
        # Filter für aktive/vernichtete/geerntete Pflanzen
        has_active = self.request.query_params.get('has_active', None)
        has_destroyed = self.request.query_params.get('has_destroyed', None)
        has_harvested = self.request.query_params.get('has_harvested', None)
        
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
            queryset = queryset.filter(
                plants__is_destroyed=True,
                plants__destroy_reason__icontains="Vernichtet"
            ).distinct()
            
        # Filter für Batches mit zu Ernte überführten Pflanzen
        if has_harvested == 'true':
            queryset = queryset.filter(
                plants__is_destroyed=True,
                plants__destroy_reason__icontains="Zur Ernte konvertiert"
            ).distinct()
            
        # Berechne Anzahl für aktive, vernichtete und geerntete Pflanzen
        active_plants = 0
        destroyed_plants = 0
        harvested_plants = 0
        
        for batch in queryset:
            active_plants += batch.plants.filter(is_destroyed=False).count()
            
            # Zähle vernichtete Pflanzen (nicht zu Ernte überführt)
            destroyed_plants += batch.plants.filter(
                is_destroyed=True
            ).exclude(
                destroy_reason__icontains="Zur Ernte konvertiert"
            ).count()
            
            # Zähle zu Ernte überführte Pflanzen
            harvested_plants += batch.plants.filter(
                is_destroyed=True,
                destroy_reason__icontains="Zur Ernte konvertiert"
            ).count()
        
        self.counts = {
            'active_count': active_plants,
            'destroyed_count': destroyed_plants,
            'harvested_count': harvested_plants
        }
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data['counts'] = getattr(self, 'counts', {
            'active_count': 0,
            'destroyed_count': 0,
            'harvested_count': 0
        })
        return response
    
    @action(detail=True, methods=['get'])
    def plants(self, request, pk=None):
        batch = self.get_object()
        destroyed = request.query_params.get('destroyed', None)
        converted_to_harvest = request.query_params.get('converted_to_harvest', None)
        
        plants = batch.plants.all()
        
        if converted_to_harvest is not None:
            is_converted = converted_to_harvest.lower() == 'true'
            if is_converted:
                plants = plants.filter(
                    is_destroyed=True,
                    destroy_reason__icontains="Zur Ernte konvertiert"
                )
            else:
                plants = plants.exclude(
                    is_destroyed=True,
                    destroy_reason__icontains="Zur Ernte konvertiert"
                )
        elif destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            
            if is_destroyed:
                # Vernichtete Pflanzen anzeigen, aber keine zur Ernte überführten
                plants = plants.filter(is_destroyed=True).exclude(
                    destroy_reason__icontains="Zur Ernte konvertiert"
                )
            else:
                # Nur aktive Pflanzen anzeigen
                plants = plants.filter(is_destroyed=False)
        
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(plants, request)
        
        if page is not None:
            serializer = BloomingCuttingPlantSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = BloomingCuttingPlantSerializer(plants, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def destroy_plants(self, request, pk=None):
        batch = self.get_object()
        plant_ids = request.data.get('plant_ids', [])
        reason = request.data.get('reason', '')
        destroyed_by_id = request.data.get('destroyed_by_id', None)
        
        if not plant_ids:
            return Response(
                {"error": "Keine Pflanzen IDs angegeben"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not reason:
            return Response(
                {"error": "Ein Vernichtungsgrund ist erforderlich"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        destroy_data = {
            'is_destroyed': True,
            'destroy_reason': reason,
            'destroyed_at': timezone.now()
        }
        
        if destroyed_by_id:
            destroy_data['destroyed_by_id'] = destroyed_by_id
        
        BloomingCuttingPlant.objects.filter(id__in=plant_ids, batch=batch).update(**destroy_data)
        
        return Response({
            "message": f"{len(plant_ids)} Blühpflanzen wurden als vernichtet markiert"
        })
    
    @action(detail=False, methods=['get'])
    def counts(self, request):
        """
        Gibt die Anzahl der Batches und Pflanzen je nach Typ zurück.
        """
        count_type = self.request.query_params.get('type', None)
        
        if count_type == 'active':
            # Zählung für aktive Pflanzen
            batches_count = BloomingCuttingBatch.objects.filter(
                plants__is_destroyed=False
            ).distinct().count()
            plants_count = BloomingCuttingPlant.objects.filter(is_destroyed=False).count()
            
            return Response({
                "batches_count": batches_count,
                "plants_count": plants_count
            })
            
        elif count_type == 'destroyed':
            # Zählung für vernichtete Pflanzen (ohne zu Ernte überführte)
            destroyed_plants = BloomingCuttingPlant.objects.filter(
                is_destroyed=True
            ).exclude(
                destroy_reason__icontains="Zur Ernte konvertiert"
            )
            
            batches_count = BloomingCuttingBatch.objects.filter(
                plants__in=destroyed_plants
            ).distinct().count()
            plants_count = destroyed_plants.count()
            
            return Response({
                "batches_count": batches_count,
                "plants_count": plants_count
            })
            
        elif count_type == 'harvested':
            # Zählung für zu Ernte überführte Pflanzen
            harvested_plants = BloomingCuttingPlant.objects.filter(
                is_destroyed=True,
                destroy_reason__icontains="Zur Ernte konvertiert"
            )
            
            batches_count = BloomingCuttingBatch.objects.filter(
                plants__in=harvested_plants
            ).distinct().count()
            plants_count = harvested_plants.count()
            
            return Response({
                "batches_count": batches_count,
                "harvested_plants_count": plants_count
            })
        
        else:
            # Wenn kein Typ angegeben ist, gib alle Zahlen zurück
            active_plants = BloomingCuttingPlant.objects.filter(is_destroyed=False)
            
            destroyed_plants = BloomingCuttingPlant.objects.filter(
                is_destroyed=True
            ).exclude(
                destroy_reason__icontains="Zur Ernte konvertiert"
            )
            
            harvested_plants = BloomingCuttingPlant.objects.filter(
                is_destroyed=True,
                destroy_reason__icontains="Zur Ernte konvertiert"
            )
            
            active_batches = BloomingCuttingBatch.objects.filter(
                plants__in=active_plants
            ).distinct().count()
            
            destroyed_batches = BloomingCuttingBatch.objects.filter(
                plants__in=destroyed_plants
            ).distinct().count()
            
            harvested_batches = BloomingCuttingBatch.objects.filter(
                plants__in=harvested_plants
            ).distinct().count()
            
            return Response({
                "active_batches_count": active_batches,
                "active_plants_count": active_plants.count(),
                "destroyed_batches_count": destroyed_batches,
                "destroyed_plants_count": destroyed_plants.count(),
                "harvested_batches_count": harvested_batches,
                "harvested_plants_count": harvested_plants.count()
            })

    @action(detail=True, methods=['post'])
    def convert_to_harvest(self, request, pk=None):
        """
        Konvertiert ausgewählte Blühpflanzen aus Stecklingen zu einer Ernte.
        """
        batch = self.get_object()
        weight = request.data.get('weight', 0)
        notes = request.data.get('notes', '')
        member_id = request.data.get('member_id', None)
        room_id = request.data.get('room_id', None)
        plant_ids = request.data.get('plant_ids', [])
        
        # Validierung
        try:
            weight = float(weight)
            if weight <= 0:
                return Response(
                    {"error": "Das Gewicht muss größer als 0 sein"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (TypeError, ValueError):
            return Response(
                {"error": "Ungültiges Gewicht"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Erstelle Ernte-Batch
        harvest_kwargs = {
            'blooming_cutting_batch': batch,
            'weight': weight,
            'notes': notes
        }
        
        # Hinzufügen von optionalen Feldern
        if member_id:
            harvest_kwargs['member_id'] = member_id
        if room_id:
            harvest_kwargs['room_id'] = room_id
        
        harvest = HarvestBatch.objects.create(**harvest_kwargs)
        
        # Optional: Markiere die verwendeten Pflanzen als geerntet
        if plant_ids:
            # Überprüfe, ob die Pflanzen zu diesem Batch gehören
            plants = BloomingCuttingPlant.objects.filter(id__in=plant_ids, batch=batch)
            
            for plant in plants:
                plant.is_destroyed = True
                plant.destroy_reason = f"Zur Ernte konvertiert (Charge: {harvest.batch_number})"
                plant.destroyed_at = timezone.now()
                if member_id:
                    plant.destroyed_by_id = member_id
                plant.save()
        
        return Response({
            "message": f"Ernte mit {weight}g wurde erstellt",
            "harvest": HarvestBatchSerializer(harvest).data
        })

class HarvestBatchViewSet(viewsets.ModelViewSet):
    queryset = HarvestBatch.objects.all().order_by('-created_at')
    serializer_class = HarvestBatchSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = HarvestBatch.objects.all().order_by('-created_at')
        
        # Filtern nach Zeitraum
        year = self.request.query_params.get('year', None)
        month = self.request.query_params.get('month', None)
        day = self.request.query_params.get('day', None)
        
        # Filtern nach Status (active, dried, destroyed)
        status = self.request.query_params.get('status', None)
        
        # Der alte destroyed-Parameter wird weiterhin unterstützt, um Abwärtskompatibilität zu gewährleisten
        destroyed = self.request.query_params.get('destroyed', None)
        
        if year:
            queryset = queryset.filter(created_at__year=year)
        if month:
            queryset = queryset.filter(created_at__month=month)
        if day:
            queryset = queryset.filter(created_at__day=day)
        
        # Status-basierte Filterung
        if status:
            if status == 'active':
                # Aktive Ernten: weder vernichtet noch zu Trocknung überführt
                queryset = queryset.filter(is_destroyed=False, converted_to_drying=False)
            elif status == 'dried':
                # Zu Trocknung überführte Ernten
                queryset = queryset.filter(converted_to_drying=True)
            elif status == 'destroyed':
                # Vernichtete Ernten
                queryset = queryset.filter(is_destroyed=True)
        # Fallback für Legacy-Support des destroyed-Parameters
        elif destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            queryset = queryset.filter(is_destroyed=is_destroyed)
            
        # Berechne Anzahl und Gewicht für alle Status-Typen
        active_harvests = HarvestBatch.objects.filter(is_destroyed=False, converted_to_drying=False)
        dried_harvests = HarvestBatch.objects.filter(converted_to_drying=True)
        destroyed_harvests = HarvestBatch.objects.filter(is_destroyed=True)
        
        active_count = active_harvests.count()
        dried_count = dried_harvests.count()
        destroyed_count = destroyed_harvests.count()
        
        total_active_weight = active_harvests.aggregate(total=models.Sum('weight'))['total'] or 0
        total_dried_weight = dried_harvests.aggregate(total=models.Sum('weight'))['total'] or 0
        total_destroyed_weight = destroyed_harvests.aggregate(total=models.Sum('weight'))['total'] or 0
        
        self.counts = {
            'active_count': active_count,
            'dried_count': dried_count,
            'destroyed_count': destroyed_count,
            'total_active_weight': total_active_weight,
            'total_dried_weight': total_dried_weight,
            'total_destroyed_weight': total_destroyed_weight
        }
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data['counts'] = getattr(self, 'counts', {
            'active_count': 0,
            'dried_count': 0,
            'destroyed_count': 0,
            'total_active_weight': 0,
            'total_dried_weight': 0,
            'total_destroyed_weight': 0
        })
        return response
    
    @action(detail=False, methods=['get'])
    def counts(self, request):
        # Filtere nach verschiedenen Status
        active_harvests = HarvestBatch.objects.filter(is_destroyed=False, converted_to_drying=False)
        dried_harvests = HarvestBatch.objects.filter(converted_to_drying=True)
        destroyed_harvests = HarvestBatch.objects.filter(is_destroyed=True)
        
        # Zähle Datensätze
        active_count = active_harvests.count()
        dried_count = dried_harvests.count()
        destroyed_count = destroyed_harvests.count()
        
        # Berechne Gesamtgewichte
        total_active_weight = active_harvests.aggregate(total=models.Sum('weight'))['total'] or 0
        total_dried_weight = dried_harvests.aggregate(total=models.Sum('weight'))['total'] or 0
        total_destroyed_weight = destroyed_harvests.aggregate(total=models.Sum('weight'))['total'] or 0
        
        return Response({
            'active_count': active_count,
            'dried_count': dried_count,
            'destroyed_count': destroyed_count,
            'total_active_weight': float(total_active_weight),
            'total_dried_weight': float(total_dried_weight),
            'total_destroyed_weight': float(total_destroyed_weight)
        })
    
    @action(detail=True, methods=['post'])
    def destroy_harvest(self, request, pk=None):
        harvest = self.get_object()
        reason = request.data.get('reason', '')
        destroyed_by_id = request.data.get('destroyed_by_id', None)
        
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
        
        harvest.is_destroyed = True
        harvest.destroy_reason = reason
        harvest.destroyed_at = timezone.now()
        harvest.destroyed_by_id = destroyed_by_id
        harvest.save()
        
        return Response({
            "message": f"Ernte {harvest.batch_number} wurde vernichtet"
        })
    
    @action(detail=True, methods=['post'])
    def convert_to_drying(self, request, pk=None):
        """
        Konvertiert eine Ernte zu einer Trocknung.
        """
        harvest = self.get_object()
        
        # Prüfen, ob die Ernte bereits konvertiert wurde
        if harvest.converted_to_drying:
            return Response(
                {"error": "Diese Ernte wurde bereits zu einer Trocknung konvertiert"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Prüfen, ob die Ernte bereits vernichtet wurde
        if harvest.is_destroyed:
            return Response(
                {"error": "Vernichtete Ernten können nicht zu einer Trocknung konvertiert werden"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        final_weight = request.data.get('final_weight', 0)
        notes = request.data.get('notes', '')
        member_id = request.data.get('member_id', None)
        room_id = request.data.get('room_id', None)
        
        # Validierung
        try:
            final_weight = float(final_weight)
            if final_weight <= 0:
                return Response(
                    {"error": "Das Trockengewicht muss größer als 0 sein"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Prüfen, ob das Trockengewicht kleiner als das Erntegewicht ist
            if final_weight >= float(harvest.weight):
                return Response(
                    {"error": "Das Trockengewicht muss kleiner als das Erntegewicht sein"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (TypeError, ValueError):
            return Response(
                {"error": "Ungültiges Gewicht"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Erstelle Trocknungs-Batch
        drying_kwargs = {
            'harvest_batch': harvest,
            'initial_weight': harvest.weight,
            'final_weight': final_weight,
            'notes': notes
        }
        
        # Hinzufügen von optionalen Feldern
        if member_id:
            drying_kwargs['member_id'] = member_id
        if room_id:
            drying_kwargs['room_id'] = room_id
        
        drying = DryingBatch.objects.create(**drying_kwargs)
        
        # Markiere die Ernte als zu Trocknung überführt
        harvest.converted_to_drying = True
        harvest.converted_to_drying_at = timezone.now()
        harvest.drying_batch = drying  # Verknüpfe mit dem erstellten Trocknungsbatch
        harvest.save()
        
        return Response({
            "message": f"Trocknung mit {final_weight}g Trockengewicht wurde erstellt",
            "drying": DryingBatchSerializer(drying).data
        })
    
class DryingBatchViewSet(viewsets.ModelViewSet):
    queryset = DryingBatch.objects.all().order_by('-created_at')
    serializer_class = DryingBatchSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = DryingBatch.objects.all().order_by('-created_at')
        
        # Filtern nach Zeitraum
        year = self.request.query_params.get('year', None)
        month = self.request.query_params.get('month', None)
        day = self.request.query_params.get('day', None)
        
        # Filter nach zerstört/nicht zerstört
        destroyed = self.request.query_params.get('destroyed', None)
        
        if year:
            queryset = queryset.filter(created_at__year=year)
        if month:
            queryset = queryset.filter(created_at__month=month)
        if day:
            queryset = queryset.filter(created_at__day=day)
        
        if destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            queryset = queryset.filter(is_destroyed=is_destroyed)
            
        # Berechne Anzahl für aktive und vernichtete Trocknungen
        active_count = queryset.filter(is_destroyed=False).count()
        destroyed_count = queryset.filter(is_destroyed=True).count()
        
        # Berechne Gesamtgewicht für aktive und vernichtete Trocknungen
        total_active_initial_weight = queryset.filter(is_destroyed=False).aggregate(total=models.Sum('initial_weight'))['total'] or 0
        total_active_final_weight = queryset.filter(is_destroyed=False).aggregate(total=models.Sum('final_weight'))['total'] or 0
        total_destroyed_initial_weight = queryset.filter(is_destroyed=True).aggregate(total=models.Sum('initial_weight'))['total'] or 0
        total_destroyed_final_weight = queryset.filter(is_destroyed=True).aggregate(total=models.Sum('final_weight'))['total'] or 0
        
        self.counts = {
            'active_count': active_count,
            'destroyed_count': destroyed_count,
            'total_active_initial_weight': total_active_initial_weight,
            'total_active_final_weight': total_active_final_weight,
            'total_destroyed_initial_weight': total_destroyed_initial_weight,
            'total_destroyed_final_weight': total_destroyed_final_weight
        }
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data['counts'] = getattr(self, 'counts', {
            'active_count': 0,
            'destroyed_count': 0,
            'total_active_initial_weight': 0,
            'total_active_final_weight': 0,
            'total_destroyed_initial_weight': 0,
            'total_destroyed_final_weight': 0
        })
        return response
    
    @action(detail=False, methods=['get'])
    def counts(self, request):
        active_batches = DryingBatch.objects.filter(is_destroyed=False)
        destroyed_batches = DryingBatch.objects.filter(is_destroyed=True)
        
        active_count = active_batches.count()
        destroyed_count = destroyed_batches.count()
        
        total_active_initial_weight = active_batches.aggregate(total=models.Sum('initial_weight'))['total'] or 0
        total_active_final_weight = active_batches.aggregate(total=models.Sum('final_weight'))['total'] or 0
        total_destroyed_initial_weight = destroyed_batches.aggregate(total=models.Sum('initial_weight'))['total'] or 0
        total_destroyed_final_weight = destroyed_batches.aggregate(total=models.Sum('final_weight'))['total'] or 0
        
        return Response({
            'active_count': active_count,
            'destroyed_count': destroyed_count,
            'total_active_initial_weight': float(total_active_initial_weight),
            'total_active_final_weight': float(total_active_final_weight),
            'total_destroyed_initial_weight': float(total_destroyed_initial_weight),
            'total_destroyed_final_weight': float(total_destroyed_final_weight)
        })
    
    @action(detail=True, methods=['post'])
    def destroy_drying(self, request, pk=None):
        drying_batch = self.get_object()
        reason = request.data.get('reason', '')
        destroyed_by_id = request.data.get('destroyed_by_id', None)
        
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
        
        drying_batch.is_destroyed = True
        drying_batch.destroy_reason = reason
        drying_batch.destroyed_at = timezone.now()
        drying_batch.destroyed_by_id = destroyed_by_id
        drying_batch.save()
        
        return Response({
            "message": f"Trocknung {drying_batch.batch_number} wurde vernichtet"
        })
    
    @action(detail=True, methods=['post'])
    def convert_to_processing(self, request, pk=None):
        """
        Konvertiert eine Trocknung zu einer Verarbeitung (Marihuana oder Haschisch).
        """
        drying = self.get_object()
        product_type = request.data.get('product_type', '')
        output_weight = request.data.get('output_weight', 0)
        notes = request.data.get('notes', '')
        member_id = request.data.get('member_id', None)
        room_id = request.data.get('room_id', None)
        
        # Validierung
        if product_type not in ['marijuana', 'hashish']:
            return Response(
                {"error": "Bitte wählen Sie einen gültigen Produkttyp (marijuana, hashish)"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            output_weight = float(output_weight)
            if output_weight <= 0:
                return Response(
                    {"error": "Das Produktgewicht muss größer als 0 sein"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Prüfen, ob das Produktgewicht kleiner als das Trockengewicht ist
            if output_weight > float(drying.final_weight):
                return Response(
                    {"error": "Das Produktgewicht kann nicht größer als das Trockengewicht sein"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (TypeError, ValueError):
            return Response(
                {"error": "Ungültiges Gewicht"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Erstelle Verarbeitungs-Batch
        processing_kwargs = {
            'drying_batch': drying,
            'product_type': product_type,
            'input_weight': drying.final_weight,
            'output_weight': output_weight,
            'notes': notes
        }
        
        # Hinzufügen von optionalen Feldern
        if member_id:
            processing_kwargs['member_id'] = member_id
        if room_id:
            processing_kwargs['room_id'] = room_id
        
        processing = ProcessingBatch.objects.create(**processing_kwargs)
        
        # Optional: Markiere die Trocknung als zu Verarbeitung überführt
        drying.converted_to_processing = True
        drying.converted_to_processing_at = timezone.now()
        drying.processing_batch = processing
        drying.save()
        
        product_name = "Marihuana" if product_type == "marijuana" else "Haschisch"
        
        return Response({
            "message": f"{product_name} mit {output_weight}g wurde erstellt",
            "processing": ProcessingBatchSerializer(processing).data
        })
    
class ProcessingBatchViewSet(viewsets.ModelViewSet):
    queryset = ProcessingBatch.objects.all().order_by('-created_at')
    serializer_class = ProcessingBatchSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = ProcessingBatch.objects.all().order_by('-created_at')
        
        # Filtern nach Zeitraum
        year = self.request.query_params.get('year', None)
        month = self.request.query_params.get('month', None)
        day = self.request.query_params.get('day', None)
        
        # Filter nach Produkt-Typ
        product_type = self.request.query_params.get('product_type', None)
        
        # Filter nach zerstört/nicht zerstört
        destroyed = self.request.query_params.get('destroyed', None)
        
        if year:
            queryset = queryset.filter(created_at__year=year)
        if month:
            queryset = queryset.filter(created_at__month=month)
        if day:
            queryset = queryset.filter(created_at__day=day)
        
        if product_type:
            queryset = queryset.filter(product_type=product_type)
        
        if destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            queryset = queryset.filter(is_destroyed=is_destroyed)
            
        # Berechne Anzahl für aktive und vernichtete Verarbeitungen
        active_count = queryset.filter(is_destroyed=False).count()
        destroyed_count = queryset.filter(is_destroyed=True).count()
        
        # Berechne Gesamtgewicht für aktive und vernichtete Verarbeitungen
        total_active_input_weight = queryset.filter(is_destroyed=False).aggregate(total=models.Sum('input_weight'))['total'] or 0
        total_active_output_weight = queryset.filter(is_destroyed=False).aggregate(total=models.Sum('output_weight'))['total'] or 0
        total_destroyed_input_weight = queryset.filter(is_destroyed=True).aggregate(total=models.Sum('input_weight'))['total'] or 0
        total_destroyed_output_weight = queryset.filter(is_destroyed=True).aggregate(total=models.Sum('output_weight'))['total'] or 0
        
        # Berechne Anzahl und Gewicht nach Produkt-Typ
        marijuana_count = queryset.filter(is_destroyed=False, product_type='marijuana').count()
        hashish_count = queryset.filter(is_destroyed=False, product_type='hashish').count()
        marijuana_weight = queryset.filter(is_destroyed=False, product_type='marijuana').aggregate(total=models.Sum('output_weight'))['total'] or 0
        hashish_weight = queryset.filter(is_destroyed=False, product_type='hashish').aggregate(total=models.Sum('output_weight'))['total'] or 0
        
        self.counts = {
            'active_count': active_count,
            'destroyed_count': destroyed_count,
            'total_active_input_weight': total_active_input_weight,
            'total_active_output_weight': total_active_output_weight,
            'total_destroyed_input_weight': total_destroyed_input_weight,
            'total_destroyed_output_weight': total_destroyed_output_weight,
            'marijuana_count': marijuana_count,
            'hashish_count': hashish_count,
            'marijuana_weight': marijuana_weight,
            'hashish_weight': hashish_weight
        }
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data['counts'] = getattr(self, 'counts', {
            'active_count': 0,
            'destroyed_count': 0,
            'total_active_input_weight': 0,
            'total_active_output_weight': 0,
            'total_destroyed_input_weight': 0,
            'total_destroyed_output_weight': 0,
            'marijuana_count': 0,
            'hashish_count': 0,
            'marijuana_weight': 0,
            'hashish_weight': 0
        })
        return response
    
    @action(detail=False, methods=['get'])
    def counts(self, request):
        active_batches = ProcessingBatch.objects.filter(is_destroyed=False)
        destroyed_batches = ProcessingBatch.objects.filter(is_destroyed=True)
        
        active_count = active_batches.count()
        destroyed_count = destroyed_batches.count()
        
        total_active_input_weight = active_batches.aggregate(total=models.Sum('input_weight'))['total'] or 0
        total_active_output_weight = active_batches.aggregate(total=models.Sum('output_weight'))['total'] or 0
        total_destroyed_input_weight = destroyed_batches.aggregate(total=models.Sum('input_weight'))['total'] or 0
        total_destroyed_output_weight = destroyed_batches.aggregate(total=models.Sum('output_weight'))['total'] or 0
        
        marijuana_count = active_batches.filter(product_type='marijuana').count()
        hashish_count = active_batches.filter(product_type='hashish').count()
        marijuana_weight = active_batches.filter(product_type='marijuana').aggregate(total=models.Sum('output_weight'))['total'] or 0
        hashish_weight = active_batches.filter(product_type='hashish').aggregate(total=models.Sum('output_weight'))['total'] or 0
        
        return Response({
            'active_count': active_count,
            'destroyed_count': destroyed_count,
            'total_active_input_weight': float(total_active_input_weight),
            'total_active_output_weight': float(total_active_output_weight),
            'total_destroyed_input_weight': float(total_destroyed_input_weight),
            'total_destroyed_output_weight': float(total_destroyed_output_weight),
            'marijuana_count': marijuana_count,
            'hashish_count': hashish_count,
            'marijuana_weight': float(marijuana_weight),
            'hashish_weight': float(hashish_weight)
        })
    
    @action(detail=True, methods=['post'])
    def destroy_processing(self, request, pk=None):
        processing_batch = self.get_object()
        reason = request.data.get('reason', '')
        destroyed_by_id = request.data.get('destroyed_by_id', None)
        
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
        
        processing_batch.is_destroyed = True
        processing_batch.destroy_reason = reason
        processing_batch.destroyed_at = timezone.now()
        processing_batch.destroyed_by_id = destroyed_by_id
        processing_batch.save()
        
        return Response({
            "message": f"Verarbeitung {processing_batch.batch_number} wurde vernichtet"
        })
    
    @action(detail=True, methods=['post'])
    def convert_to_labtesting(self, request, pk=None):
        """
        Konvertiert eine Verarbeitung zu einer Laborkontrolle.
        """
        processing = self.get_object()
        
        # Prüfen, ob die Verarbeitung bereits vernichtet wurde
        if processing.is_destroyed:
            return Response(
                {"error": "Vernichtete Verarbeitungen können nicht zu Laborkontrollen konvertiert werden"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        input_weight = request.data.get('input_weight', processing.output_weight)
        sample_weight = request.data.get('sample_weight', 0)
        notes = request.data.get('notes', '')
        member_id = request.data.get('member_id', None)
        room_id = request.data.get('room_id', None)
        
        # Validierung
        try:
            input_weight = float(input_weight)
            if input_weight <= 0:
                return Response(
                    {"error": "Das Inputgewicht muss größer als 0 sein"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Prüfen, ob das Inputgewicht kleiner oder gleich dem Output-Gewicht der Verarbeitung ist
            if input_weight > float(processing.output_weight):
                return Response(
                    {"error": f"Das Inputgewicht kann nicht größer als das Output-Gewicht der Verarbeitung sein ({processing.output_weight}g)"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (TypeError, ValueError):
            return Response(
                {"error": "Ungültiges Inputgewicht"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            sample_weight = float(sample_weight)
            if sample_weight <= 0:
                return Response(
                    {"error": "Das Probengewicht muss größer als 0 sein"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Prüfen, ob das Probengewicht kleiner als das Inputgewicht ist
            if sample_weight >= input_weight:
                return Response(
                    {"error": "Das Probengewicht muss kleiner als das Inputgewicht sein"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (TypeError, ValueError):
            return Response(
                {"error": "Ungültiges Probengewicht"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Erstelle Laborkontroll-Batch
        lab_testing_kwargs = {
            'processing_batch': processing,
            'input_weight': input_weight,
            'sample_weight': sample_weight,
            'notes': notes
        }
        
        # Hinzufügen von optionalen Feldern
        if member_id:
            lab_testing_kwargs['member_id'] = member_id
        if room_id:
            lab_testing_kwargs['room_id'] = room_id
        
        lab_testing = LabTestingBatch.objects.create(**lab_testing_kwargs)
        
        # Serialisierer mit angepasstem Kontext
        serializer = LabTestingBatchSerializer(lab_testing)
        
        return Response({
            "message": f"Laborkontrolle mit {input_weight}g und {sample_weight}g Probengewicht wurde erstellt",
            "lab_testing": serializer.data
        })
    
class LabTestingBatchViewSet(viewsets.ModelViewSet):
    queryset = LabTestingBatch.objects.all().order_by('-created_at')
    serializer_class = LabTestingBatchSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = LabTestingBatch.objects.all().order_by('-created_at')
        
        # Filtern nach Zeitraum
        year = self.request.query_params.get('year', None)
        month = self.request.query_params.get('month', None)
        day = self.request.query_params.get('day', None)
        
        # Filter nach Produkt-Typ
        product_type = self.request.query_params.get('product_type', None)
        
        # Filter nach Status
        status = self.request.query_params.get('status', None)
        
        # Filter nach zerstört/nicht zerstört
        destroyed = self.request.query_params.get('destroyed', None)
        
        # Filter nach zu Verpackung konvertiert
        converted = self.request.query_params.get('converted', None)
        
        if year:
            queryset = queryset.filter(created_at__year=year)
        if month:
            queryset = queryset.filter(created_at__month=month)
        if day:
            queryset = queryset.filter(created_at__day=day)
        
        if product_type:
            queryset = queryset.filter(processing_batch__product_type=product_type)
        
        if status:
            queryset = queryset.filter(status=status)
        
        if destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            queryset = queryset.filter(is_destroyed=is_destroyed)
            
        if converted is not None:
            is_converted = converted.lower() == 'true'
            queryset = queryset.filter(converted_to_packaging=is_converted)
            
        # Berechne Anzahl für aktive und freigegebe Labortests
        pending_count = queryset.filter(is_destroyed=False, status='pending').count()
        passed_count = queryset.filter(is_destroyed=False, status='passed').count()
        failed_count = queryset.filter(is_destroyed=False, status='failed').count()
        destroyed_count = queryset.filter(is_destroyed=True).count()
        
        # Berechne Gesamtgewicht
        total_pending_weight = queryset.filter(is_destroyed=False, status='pending').aggregate(total=models.Sum('input_weight'))['total'] or 0
        total_passed_weight = queryset.filter(is_destroyed=False, status='passed').aggregate(total=models.Sum('input_weight'))['total'] or 0
        total_failed_weight = queryset.filter(is_destroyed=False, status='failed').aggregate(total=models.Sum('input_weight'))['total'] or 0
        total_destroyed_weight = queryset.filter(is_destroyed=True).aggregate(total=models.Sum('input_weight'))['total'] or 0
        
        # Berechne Anzahl und Gewicht nach Produkt-Typ
        marijuana_count = queryset.filter(is_destroyed=False, processing_batch__product_type='marijuana').count()
        hashish_count = queryset.filter(is_destroyed=False, processing_batch__product_type='hashish').count()
        marijuana_weight = queryset.filter(is_destroyed=False, processing_batch__product_type='marijuana').aggregate(total=models.Sum('input_weight'))['total'] or 0
        hashish_weight = queryset.filter(is_destroyed=False, processing_batch__product_type='hashish').aggregate(total=models.Sum('input_weight'))['total'] or 0
        
        self.counts = {
            'pending_count': pending_count,
            'passed_count': passed_count,
            'failed_count': failed_count,
            'destroyed_count': destroyed_count,
            'total_pending_weight': total_pending_weight,
            'total_passed_weight': total_passed_weight,
            'total_failed_weight': total_failed_weight,
            'total_destroyed_weight': total_destroyed_weight,
            'marijuana_count': marijuana_count,
            'hashish_count': hashish_count,
            'marijuana_weight': marijuana_weight,
            'hashish_weight': hashish_weight
        }
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data['counts'] = getattr(self, 'counts', {
            'pending_count': 0,
            'passed_count': 0,
            'failed_count': 0,
            'destroyed_count': 0,
            'total_pending_weight': 0,
            'total_passed_weight': 0,
            'total_failed_weight': 0,
            'total_destroyed_weight': 0,
            'marijuana_count': 0,
            'hashish_count': 0,
            'marijuana_weight': 0,
            'hashish_weight': 0
        })
        return response
    
    @action(detail=False, methods=['get'])
    def counts(self, request):
        pending_batches = LabTestingBatch.objects.filter(is_destroyed=False, status='pending')
        passed_batches = LabTestingBatch.objects.filter(is_destroyed=False, status='passed')
        failed_batches = LabTestingBatch.objects.filter(is_destroyed=False, status='failed')
        destroyed_batches = LabTestingBatch.objects.filter(is_destroyed=True)
        
        pending_count = pending_batches.count()
        passed_count = passed_batches.count()
        failed_count = failed_batches.count()
        destroyed_count = destroyed_batches.count()
        
        total_pending_weight = pending_batches.aggregate(total=models.Sum('input_weight'))['total'] or 0
        total_passed_weight = passed_batches.aggregate(total=models.Sum('input_weight'))['total'] or 0
        total_failed_weight = failed_batches.aggregate(total=models.Sum('input_weight'))['total'] or 0
        total_destroyed_weight = destroyed_batches.aggregate(total=models.Sum('input_weight'))['total'] or 0
        
        # Nach Produkttyp
        marijuana_batches = LabTestingBatch.objects.filter(is_destroyed=False, processing_batch__product_type='marijuana')
        hashish_batches = LabTestingBatch.objects.filter(is_destroyed=False, processing_batch__product_type='hashish')
        
        marijuana_count = marijuana_batches.count()
        hashish_count = hashish_batches.count()
        
        marijuana_weight = marijuana_batches.aggregate(total=models.Sum('input_weight'))['total'] or 0
        hashish_weight = hashish_batches.aggregate(total=models.Sum('input_weight'))['total'] or 0
        
        return Response({
            'pending_count': pending_count,
            'passed_count': passed_count,
            'failed_count': failed_count,
            'destroyed_count': destroyed_count,
            'total_pending_weight': float(total_pending_weight),
            'total_passed_weight': float(total_passed_weight),
            'total_failed_weight': float(total_failed_weight),
            'total_destroyed_weight': float(total_destroyed_weight),
            'marijuana_count': marijuana_count,
            'hashish_count': hashish_count,
            'marijuana_weight': float(marijuana_weight),
            'hashish_weight': float(hashish_weight)
        })
    
    @action(detail=True, methods=['post'])
    def destroy_labtesting(self, request, pk=None):
        labtesting_batch = self.get_object()
        reason = request.data.get('reason', '')
        destroyed_by_id = request.data.get('destroyed_by_id', None)
        
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
        
        labtesting_batch.is_destroyed = True
        labtesting_batch.destroy_reason = reason
        labtesting_batch.destroyed_at = timezone.now()
        labtesting_batch.destroyed_by_id = destroyed_by_id
        labtesting_batch.save()
        
        return Response({
            "message": f"Laborkontrolle {labtesting_batch.batch_number} wurde vernichtet"
        })
    
    @action(detail=True, methods=['post'])
    def update_lab_results(self, request, pk=None):
        """
        Aktualisiert die Laborergebnisse für einen Labortest und
        erstellt bei Bedarf einen separaten Vernichtungseintrag für die Probe.
        """
        lab_batch = self.get_object()
        status_value = request.data.get('status', None)
        thc_content = request.data.get('thc_content', None)
        cbd_content = request.data.get('cbd_content', None)
        lab_notes = request.data.get('lab_notes', '')
        auto_destroy_sample = request.data.get('auto_destroy_sample', True)
        member_id = request.data.get('member_id', lab_batch.member_id)
        
        # Validierung
        if status_value not in ['pending', 'passed', 'failed']:
            return Response(
                {"error": "Ungültiger Status. Erlaubte Werte: pending, passed, failed"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            if thc_content is not None:
                thc_content = float(thc_content)
                if thc_content < 0 or thc_content > 100:
                    return Response(
                        {"error": "THC-Gehalt muss zwischen 0 und 100 Prozent liegen"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        except (TypeError, ValueError):
            return Response(
                {"error": "Ungültiger THC-Gehalt"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            if cbd_content is not None:
                cbd_content = float(cbd_content)
                if cbd_content < 0 or cbd_content > 100:
                    return Response(
                        {"error": "CBD-Gehalt muss zwischen 0 und 100 Prozent liegen"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        except (TypeError, ValueError):
            return Response(
                {"error": "Ungültiger CBD-Gehalt"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Überprüfen, ob der Status von pending auf passed/failed geändert wird
        old_status = lab_batch.status
        status_changed_to_final = old_status == 'pending' and status_value in ['passed', 'failed']
        
        # Aktualisiere die Laborergebnisse
        lab_batch.status = status_value
        if thc_content is not None:
            lab_batch.thc_content = thc_content
        if cbd_content is not None:
            lab_batch.cbd_content = cbd_content
        if lab_notes:
            lab_batch.lab_notes = lab_notes
        
        # Automatische Probenvernichtung nur bei Statuswechsel von pending zu passed/failed
        if status_changed_to_final and auto_destroy_sample and lab_batch.sample_weight > 0:
            try:
                # Erstelle einen eigenen LabTestingBatch für die verbrauchte Probe
                sample_batch = LabTestingBatch.objects.create(
                    processing_batch=lab_batch.processing_batch,
                    input_weight=lab_batch.sample_weight,  # Tatsächliche Probengröße
                    sample_weight=0,  # Die Probe wird nicht weiter beprobt
                    status=status_value,  # Gleicher Status wie der Haupttest für Konsistenz
                    thc_content=thc_content,
                    cbd_content=cbd_content,
                    lab_notes=f"Laboranalyse-Ergebnisse von {lab_batch.batch_number}",
                    member_id=member_id,
                    room_id=lab_batch.room_id,
                    notes=f"Laborprobe aus {lab_batch.batch_number}. Probe wurde zur Analyse verbraucht.",
                    is_destroyed=True,
                    destroy_reason=f"Laborprobe verbraucht durch Analyse (Original-Test: {lab_batch.batch_number})",
                    destroyed_at=timezone.now(),
                    destroyed_by_id=member_id
                )
                
                # Ergänze die Notizen des ursprünglichen Batches mit Hinweis auf Probenvernichtung
                additional_note = f"\nLaborprobe von {lab_batch.sample_weight}g wurde nach Analyse als vernichtet dokumentiert (ID: {sample_batch.id})."
                if lab_batch.notes:
                    lab_batch.notes += additional_note
                else:
                    lab_batch.notes = additional_note.strip()
                
            except Exception as e:
                # Fehler in den Notizen vermerken
                if lab_batch.notes:
                    lab_batch.notes += f"\nFehler bei der Dokumentation der Probenvernichtung: {str(e)}"
                else:
                    lab_batch.notes = f"Fehler bei der Dokumentation der Probenvernichtung: {str(e)}"
        
        # Änderungen speichern
        lab_batch.save()
        
        # Erfolgreiche Antwort
        message = f"Laborergebnisse für {lab_batch.batch_number} wurden aktualisiert"
        if status_changed_to_final and auto_destroy_sample and lab_batch.sample_weight > 0:
            message += f". Probe von {lab_batch.sample_weight}g wurde als vernichtet dokumentiert."
        
        return Response({
            "message": message,
            "batch": LabTestingBatchSerializer(lab_batch).data
        })
    
    @action(detail=True, methods=['post'])
    def convert_to_packaging(self, request, pk=None):
        """
        🆕 ERWEITERT: Konvertiert eine freigegebene Laborkontrolle zu mehreren Verpackungen MIT PREISUNTERSTÜTZUNG.
        Unterstützt sowohl Einzelverpackungen als auch mehrere Verpackungslinien.
        """
        lab_batch = self.get_object()
        
        # Prüfungen für Laborkontrolle bleiben unverändert
        if lab_batch.converted_to_packaging:
            return Response(
                {"error": "Diese Laborkontrolle wurde bereits zu Verpackung konvertiert"},
                status=status.HTTP_400_BAD_REQUEST
            )
                
        if lab_batch.is_destroyed:
            return Response(
                {"error": "Vernichtete Laborkontrollen können nicht zu Verpackung konvertiert werden"},
                status=status.HTTP_400_BAD_REQUEST
            )
                
        if lab_batch.status != 'passed':
            return Response(
                {"error": "Nur freigegebene Laborkontrollen können zu Verpackung konvertiert werden"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Gemeinsame Felder für alle Verpackungen
        member_id = request.data.get('member_id')
        room_id = request.data.get('room_id')
        notes = request.data.get('notes', '')
        remaining_weight = float(request.data.get('remaining_weight', 0) or 0)
        auto_destroy_remainder = request.data.get('auto_destroy_remainder', False)
        
        # 🆕 PREIS AUS REQUEST LESEN:
        price_per_gram = request.data.get('price_per_gram')
        
        # 🆕 PREIS-VALIDIERUNG:
        if price_per_gram is not None:
            try:
                price_per_gram = float(price_per_gram)
                if price_per_gram < 0:
                    return Response(
                        {"error": "Der Preis pro Gramm kann nicht negativ sein"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (ValueError, TypeError):
                return Response(
                    {"error": "Ungültiger Preis pro Gramm. Bitte geben Sie eine gültige Zahl ein."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Überprüfen, ob es sich um eine Multi-Packaging-Anfrage handelt
        if 'packagings' in request.data and isinstance(request.data['packagings'], list):
            # Multi-Packaging-Verarbeitung
            packagings = request.data['packagings']
            created_packagings = []
            total_weight_used = 0
            
            # Einzelne Verpackungen validieren und erstellen
            for idx, packaging_data in enumerate(packagings):
                try:
                    unit_count = int(packaging_data.get('unit_count', 0))
                    unit_weight = float(packaging_data.get('unit_weight', 0))
                    total_line_weight = float(packaging_data.get('total_weight', 0))
                    
                    # 🆕 INDIVIDUELLER PREIS PRO LINIE (OPTIONAL):
                    line_price_per_gram = packaging_data.get('price_per_gram')
                    if line_price_per_gram is not None:
                        try:
                            line_price_per_gram = float(line_price_per_gram)
                            if line_price_per_gram < 0:
                                return Response(
                                    {"error": f"Der Preis pro Gramm in Zeile {idx+1} kann nicht negativ sein"},
                                    status=status.HTTP_400_BAD_REQUEST
                                )
                        except (ValueError, TypeError):
                            return Response(
                                {"error": f"Ungültiger Preis pro Gramm in Zeile {idx+1}"},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                    else:
                        # Fallback auf globalen Preis
                        line_price_per_gram = price_per_gram
                    
                    # Validierung für diese Verpackungslinie
                    if unit_count <= 0:
                        return Response(
                            {"error": f"Die Anzahl der Einheiten in Zeile {idx+1} muss größer als 0 sein"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                        
                    if unit_weight < 5.0:
                        return Response(
                            {"error": f"Das Gewicht pro Einheit in Zeile {idx+1} muss mindestens 5g betragen"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Prüfen, ob Gesamtgewicht korrekt berechnet wurde
                    calculated_weight = unit_count * unit_weight
                    if abs(calculated_weight - total_line_weight) > 0.1:
                        return Response(
                            {"error": f"Inkonsistentes Gesamtgewicht in Zeile {idx+1}: {total_line_weight}g ≠ {unit_count} × {unit_weight}g"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # 🆕 KWARGS FÜR VERPACKUNG MIT PREIS VORBEREITEN:
                    packaging_kwargs = {
                        'lab_testing_batch': lab_batch,
                        'total_weight': total_line_weight,
                        'unit_count': unit_count,
                        'unit_weight': unit_weight,
                        'member_id': member_id,
                        'room_id': room_id,
                        'notes': f"{notes} - Zeile {idx+1} von {len(packagings)}: {unit_count}× {unit_weight}g"
                    }
                    
                    # 🆕 PREIS HINZUFÜGEN, FALLS VORHANDEN:
                    if line_price_per_gram is not None:
                        packaging_kwargs['price_per_gram'] = line_price_per_gram
                    
                    # Erstelle die Verpackung für diese Linie
                    packaging = PackagingBatch.objects.create(**packaging_kwargs)
                    
                    created_packagings.append(packaging)
                    total_weight_used += total_line_weight
                    
                except (ValueError, TypeError) as e:
                    return Response(
                        {"error": f"Fehler in Zeile {idx+1}: {str(e)}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Prüfen, ob das verarbeitete Gesamtgewicht gültig ist
            available_weight = lab_batch.remaining_weight
            if total_weight_used > available_weight:
                # Löschen der bereits erstellten Verpackungen, um Dateninkonsistenzen zu vermeiden
                for packaging in created_packagings:
                    packaging.delete()
                    
                return Response(
                    {"error": f"Gesamtgewicht aller Verpackungslinien ({total_weight_used}g) überschreitet das verfügbare Gewicht ({available_weight}g)"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Markiere Laborcharge als zu Verpackung konvertiert
            lab_batch.converted_to_packaging = True
            lab_batch.converted_to_packaging_at = timezone.now()
            lab_batch.save()
            
            # Erstelle Restbetrag als vernichtete Verpackung, wenn gewünscht
            if auto_destroy_remainder and remaining_weight > 0:
                remainder_kwargs = {
                    'lab_testing_batch': lab_batch,
                    'total_weight': remaining_weight,
                    'unit_count': 1,
                    'unit_weight': remaining_weight,
                    'member_id': member_id,
                    'room_id': room_id,
                    'notes': f"Restmenge aus der Verpackung von {lab_batch.batch_number}. Automatisch zur Vernichtung markiert.",
                    'is_destroyed': True,
                    'destroy_reason': f"Automatische Vernichtung der Restmenge bei Verpackung von {lab_batch.batch_number}",
                    'destroyed_at': timezone.now(),
                    'destroyed_by_id': member_id
                }
                
                # 🆕 AUCH RESTMENGE MIT PREIS VERSEHEN (FÜR BUCHHALTUNG):
                if price_per_gram is not None:
                    remainder_kwargs['price_per_gram'] = price_per_gram
                
                PackagingBatch.objects.create(**remainder_kwargs)
            
            # 🆕 ERWEITERTE ERFOLGSMELDUNG MIT PREISINFORMATIONEN:
            response_data = {
                "message": f"{len(created_packagings)} Verpackungsbatches mit insgesamt {total_weight_used}g wurden erstellt",
                "packaging_count": len(created_packagings),
                "total_weight": total_weight_used,
                "packagings": [PackagingBatchSerializer(pkg).data for pkg in created_packagings]
            }
            
            # 🆕 PREISINFORMATIONEN HINZUFÜGEN:
            if price_per_gram is not None:
                total_value = 0
                for packaging in created_packagings:
                    if packaging.total_batch_price:
                        total_value += float(packaging.total_batch_price)
                
                response_data.update({
                    "pricing_info": {
                        "base_price_per_gram": price_per_gram,
                        "total_estimated_value": round(total_value, 2),
                        "currency": "EUR",
                        "note": "Preise wurden automatisch berechnet"
                    }
                })
            
            return Response(response_data)
            
        else:
            # Fallback für Einzelverpackung (bestehender Code, erweitert mit Preis)
            total_weight = float(request.data.get('total_weight', 0) or 0)
            unit_count = int(request.data.get('unit_count', 0) or 0)
            unit_weight = float(request.data.get('unit_weight', 0) or 0)
            
            # Validierungen für Einzelverpackung
            if total_weight <= 0:
                return Response(
                    {"error": "Das Gesamtgewicht muss größer als 0 sein"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            if unit_count <= 0:
                return Response(
                    {"error": "Die Anzahl der Einheiten muss größer als 0 sein"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            if unit_weight < 5.0:
                return Response(
                    {"error": "Das Gewicht pro Einheit muss mindestens 5g betragen"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Prüfen, ob das Gesamtgewicht verfügbar ist
            available_weight = lab_batch.remaining_weight
            if total_weight > available_weight:
                return Response(
                    {"error": f"Das Gesamtgewicht ({total_weight}g) überschreitet das verfügbare Gewicht ({available_weight}g)"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 🆕 KWARGS FÜR EINZELVERPACKUNG MIT PREIS VORBEREITEN:
            packaging_kwargs = {
                'lab_testing_batch': lab_batch,
                'total_weight': total_weight,
                'unit_count': unit_count,
                'unit_weight': unit_weight,
                'member_id': member_id,
                'room_id': room_id,
                'notes': notes
            }
            
            # 🆕 PREIS HINZUFÜGEN, FALLS VORHANDEN:
            if price_per_gram is not None:
                packaging_kwargs['price_per_gram'] = price_per_gram
            
            # Erstelle die Einzelverpackung
            packaging = PackagingBatch.objects.create(**packaging_kwargs)
            
            # Markiere Laborcharge als zu Verpackung konvertiert
            lab_batch.converted_to_packaging = True
            lab_batch.converted_to_packaging_at = timezone.now()
            lab_batch.save()
            
            # Erstelle Restbetrag als vernichtete Verpackung, wenn gewünscht
            if auto_destroy_remainder and remaining_weight > 0:
                remainder_kwargs = {
                    'lab_testing_batch': lab_batch,
                    'total_weight': remaining_weight,
                    'unit_count': 1,
                    'unit_weight': remaining_weight,
                    'member_id': member_id,
                    'room_id': room_id,
                    'notes': f"Restmenge aus der Verpackung von {lab_batch.batch_number}. Automatisch zur Vernichtung markiert.",
                    'is_destroyed': True,
                    'destroy_reason': f"Automatische Vernichtung der Restmenge bei Verpackung von {lab_batch.batch_number}",
                    'destroyed_at': timezone.now(),
                    'destroyed_by_id': member_id
                }
                
                # 🆕 AUCH RESTMENGE MIT PREIS VERSEHEN:
                if price_per_gram is not None:
                    remainder_kwargs['price_per_gram'] = price_per_gram
                
                PackagingBatch.objects.create(**remainder_kwargs)
            
            # 🆕 ERWEITERTE ERFOLGSMELDUNG FÜR EINZELVERPACKUNG:
            response_data = {
                "message": f"Verpackung mit {total_weight}g wurde erfolgreich erstellt",
                "packaging": PackagingBatchSerializer(packaging).data
            }
            
            # 🆕 PREISINFORMATIONEN HINZUFÜGEN:
            if price_per_gram is not None and packaging.total_batch_price:
                response_data.update({
                    "pricing_info": {
                        "price_per_gram": price_per_gram,
                        "total_value": float(packaging.total_batch_price),
                        "unit_price": float(packaging.unit_price) if packaging.unit_price else None,
                        "currency": "EUR"
                    }
                })
            
            return Response(response_data)

class PackagingBatchViewSet(viewsets.ModelViewSet):
    queryset = PackagingBatch.objects.all().order_by('-created_at')
    serializer_class = PackagingBatchSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = PackagingBatch.objects.all().order_by('-created_at')
        
        # Filtern nach Zeitraum
        year = self.request.query_params.get('year', None)
        month = self.request.query_params.get('month', None)
        day = self.request.query_params.get('day', None)
        
        # Filter nach Produkt-Typ
        product_type = self.request.query_params.get('product_type', None)
        
        # Filter nach zerstört/nicht zerstört
        destroyed = self.request.query_params.get('destroyed', None)
        
        if year:
            queryset = queryset.filter(created_at__year=year)
        if month:
            queryset = queryset.filter(created_at__month=month)
        if day:
            queryset = queryset.filter(created_at__day=day)
        
        if product_type:
            queryset = queryset.filter(lab_testing_batch__processing_batch__product_type=product_type)
        
        if destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            queryset = queryset.filter(is_destroyed=is_destroyed)
            
        # Berechne Anzahl für aktive und vernichtete Verpackungen
        active_count = queryset.filter(is_destroyed=False).count()
        destroyed_count = queryset.filter(is_destroyed=True).count()
        
        # Berechne Gesamtgewicht und Einheiten
        total_active_weight = queryset.filter(is_destroyed=False).aggregate(total=models.Sum('total_weight'))['total'] or 0
        total_active_units = queryset.filter(is_destroyed=False).aggregate(total=models.Sum('unit_count'))['total'] or 0
        total_destroyed_weight = queryset.filter(is_destroyed=True).aggregate(total=models.Sum('total_weight'))['total'] or 0
        total_destroyed_units = queryset.filter(is_destroyed=True).aggregate(total=models.Sum('unit_count'))['total'] or 0
        
        # Berechne Anzahl und Gewicht nach Produkt-Typ
        marijuana_count = queryset.filter(is_destroyed=False, lab_testing_batch__processing_batch__product_type='marijuana').count()
        hashish_count = queryset.filter(is_destroyed=False, lab_testing_batch__processing_batch__product_type='hashish').count()
        
        marijuana_weight = queryset.filter(
            is_destroyed=False, 
            lab_testing_batch__processing_batch__product_type='marijuana'
        ).aggregate(total=models.Sum('total_weight'))['total'] or 0
        
        hashish_weight = queryset.filter(
            is_destroyed=False, 
            lab_testing_batch__processing_batch__product_type='hashish'
        ).aggregate(total=models.Sum('total_weight'))['total'] or 0
        
        marijuana_units = queryset.filter(
            is_destroyed=False, 
            lab_testing_batch__processing_batch__product_type='marijuana'
        ).aggregate(total=models.Sum('unit_count'))['total'] or 0
        
        hashish_units = queryset.filter(
            is_destroyed=False, 
            lab_testing_batch__processing_batch__product_type='hashish'
        ).aggregate(total=models.Sum('unit_count'))['total'] or 0
        
        self.counts = {
            'active_count': active_count,
            'destroyed_count': destroyed_count,
            'total_active_weight': total_active_weight,
            'total_active_units': total_active_units,
            'total_destroyed_weight': total_destroyed_weight,
            'total_destroyed_units': total_destroyed_units,
            'marijuana_count': marijuana_count,
            'hashish_count': hashish_count,
            'marijuana_weight': marijuana_weight,
            'hashish_weight': hashish_weight,
            'marijuana_units': marijuana_units,
            'hashish_units': hashish_units
        }
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data['counts'] = getattr(self, 'counts', {
            'active_count': 0,
            'destroyed_count': 0,
            'total_active_weight': 0,
            'total_active_units': 0,
            'total_destroyed_weight': 0,
            'total_destroyed_units': 0,
            'marijuana_count': 0,
            'hashish_count': 0,
            'marijuana_weight': 0,
            'hashish_weight': 0,
            'marijuana_units': 0,
            'hashish_units': 0
        })
        return response
    
    @action(detail=False, methods=['get'])
    def counts(self, request):
        active_batches = PackagingBatch.objects.filter(is_destroyed=False)
        destroyed_batches = PackagingBatch.objects.filter(is_destroyed=True)
        
        active_count = active_batches.count()
        destroyed_count = destroyed_batches.count()
        
        total_active_weight = active_batches.aggregate(total=models.Sum('total_weight'))['total'] or 0
        total_active_units = active_batches.aggregate(total=models.Sum('unit_count'))['total'] or 0
        total_destroyed_weight = destroyed_batches.aggregate(total=models.Sum('total_weight'))['total'] or 0
        total_destroyed_units = destroyed_batches.aggregate(total=models.Sum('unit_count'))['total'] or 0
        
        # Nach Produkttyp
        marijuana_batches = PackagingBatch.objects.filter(
            is_destroyed=False, 
            lab_testing_batch__processing_batch__product_type='marijuana'
        )
        hashish_batches = PackagingBatch.objects.filter(
            is_destroyed=False, 
            lab_testing_batch__processing_batch__product_type='hashish'
        )
        
        marijuana_count = marijuana_batches.count()
        hashish_count = hashish_batches.count()
        
        marijuana_weight = marijuana_batches.aggregate(total=models.Sum('total_weight'))['total'] or 0
        hashish_weight = hashish_batches.aggregate(total=models.Sum('total_weight'))['total'] or 0
        
        marijuana_units = marijuana_batches.aggregate(total=models.Sum('unit_count'))['total'] or 0
        hashish_units = hashish_batches.aggregate(total=models.Sum('unit_count'))['total'] or 0
        
        return Response({
            'active_count': active_count,
            'destroyed_count': destroyed_count,
            'total_active_weight': float(total_active_weight),
            'total_active_units': total_active_units,
            'total_destroyed_weight': float(total_destroyed_weight),
            'total_destroyed_units': total_destroyed_units,
            'marijuana_count': marijuana_count,
            'hashish_count': hashish_count,
            'marijuana_weight': float(marijuana_weight),
            'hashish_weight': float(hashish_weight),
            'marijuana_units': marijuana_units,
            'hashish_units': hashish_units
        })
    
    @action(detail=True, methods=['post'])
    def destroy_packaging(self, request, pk=None):
        packaging_batch = self.get_object()
        reason = request.data.get('reason', '')
        destroyed_by_id = request.data.get('destroyed_by_id', None)
        
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
        
        packaging_batch.is_destroyed = True
        packaging_batch.destroy_reason = reason
        packaging_batch.destroyed_at = timezone.now()
        packaging_batch.destroyed_by_id = destroyed_by_id
        packaging_batch.save()
        
        return Response({
            "message": f"Verpackung {packaging_batch.batch_number} wurde vernichtet"
        })
    
    @action(detail=True, methods=['get'])
    def units(self, request, pk=None):
        batch = self.get_object()
        destroyed = request.query_params.get('destroyed', None)
        
        units = batch.units.all()
        if destroyed is not None:
            is_destroyed = destroyed.lower() == 'true'
            units = units.filter(is_destroyed=is_destroyed)
        
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(units, request)
        
        if page is not None:
            serializer = PackagingUnitSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = PackagingUnitSerializer(units, many=True)
        return Response(serializer.data)
    

class StrainCardViewSet(viewsets.ReadOnlyModelViewSet):
    """
    🚀 VOLLSTÄNDIG KORRIGIERTE StrainCard API - Intelligente Sorten-Gruppierung
    """
    permission_classes = [IsAuthenticated]
    pagination_class = StrainCardPagination
    
    def get_queryset(self):
        """
        Da source_strain eine Property ist, müssen wir die Aggregation in Python machen
        """
        # Basis-Query: Nur verfügbare Units mit allen nötigen Relations
        base_queryset = PackagingUnit.objects.filter(
            is_destroyed=False
        ).exclude(
            distributions__isnull=False
        ).select_related(
            'batch',
            'batch__lab_testing_batch',
            'batch__lab_testing_batch__processing_batch',
            'batch__lab_testing_batch__processing_batch__drying_batch',
            'batch__lab_testing_batch__processing_batch__drying_batch__harvest_batch',
            'batch__lab_testing_batch__processing_batch__drying_batch__harvest_batch__flowering_batch',
            'batch__lab_testing_batch__processing_batch__drying_batch__harvest_batch__flowering_batch__seed_purchase',
            'batch__lab_testing_batch__processing_batch__drying_batch__harvest_batch__flowering_batch__seed_purchase__strain',
        )
        
        # Empfänger-basierte THC-Filterung
        recipient_id = self.request.query_params.get('recipient_id')
        if recipient_id:
            try:
                from members.models import Member
                recipient = Member.objects.get(id=recipient_id)
                if hasattr(recipient, 'age_class') and recipient.age_class == "18+":
                    base_queryset = base_queryset.filter(
                        Q(batch__lab_testing_batch__thc_content__lte=10.0) | 
                        Q(batch__lab_testing_batch__thc_content__isnull=True)
                    )
            except Member.DoesNotExist:
                pass
        
        # Backend-Filter anwenden (alles außer strain_name)
        base_queryset = self._apply_backend_filters(base_queryset)
        
        return base_queryset
    
    def _apply_backend_filters(self, queryset):
        """Backend-Filter die in SQL funktionieren"""
        
        # Produkttyp-Filter
        product_type = self.request.query_params.get('product_type')
        if product_type:
            queryset = queryset.filter(
                batch__lab_testing_batch__processing_batch__product_type=product_type
            )
        
        # Gewichts-Filter
        weight = self.request.query_params.get('weight')
        if weight:
            try:
                weight_value = float(weight)
                queryset = queryset.filter(weight=weight_value)
            except (ValueError, TypeError):
                pass
        
        # THC-Filter (zusätzlich zu recipient-basierten)
        min_thc = self.request.query_params.get('min_thc')
        if min_thc:
            try:
                queryset = queryset.filter(
                    batch__lab_testing_batch__thc_content__gte=float(min_thc)
                )
            except (ValueError, TypeError):
                pass
                
        max_thc = self.request.query_params.get('max_thc')
        if max_thc:
            try:
                queryset = queryset.filter(
                    batch__lab_testing_batch__thc_content__lte=float(max_thc)
                )
            except (ValueError, TypeError):
                pass
        
        # Such-Filter für Batch-Nummer
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(batch__batch_number__icontains=search) |
                Q(batch_number__icontains=search)
            )
        
        return queryset
    
    def _extract_strain_name(self, unit):
        """
        Extrahiert Strain-Namen wie in PackagingUnitViewSet.distinct_strains()
        """
        name = None
        try:
            name = unit.batch.lab_testing_batch.processing_batch.drying_batch.harvest_batch.flowering_batch.seed_purchase.strain.name
        except Exception:
            pass
        if not name:
            try:
                name = unit.batch.flowering_batch.seed_purchase.strain.name
            except Exception:
                pass
        if not name:
            try:
                name = unit.batch.seed_purchase.strain.name
            except Exception:
                pass
        if not name:
            name = getattr(unit.batch, "source_strain", None) or getattr(unit, "source_strain", None)
        if not name:
            name = getattr(unit, "strain_name", None)
        
        return name if name and name != "Unbekannt" else "Unbekannte Sorte"
    
    def _get_cannabis_batch_id(self, unit):
        """🔧 NEU: Ermittelt die echte Cannabis-Charge-ID"""
        try:
            # Versuche über harvest_batch (die echte Cannabis-Charge)
            if (unit.batch and 
                unit.batch.lab_testing_batch and 
                unit.batch.lab_testing_batch.processing_batch and
                unit.batch.lab_testing_batch.processing_batch.drying_batch and
                unit.batch.lab_testing_batch.processing_batch.drying_batch.harvest_batch):
                harvest_batch = unit.batch.lab_testing_batch.processing_batch.drying_batch.harvest_batch
                return f"harvest_{harvest_batch.id}"
        except Exception:
            pass
        
        # Fallback: processing_batch
        try:
            if (unit.batch and 
                unit.batch.lab_testing_batch and 
                unit.batch.lab_testing_batch.processing_batch):
                processing_batch = unit.batch.lab_testing_batch.processing_batch
                return f"processing_{processing_batch.id}"
        except Exception:
            pass
        
        # Notfall-Fallback
        return f"packaging_{unit.batch.id}" if unit.batch else None
    
    def _group_units_to_strain_cards(self, units):
        """
        🎯 ERWEITERTE LOGIK: THC-Bereich bei mehreren Cannabis-Chargen + PREISE
        """
        strain_filter = self.request.query_params.get('strain_name', '').strip()
        
        # Gruppierung nach Sorte
        strain_groups = defaultdict(lambda: {
            'units': [],
            'available_weights': set(),
            'weight_counts': defaultdict(int),
            'thc_values_by_batch': defaultdict(list),
            'cannabis_batches': set(),
            # 🆕 NEUE PREIS-STRUKTUREN
            'price_ranges': defaultdict(list),  # Preise pro Gewicht
            'min_price': float('inf'),
            'max_price': 0
        })
        
        for unit in units:
            strain_name = self._extract_strain_name(unit)
            
            if strain_filter and strain_name != strain_filter:
                continue
            
            weight = float(unit.weight) if unit.weight else 0
            
            strain_data = strain_groups[strain_name]
            strain_data['units'].append(unit)
            strain_data['available_weights'].add(weight)
            strain_data['weight_counts'][weight] += 1
            
            # 🆕 PREISE SAMMELN
            if unit.unit_price:
                price = float(unit.unit_price)
                strain_data['price_ranges'][weight].append(price)
                strain_data['min_price'] = min(strain_data['min_price'], price)
                strain_data['max_price'] = max(strain_data['max_price'], price)
            
            # Cannabis-Charge-ID ermitteln
            cannabis_batch_id = self._get_cannabis_batch_id(unit)
            if cannabis_batch_id:
                strain_data['cannabis_batches'].add(cannabis_batch_id)
                
                # THC-Werte pro Cannabis-Charge sammeln
                if (unit.batch and 
                    unit.batch.lab_testing_batch and 
                    unit.batch.lab_testing_batch.thc_content):
                    thc_value = float(unit.batch.lab_testing_batch.thc_content)
                    strain_data['thc_values_by_batch'][cannabis_batch_id].append(thc_value)
        
        # Konvertiere zu StrainCard-Format
        strain_cards = []
        for strain_name, data in strain_groups.items():
            if not data['units']:
                continue
            
            first_unit = data['units'][0]
            
            # Produkttyp ermitteln
            product_type = 'unknown'
            product_type_display = 'Unbekannt'
            if (first_unit.batch and 
                first_unit.batch.lab_testing_batch and 
                first_unit.batch.lab_testing_batch.processing_batch):
                processing_batch = first_unit.batch.lab_testing_batch.processing_batch
                product_type = processing_batch.product_type
                product_type_display = processing_batch.get_product_type_display()
            
            # THC-BEREICH BERECHNEN (bestehender Code)
            thc_display = "k.A."
            if data['thc_values_by_batch']:
                all_thc_values = set()
                for cannabis_batch_id, thc_list in data['thc_values_by_batch'].items():
                    if thc_list:
                        avg_thc_for_batch = sum(thc_list) / len(thc_list)
                        all_thc_values.add(round(avg_thc_for_batch, 1))
                
                if len(all_thc_values) == 1:
                    thc_display = f"{list(all_thc_values)[0]}"
                elif len(all_thc_values) > 1:
                    min_thc = min(all_thc_values)
                    max_thc = max(all_thc_values)
                    thc_display = f"{min_thc} - {max_thc}"
            
            # 🆕 PREIS-INFORMATIONEN BERECHNEN
            price_info = {
                'has_prices': data['min_price'] != float('inf'),
                'min_price': data['min_price'] if data['min_price'] != float('inf') else None,
                'max_price': data['max_price'] if data['max_price'] > 0 else None,
                'price_by_weight': {}
            }
            
            # Preis pro Gewicht berechnen
            for weight, prices in data['price_ranges'].items():
                if prices:
                    min_price_for_weight = min(prices)
                    max_price_for_weight = max(prices)
                    if min_price_for_weight == max_price_for_weight:
                        price_info['price_by_weight'][weight] = {
                            'price': min_price_for_weight,
                            'display': f"{min_price_for_weight:.2f} €"
                        }
                    else:
                        price_info['price_by_weight'][weight] = {
                            'min': min_price_for_weight,
                            'max': max_price_for_weight,
                            'display': f"{min_price_for_weight:.2f} - {max_price_for_weight:.2f} €"
                        }
            
            # Preis pro Gramm berechnen (vom ersten Unit mit Preis)
            price_per_gram = None
            for unit in data['units']:
                if unit.unit_price and unit.weight:
                    price_per_gram = float(unit.unit_price) / float(unit.weight)
                    break
            
            # Gewichts-Optionen mit Preisen
            size_options = []
            for weight in sorted(data['available_weights']):
                count = data['weight_counts'][weight]
                price_display = ""
                if weight in price_info['price_by_weight']:
                    price_display = f" • {price_info['price_by_weight'][weight]['display']}"
                size_options.append(f"{weight}g ({count}x){price_display}")
            
            # Available units mit Preisen
            available_units = []
            for unit in data['units']:
                unit_data = {
                    'id': str(unit.id),
                    'batch_number': unit.batch_number,
                    'weight': float(unit.weight) if unit.weight else 0,
                    'packaging_batch_id': unit.batch.id if unit.batch else None,
                    'cannabis_batch_id': self._get_cannabis_batch_id(unit),
                    # 🆕 PREIS HINZUFÜGEN
                    'unit_price': float(unit.unit_price) if unit.unit_price else None,
                    'price_display': f"{float(unit.unit_price):.2f} €" if unit.unit_price else None
                }
                available_units.append(unit_data)
            
            cannabis_batch_count = len(data['cannabis_batches'])
            
            # StrainCard mit Preisinformationen
            strain_card = {
                'id': f"strain_{strain_name.replace(' ', '_')}",
                'strain_name': strain_name,
                'product_type': product_type,
                'product_type_display': product_type_display,
                'total_unit_count': len(data['units']),
                'avg_thc_content': thc_display,
                'size_options': size_options,
                'available_weights': sorted(data['available_weights']),
                'batch_count': cannabis_batch_count,
                'cannabis_batches': list(data['cannabis_batches']),
                'available_units': available_units,
                # 🆕 PREIS-INFORMATIONEN
                'price_info': price_info,
                'price_per_gram': f"{price_per_gram:.2f}" if price_per_gram else None,
                'price_display': price_info['price_by_weight'][sorted(data['available_weights'])[0]]['display'] if price_info['has_prices'] and data['available_weights'] else None,
                'first_unit': {
                    'id': str(first_unit.id),
                    'batch_number': first_unit.batch_number,
                    'weight': float(first_unit.weight) if first_unit.weight else 0,
                    'unit_price': float(first_unit.unit_price) if first_unit.unit_price else None
                }
            }
            
            strain_cards.append(strain_card)
        
        strain_cards.sort(key=lambda x: x['strain_name'])
        return strain_cards
    
    def list(self, request, *args, **kwargs):
        """Custom List Response mit manueller Pagination"""
        # Hole alle Units (mit Filtern)
        units_queryset = self.get_queryset()
        
        print(f"🔍 StrainCard: {units_queryset.count()} verfügbare Units gefunden")
        
        # Konvertiere zu StrainCards (in Python, da source_strain Property ist)
        all_strain_cards = self._group_units_to_strain_cards(units_queryset)
        
        print(f"🌿 StrainCard: {len(all_strain_cards)} Strain-Karten erstellt")
        
        # 🔧 DEBUG: Zeige erste Karte für Diagnose
        if all_strain_cards:
            first_card = all_strain_cards[0]
            print(f"🔍 Erste Karte: {first_card['strain_name']}")
            print(f"   - Gewichte: {first_card['available_weights']}")
            print(f"   - Units: {first_card['total_unit_count']}")
            print(f"   - Cannabis-Chargen: {first_card['batch_count']}")
            print(f"   - Chargen-IDs: {first_card['cannabis_batches']}")
            print(f"   - Available Units: {len(first_card['available_units'])}")
        
        # Manuelle Pagination
        page_size = int(request.query_params.get('page_size', 12))
        page_number = int(request.query_params.get('page', 1))
        
        start_index = (page_number - 1) * page_size
        end_index = start_index + page_size
        
        paginated_cards = all_strain_cards[start_index:end_index]
        
        # Response im DRF-Pagination-Format
        has_next = end_index < len(all_strain_cards)
        has_previous = page_number > 1
        
        response_data = {
            'count': len(all_strain_cards),
            'next': f"?page={page_number + 1}&page_size={page_size}" if has_next else None,
            'previous': f"?page={page_number - 1}&page_size={page_size}" if has_previous else None,
            'results': paginated_cards
        }
        
        return Response(response_data)
    
    @action(detail=False, methods=['get'])
    def filter_options(self, request):
        """Lade verfügbare Filter-Optionen"""
        
        # Basis-Query ohne Strain-Filter
        base_queryset = PackagingUnit.objects.filter(
            is_destroyed=False
        ).exclude(
            distributions__isnull=False
        ).select_related(
            'batch__lab_testing_batch__processing_batch'
        )
        
        # Empfänger-Filter anwenden
        recipient_id = request.query_params.get('recipient_id')
        if recipient_id:
            try:
                from members.models import Member
                recipient = Member.objects.get(id=recipient_id)
                if hasattr(recipient, 'age_class') and recipient.age_class == "18+":
                    base_queryset = base_queryset.filter(
                        Q(batch__lab_testing_batch__thc_content__lte=10.0) | 
                        Q(batch__lab_testing_batch__thc_content__isnull=True)
                    )
            except Member.DoesNotExist:
                pass
        
        # Verfügbare Gewichte (SQL-Abfrage möglich)
        available_weights = base_queryset.values_list(
            'weight', flat=True
        ).distinct().order_by('weight')
        
        weight_options = [
            {'value': str(weight), 'label': f'{weight}g'}
            for weight in available_weights if weight is not None
        ]
        
        # Verfügbare Sorten (PYTHON-basiert, da source_strain Property ist)
        available_strains = set()
        
        # Nehme eine begrenzte Anzahl Units für Performance
        sample_units = base_queryset[:500]  # Limitiere für Performance
        
        for unit in sample_units:
            strain_name = self._extract_strain_name(unit)
            if strain_name and strain_name != 'Unbekannte Sorte':
                available_strains.add(strain_name)
        
        strain_options = [
            {'name': strain} 
            for strain in sorted(available_strains)
        ]
        
        print(f"🔍 Filter-Optionen: {len(weight_options)} Gewichte, {len(strain_options)} Sorten")
        
        return Response({
            'weight_options': weight_options,
            'strain_options': strain_options,
            'total_available_units': base_queryset.count()
        })
    
    @action(detail=False, methods=['get'])
    def available_units_for_strain(self, request):
        """
        🎯 KORRIGIERTER ENDPOINT: Alle verfügbaren Units einer bestimmten Sorte
        Ermöglicht das Abrufen aller Units einer Sorte über alle Batches hinweg
        """
        strain_name = request.query_params.get('strain_name')
        weight = request.query_params.get('weight')
        
        if not strain_name:
            return Response(
                {"error": "strain_name ist erforderlich"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Alle verfügbaren Units der Sorte
        units = self.get_queryset()
        
        # Filtere nach Strain-Namen (in Python, da Property)
        matching_units = []
        cannabis_batches = set()
        
        for unit in units:
            unit_strain_name = self._extract_strain_name(unit)
            if unit_strain_name == strain_name:
                # Optional: Auch nach Gewicht filtern
                if weight:
                    try:
                        weight_value = float(weight)
                        if float(unit.weight) == weight_value:
                            matching_units.append(unit)
                            # Cannabis-Charge tracken
                            cannabis_batch_id = self._get_cannabis_batch_id(unit)
                            if cannabis_batch_id:
                                cannabis_batches.add(cannabis_batch_id)
                    except (ValueError, TypeError):
                        pass
                else:
                    matching_units.append(unit)
                    # Cannabis-Charge tracken
                    cannabis_batch_id = self._get_cannabis_batch_id(unit)
                    if cannabis_batch_id:
                        cannabis_batches.add(cannabis_batch_id)
        
        # Gruppiere nach Gewicht für bessere Übersicht
        weight_groups = defaultdict(list)
        for unit in matching_units:
            weight_key = float(unit.weight) if unit.weight else 0
            weight_groups[weight_key].append(unit)
        
        response_data = {
            'strain_name': strain_name,
            'total_units': len(matching_units),
            'cannabis_batch_count': len(cannabis_batches),  # 🔧 NEU: Cannabis-Chargen-Anzahl
            'cannabis_batches': list(cannabis_batches),     # 🔧 NEU: Liste der Cannabis-Chargen
            'weight_groups': {}
        }
        
        # 🔧 KORREKTUR: Alle Units zurückgeben (keine Limitierung!)
        for weight, units_list in weight_groups.items():
            response_data['weight_groups'][f"{weight}g"] = {
                'count': len(units_list),
                'units': PackagingUnitSerializer(units_list, many=True).data  # 🔧 ALLE Units!
            }
        
        print(f"🎯 Units für Sorte '{strain_name}': {len(matching_units)} gefunden, {len(weight_groups)} Gewichtsgruppen, {len(cannabis_batches)} Cannabis-Chargen")
        
        return Response(response_data)
    

class PackagingUnitViewSet(viewsets.ModelViewSet):
    queryset = PackagingUnit.objects.all().order_by('-created_at')
    serializer_class = PackagingUnitSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    @action(detail=True, methods=['post'])
    def destroy_unit(self, request, pk=None):
        unit = self.get_object()
        reason = request.data.get('reason', '')
        destroyed_by_id = request.data.get('destroyed_by_id', None)
        if not reason:
            return Response({"error": "Ein Vernichtungsgrund ist erforderlich"}, status=status.HTTP_400_BAD_REQUEST)
        if not destroyed_by_id:
            return Response({"error": "Ein verantwortliches Mitglied muss angegeben werden"}, status=status.HTTP_400_BAD_REQUEST)
        unit.is_destroyed = True
        unit.destroy_reason = reason
        unit.destroyed_at = timezone.now()
        unit.destroyed_by_id = destroyed_by_id
        unit.save()
        return Response({"message": f"Verpackungseinheit {unit.batch_number} wurde vernichtet"})
    
    @action(detail=False, methods=['get'])
    def distinct_weights(self, request):
        """
        Liefert eine Liste aller verfügbaren Gewichte für die Dropdown-Auswahl
        """
        try:
            # Hole alle einzigartigen Gewichte aus PackagingUnit
            weights = PackagingUnit.objects.values_list('weight', flat=True).distinct().order_by('weight')
            
            # Filtere None-Werte heraus und konvertiere zu Liste
            valid_weights = [str(weight) for weight in weights if weight is not None]
            
            print(f"🔍 Sir, gefundene Gewichte: {valid_weights}")
            
            return Response(valid_weights)
            
        except Exception as e:
            print(f"❌ Fehler beim Laden der Gewichte: {str(e)}")
            return Response([], status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def distinct_strains(self, request):
        strains = set()
        for unit in PackagingUnit.objects.all():
            # Name extrahieren wie in der Tabelle
            name = None
            try:
                name = unit.batch.lab_testing_batch.processing_batch.drying_batch.harvest_batch.flowering_batch.seed_purchase.strain.name
            except Exception:
                pass
            if not name:
                try:
                    name = unit.batch.flowering_batch.seed_purchase.strain.name
                except Exception:
                    pass
            if not name:
                try:
                    name = unit.batch.seed_purchase.strain.name
                except Exception:
                    pass
            if not name:
                name = getattr(unit.batch, "source_strain", None) or getattr(unit, "source_strain", None)
            if not name:
                name = getattr(unit, "strain_name", None)
            if name and name != "Unbekannt":
                strains.add(name)
        return Response([{"name": n} for n in sorted(strains)])

    @action(detail=False, methods=['get'])
    def get_units_for_strain_card(self, request):
        """
        Lade alle verfügbaren Units für eine spezifische Strain+Weight Kombination
        """
        strain_name = request.query_params.get('strain_name')
        weight = request.query_params.get('weight')
        
        if not strain_name or not weight:
            return Response(
                {"error": "strain_name und weight sind erforderlich"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            weight_value = float(weight)
        except (ValueError, TypeError):
            return Response(
                {"error": "Ungültiges Gewicht"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Alle verfügbaren Units
        units = PackagingUnit.objects.filter(
            is_destroyed=False,
            weight=weight_value
        ).exclude(
            distributions__isnull=False
        ).select_related(
            'batch',
            'batch__lab_testing_batch',
            'batch__lab_testing_batch__processing_batch',
            'batch__lab_testing_batch__processing_batch__drying_batch',
            'batch__lab_testing_batch__processing_batch__drying_batch__harvest_batch',
            'batch__lab_testing_batch__processing_batch__drying_batch__harvest_batch__flowering_batch',
            'batch__lab_testing_batch__processing_batch__drying_batch__harvest_batch__flowering_batch__seed_purchase',
            'batch__lab_testing_batch__processing_batch__drying_batch__harvest_batch__flowering_batch__seed_purchase__strain',
        )
        
        # Filtere Units nach Strain-Namen (in Python)
        matching_units = []
        for unit in units:
            unit_strain_name = self._extract_strain_name_for_unit(unit)
            if unit_strain_name == strain_name:
                matching_units.append(unit)
        
        # Limitiere für Performance
        matching_units = matching_units[:10]
        
        serializer = PackagingUnitSerializer(matching_units, many=True)
        return Response(serializer.data)
    
    def _extract_strain_name_for_unit(self, unit):
        """Hilfsfunktion für Strain-Name-Extraktion"""
        name = None
        try:
            name = unit.batch.lab_testing_batch.processing_batch.drying_batch.harvest_batch.flowering_batch.seed_purchase.strain.name
        except Exception:
            pass
        if not name:
            try:
                name = unit.batch.flowering_batch.seed_purchase.strain.name
            except Exception:
                pass
        if not name:
            try:
                name = unit.batch.seed_purchase.strain.name
            except Exception:
                pass
        if not name:
            name = getattr(unit.batch, "source_strain", None) or getattr(unit, "source_strain", None)
        if not name:
            name = getattr(unit, "strain_name", None)
        
        return name if name and name != "Unbekannt" else "Unbekannte Sorte"

    def get_queryset(self):
        queryset = PackagingUnit.objects.select_related(
            'batch',
            'batch__lab_testing_batch',
            'batch__lab_testing_batch__processing_batch',
            'batch__lab_testing_batch__processing_batch__drying_batch',
            'batch__lab_testing_batch__processing_batch__drying_batch__harvest_batch',
            'batch__lab_testing_batch__processing_batch__drying_batch__harvest_batch__flowering_batch',
            'batch__lab_testing_batch__processing_batch__drying_batch__harvest_batch__flowering_batch__seed_purchase',
            'batch__lab_testing_batch__processing_batch__drying_batch__harvest_batch__flowering_batch__seed_purchase__strain',
        ).all()

        weight = self.request.query_params.get('weight')
        if weight:
            try:
                from decimal import Decimal, InvalidOperation
                weight_value = Decimal(str(weight).strip())
                queryset = queryset.filter(weight=weight_value)
            except (ValueError, TypeError, InvalidOperation):
                pass

        # Produkttyp-Filter
        product_type = self.request.query_params.get('product_type')
        if product_type:
            queryset = queryset.filter(batch__lab_testing_batch__processing_batch__product_type=product_type)

        # THC-Filter
        min_thc = self.request.query_params.get('min_thc')
        if min_thc:
            try:
                min_thc_value = float(min_thc)
                queryset = queryset.filter(batch__lab_testing_batch__thc_content__gte=min_thc_value)
            except (ValueError, TypeError):
                pass

        max_thc = self.request.query_params.get('max_thc')
        if max_thc:
            try:
                max_thc_value = float(max_thc)
                queryset = queryset.filter(batch__lab_testing_batch__thc_content__lte=max_thc_value)
            except (ValueError, TypeError):
                pass

        # Strain-Filter (bestehende Logik beibehalten)
        strain_name = self.request.query_params.get('strain_name')
        if strain_name:
            pks = []
            for unit in queryset:
                name = None
                try:
                    name = unit.batch.lab_testing_batch.processing_batch.drying_batch.harvest_batch.flowering_batch.seed_purchase.strain.name
                except Exception:
                    pass
                if not name:
                    try:
                        name = unit.batch.flowering_batch.seed_purchase.strain.name
                    except Exception:
                        pass
                if not name:
                    try:
                        name = unit.batch.seed_purchase.strain.name
                    except Exception:
                        pass
                if not name:
                    name = getattr(unit.batch, "source_strain", None) or getattr(unit, "source_strain", None)
                if not name:
                    name = getattr(unit, "strain_name", None)
                if name == strain_name:
                    pks.append(unit.pk)
            queryset = queryset.filter(pk__in=pks)

        # Suchfilter
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(batch_number__icontains=search) |
                Q(batch__source_strain__icontains=search) |
                Q(batch__lab_testing_batch__processing_batch__drying_batch__harvest_batch__flowering_batch__seed_purchase__strain__name__icontains=search)
            )

        # Debug-Ausgabe für Entwicklung
        print(f"📊 Queryset Count nach Filterung: {queryset.count()}")
        
        return queryset
    

class ProductDistributionViewSet(viewsets.ModelViewSet):
    queryset = ProductDistribution.objects.all().order_by('-distribution_date')
    serializer_class = ProductDistributionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = ProductDistribution.objects.all().order_by('-distribution_date')
        
        # Filter nach Empfänger-Mitglied
        recipient_id = self.request.query_params.get('recipient_id', None)
        if recipient_id:
            queryset = queryset.filter(recipient_id=recipient_id)
        
        # Filter nach Mitarbeiter (Distributor)
        distributor_id = self.request.query_params.get('distributor_id', None)
        if distributor_id:
            queryset = queryset.filter(distributor_id=distributor_id)
            
        # Zeitraum-Filter
        year = self.request.query_params.get('year', None)
        month = self.request.query_params.get('month', None)
        day = self.request.query_params.get('day', None)
        
        if year:
            queryset = queryset.filter(distribution_date__year=year)
        if month:
            queryset = queryset.filter(distribution_date__month=month)
        if day:
            queryset = queryset.filter(distribution_date__day=day)
            
        return queryset
    
    def create(self, request, *args, **kwargs):
        """
        Erweiterte create-Methode mit Limit-Validierung, Preisberechnung und Kontostand-Update
        """
        recipient_id = request.data.get('recipient_id')
        packaging_unit_ids = request.data.get('packaging_unit_ids', [])
        
        if not recipient_id:
            return Response(
                {"error": "Empfänger-ID ist erforderlich"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Empfänger laden
        try:
            from members.models import Member
            recipient = Member.objects.get(id=recipient_id)
        except Member.DoesNotExist:
            return Response(
                {"error": "Empfänger nicht gefunden"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Altersklasse bestimmen
        age_class = recipient.age_class if hasattr(recipient, 'age_class') else "21+"
        is_u21 = age_class == "18+"
        
        # Limits basierend auf Altersklasse
        daily_limit = 25.0
        monthly_limit = 30.0 if is_u21 else 50.0
        max_thc_percentage = 10.0 if is_u21 else None
        
        # Aktuelles Datum
        today = timezone.now().date()
        month_start = today.replace(day=1)
        
        # Bisherige Ausgaben abrufen
        daily_consumption = ProductDistribution.objects.filter(
            recipient_id=recipient_id,
            distribution_date__date=today
        ).aggregate(
            total_weight=Sum('packaging_units__weight')
        )['total_weight'] or 0
        
        monthly_consumption = ProductDistribution.objects.filter(
            recipient_id=recipient_id,
            distribution_date__date__gte=month_start,
            distribution_date__date__lte=today
        ).aggregate(
            total_weight=Sum('packaging_units__weight')
        )['total_weight'] or 0
        
        # Gewicht der ausgewählten Einheiten berechnen und Preisberechnung
        selected_weight = 0
        total_price = 0
        thc_violations = []
        
        for unit_id in packaging_unit_ids:
            try:
                unit = PackagingUnit.objects.select_related(
                    'batch__lab_testing_batch'
                ).get(id=unit_id)
                
                unit_weight = float(unit.weight)
                selected_weight += unit_weight
                
                # Preisberechnung
                if unit.unit_price:
                    total_price += float(unit.unit_price)
                
                # THC-Prüfung für U21
                if is_u21 and unit.batch and unit.batch.lab_testing_batch:
                    thc_content = unit.batch.lab_testing_batch.thc_content
                    if thc_content and float(thc_content) > max_thc_percentage:
                        thc_violations.append({
                            'unit_id': str(unit_id),
                            'unit_number': unit.batch_number,
                            'thc_content': float(thc_content),
                            'strain': unit.batch.source_strain
                        })
                        
            except PackagingUnit.DoesNotExist:
                continue
        
        # Neue Gesamtwerte berechnen
        new_daily_total = float(daily_consumption) + selected_weight
        new_monthly_total = float(monthly_consumption) + selected_weight
        
        # Validierung
        errors = []
        
        if new_daily_total > daily_limit:
            remaining = daily_limit - float(daily_consumption)
            errors.append(f"Tageslimit überschritten! Noch verfügbar: {remaining:.2f}g")
            
        if new_monthly_total > monthly_limit:
            remaining = monthly_limit - float(monthly_consumption)
            errors.append(f"Monatslimit überschritten! Noch verfügbar: {remaining:.2f}g")
            
        if thc_violations:
            errors.append(f"THC-Limit überschritten! Max. 10% THC für Mitglieder unter 21 Jahren.")
        
        if errors:
            return Response(
                {
                    "error": "Ausgabe nicht möglich",
                    "details": errors,
                    "validation": {
                        "recipient": {
                            "id": str(recipient.id),
                            "name": f"{recipient.first_name} {recipient.last_name}",
                            "age_class": age_class
                        },
                        "violations": {
                            "exceeds_daily_limit": new_daily_total > daily_limit,
                            "exceeds_monthly_limit": new_monthly_total > monthly_limit,
                            "thc_violations": thc_violations
                        },
                        "remaining": {
                            "daily_remaining": daily_limit - new_daily_total,
                            "monthly_remaining": monthly_limit - new_monthly_total
                        }
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kontostand vor der Transaktion speichern
        balance_before = float(recipient.kontostand)
        
        # Erstelle die Distribution mit Preisinformationen
        distribution_data = request.data.copy()
        distribution_data['total_price'] = total_price
        distribution_data['balance_before'] = balance_before
        distribution_data['balance_after'] = balance_before - total_price
        
        # Serializer mit erweiterten Daten
        serializer = self.get_serializer(data=distribution_data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Kontostand aktualisieren
        recipient.kontostand = balance_before - total_price
        recipient.save(update_fields=['kontostand'])
        
        # Joomla-Sync
        try:
            from members.api_views import sync_joomla_user
            sync_joomla_user(recipient)
        except Exception as e:
            print(f"⚠️ Joomla-Sync fehlgeschlagen: {str(e)}")
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=False, methods=['get'])
    def member_summary(self, request):
        """
        Liefert eine Zusammenfassung der Produktauslieferungen für ein bestimmtes Mitglied.
        """
        member_id = request.query_params.get('member_id')
        if not member_id:
            return Response(
                {"error": "Mitglieds-ID ist erforderlich"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Summen für beide Rollen (Empfänger und Ausgebender) abrufen
        received = ProductDistribution.objects.filter(recipient_id=member_id)
        distributed = ProductDistribution.objects.filter(distributor_id=member_id)
        
        # Zeitliche Begrenzung (z.B. letzte 30 Tage für Details)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        # Zusammenfassungen erstellen
        summary = {
            'received': {
                'total_count': received.count(),
                'recent_count': received.filter(distribution_date__gte=thirty_days_ago).count(),
                'total_weight': float(sum(dist.total_weight for dist in received)),
                'recent_distributions': ProductDistributionSerializer(
                    received.filter(distribution_date__gte=thirty_days_ago)[:10],
                    many=True
                ).data
            },
            'distributed': {
                'total_count': distributed.count(),
                'recent_count': distributed.filter(distribution_date__gte=thirty_days_ago).count(),
                'total_weight': float(sum(dist.total_weight for dist in distributed)),
                'recent_distributions': ProductDistributionSerializer(
                    distributed.filter(distribution_date__gte=thirty_days_ago)[:10],
                    many=True
                ).data if request.user.groups.filter(name__in=['teamleiter', 'admin']).exists() else []
            }
        }
        
        return Response(summary)
    
    @action(detail=False, methods=['get'])
    def member_consumption_summary(self, request):
        """
        Erweiterte member_summary mit Limit-Informationen
        """
        member_id = request.query_params.get('member_id')
        if not member_id:
            return Response(
                {"error": "Mitglieds-ID ist erforderlich"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from members.models import Member
            member = Member.objects.get(id=member_id)
        except Member.DoesNotExist:
            return Response(
                {"error": "Mitglied nicht gefunden"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Zeiträume
        today = timezone.now().date()
        month_start = today.replace(day=1)
        thirty_days_ago = today - timedelta(days=30)
        
        # Bestehende Abfragen
        received = ProductDistribution.objects.filter(recipient_id=member_id)
        distributed = ProductDistribution.objects.filter(distributor_id=member_id)
        
        # Tages- und Monatsverbrauch
        daily_consumption = received.filter(
            distribution_date__date=today
        ).aggregate(
            total_weight=Sum('packaging_units__weight')
        )['total_weight'] or 0
        
        monthly_consumption = received.filter(
            distribution_date__date__gte=month_start,
            distribution_date__date__lte=today
        ).aggregate(
            total_weight=Sum('packaging_units__weight')
        )['total_weight'] or 0
        
        # Limits basierend auf Alter
        age_class = member.age_class if hasattr(member, 'age_class') else "21+"
        age = member.age if hasattr(member, 'age') else None
        is_u21 = age_class == "18+"
        daily_limit = 25.0
        monthly_limit = 30.0 if is_u21 else 50.0
        max_thc = 10.0 if is_u21 else None
        
        summary = {
            'member': {
                'id': str(member.id),
                'name': f"{member.first_name} {member.last_name}",
                'age': age,
                'age_class': age_class,
                'kontostand': float(member.kontostand),
                'beitrag': float(member.beitrag),
                'first_name': member.first_name,
                'last_name': member.last_name,
                'email': member.email
            },
            'limits': {
                'daily_limit': daily_limit,
                'monthly_limit': monthly_limit,
                'max_thc_percentage': max_thc
            },
            'consumption': {
                'daily': {
                    'consumed': float(daily_consumption),
                    'remaining': daily_limit - float(daily_consumption),
                    'percentage': (float(daily_consumption) / daily_limit * 100) if daily_limit > 0 else 0
                },
                'monthly': {
                    'consumed': float(monthly_consumption),
                    'remaining': monthly_limit - float(monthly_consumption),
                    'percentage': (float(monthly_consumption) / monthly_limit * 100) if monthly_limit > 0 else 0
                }
            },
            'received': {
                'total_count': received.count(),
                'recent_count': received.filter(distribution_date__gte=thirty_days_ago).count(),
                'total_weight': float(sum(dist.total_weight for dist in received)),
                'recent_distributions': ProductDistributionSerializer(
                    received.filter(distribution_date__gte=thirty_days_ago)[:10],
                    many=True
                ).data
            },
            'distributed': {
                'total_count': distributed.count(),
                'recent_count': distributed.filter(distribution_date__gte=thirty_days_ago).count(),
                'total_weight': float(sum(dist.total_weight for dist in distributed)),
            }
        }
        
        return Response(summary)
    
    @action(detail=False, methods=['get'])
    def available_units(self, request):
        """
        Erweiterte Version mit THC-Filter basierend auf Empfänger-Alter
        """
        # Basis-Query wie bisher
        units = PackagingUnit.objects.filter(
            is_destroyed=False,
        ).exclude(
            distributions__isnull=False
        )
        
        # THC-Filter basierend auf Empfänger
        recipient_id = request.query_params.get('recipient_id')
        if recipient_id:
            try:
                from members.models import Member
                recipient = Member.objects.get(id=recipient_id)
                
                # Wenn U21, filtere Produkte mit >10% THC
                if hasattr(recipient, 'age_class') and recipient.age_class == "18+":
                    units = units.filter(
                        Q(batch__lab_testing_batch__thc_content__lte=10.0) | 
                        Q(batch__lab_testing_batch__thc_content__isnull=True)
                    )
            except Member.DoesNotExist:
                pass
        
        # Weitere bestehende Filter...
        product_type = request.query_params.get('product_type')
        if product_type:
            units = units.filter(batch__lab_testing_batch__processing_batch__product_type=product_type)
            
        serializer = PackagingUnitSerializer(units, many=True)
        return Response(serializer.data)


# Cannabis-Limit Validierungs-API
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_distribution_limits(request):
    """
    Validiert, ob eine geplante Ausgabe die Cannabis-Limits einhält.
    
    Input: 
        - recipient_id: UUID des Empfängers
        - selected_units: Array von Unit-IDs mit Gewichten
    
    Output: 
        - validation_result mit Details zu Limits und Violations
    """
    recipient_id = request.data.get('recipient_id')
    selected_units = request.data.get('selected_units', [])
    
    if not recipient_id:
        return Response(
            {"error": "Empfänger-ID ist erforderlich"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Empfänger laden
    try:
        from members.models import Member
        recipient = Member.objects.get(id=recipient_id)
    except Member.DoesNotExist:
        return Response(
            {"error": "Empfänger nicht gefunden"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Altersklasse bestimmen
    age_class = recipient.age_class  # Nutzt die property aus dem Member Model
    is_u21 = age_class == "18+"
    
    # Limits basierend auf Altersklasse
    daily_limit = 25.0  # Beide Altersklassen haben 25g/Tag
    monthly_limit = 30.0 if is_u21 else 50.0
    max_thc_percentage = 10.0 if is_u21 else None
    
    # Aktuelles Datum für Berechnungen
    today = timezone.now().date()
    month_start = today.replace(day=1)
    
    # Bisherige Ausgaben heute abrufen
    daily_consumption = ProductDistribution.objects.filter(
        recipient_id=recipient_id,
        distribution_date__date=today
    ).aggregate(
        total_weight=Sum('packaging_units__weight')
    )['total_weight'] or 0
    
    # Bisherige Ausgaben diesen Monat abrufen
    monthly_consumption = ProductDistribution.objects.filter(
        recipient_id=recipient_id,
        distribution_date__date__gte=month_start,
        distribution_date__date__lte=today
    ).aggregate(
        total_weight=Sum('packaging_units__weight')
    )['total_weight'] or 0
    
    # Gewicht der ausgewählten Einheiten berechnen
    selected_weight = 0
    thc_violations = []
    
    for unit_data in selected_units:
        unit_id = unit_data.get('id')
        try:
            unit = PackagingUnit.objects.select_related(
                'batch__lab_testing_batch'
            ).get(id=unit_id)
            
            unit_weight = float(unit.weight)
            selected_weight += unit_weight
            
            # THC-Prüfung für U21
            if is_u21 and unit.batch and unit.batch.lab_testing_batch:
                thc_content = unit.batch.lab_testing_batch.thc_content
                if thc_content and float(thc_content) > max_thc_percentage:
                    thc_violations.append({
                        'unit_id': unit_id,
                        'unit_number': unit.batch_number,
                        'thc_content': float(thc_content),
                        'strain': unit.batch.source_strain
                    })
                    
        except PackagingUnit.DoesNotExist:
            continue
    
    # Neue Gesamtwerte berechnen
    new_daily_total = float(daily_consumption) + selected_weight
    new_monthly_total = float(monthly_consumption) + selected_weight
    
    # Validierungsergebnis
    validation_result = {
        'recipient': {
            'id': str(recipient.id),
            'name': f"{recipient.first_name} {recipient.last_name}",
            'age_class': age_class,
            'age': recipient.age
        },
        'limits': {
            'daily_limit': daily_limit,
            'monthly_limit': monthly_limit,
            'max_thc_percentage': max_thc_percentage
        },
        'consumption': {
            'daily_consumed': float(daily_consumption),
            'monthly_consumed': float(monthly_consumption),
            'selected_weight': selected_weight,
            'new_daily_total': new_daily_total,
            'new_monthly_total': new_monthly_total
        },
        'remaining': {
            'daily_remaining': daily_limit - new_daily_total,
            'monthly_remaining': monthly_limit - new_monthly_total
        },
        'violations': {
            'exceeds_daily_limit': new_daily_total > daily_limit,
            'exceeds_monthly_limit': new_monthly_total > monthly_limit,
            'thc_violations': thc_violations
        },
        'is_valid': (
            new_daily_total <= daily_limit and 
            new_monthly_total <= monthly_limit and 
            len(thc_violations) == 0
        )
    }
    
    return Response(validation_result)