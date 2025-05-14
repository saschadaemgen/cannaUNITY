from rest_framework import viewsets, status, pagination
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import models
from django.db.models import Q
from .models import (
    SeedPurchase, MotherPlantBatch, MotherPlant, 
    FloweringPlantBatch, FloweringPlant, Cutting, CuttingBatch,
    BloomingCuttingBatch, BloomingCuttingPlant, HarvestBatch, 
    DryingBatch, ProcessingBatch, LabTestingBatch, PackagingBatch, PackagingUnit
)
from .serializers import (
    SeedPurchaseSerializer, MotherPlantBatchSerializer, 
    MotherPlantSerializer, FloweringPlantBatchSerializer,
    FloweringPlantSerializer, CuttingBatchSerializer, CuttingSerializer,
    BloomingCuttingBatchSerializer, BloomingCuttingPlantSerializer, 
    HarvestBatchSerializer, DryingBatchSerializer, ProcessingBatchSerializer,
    LabTestingBatchSerializer, PackagingBatchSerializer, PackagingUnitSerializer
)

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
        Konvertiert eine freigegebene Laborkontrolle zu mehreren Verpackungen.
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
                    
                    # Erstelle die Verpackung für diese Linie
                    packaging = PackagingBatch.objects.create(
                        lab_testing_batch=lab_batch,
                        total_weight=total_line_weight,
                        unit_count=unit_count,
                        unit_weight=unit_weight,
                        member_id=member_id,
                        room_id=room_id,
                        notes=f"{notes} - Zeile {idx+1} von {len(packagings)}: {unit_count}× {unit_weight}g"
                    )
                    
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
                PackagingBatch.objects.create(
                    lab_testing_batch=lab_batch,
                    total_weight=remaining_weight,
                    unit_count=1,
                    unit_weight=remaining_weight,
                    member_id=member_id,
                    room_id=room_id,
                    notes=f"Restmenge aus der Verpackung von {lab_batch.batch_number}. Automatisch zur Vernichtung markiert.",
                    is_destroyed=True,
                    destroy_reason=f"Automatische Vernichtung der Restmenge bei Verpackung von {lab_batch.batch_number}",
                    destroyed_at=timezone.now(),
                    destroyed_by_id=member_id
                )
            
            # Erfolgsmeldung mit Zusammenfassung
            return Response({
                "message": f"{len(created_packagings)} Verpackungsbatches mit insgesamt {total_weight_used}g wurden erstellt",
                "packagings": [PackagingBatchSerializer(pkg).data for pkg in created_packagings]
            })
            
        else:
            # Fallback für Einzelverpackung (bestehender Code, leicht angepasst)
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
                
            # Erstelle die Einzelverpackung
            packaging = PackagingBatch.objects.create(
                lab_testing_batch=lab_batch,
                total_weight=total_weight,
                unit_count=unit_count,
                unit_weight=unit_weight,
                member_id=member_id,
                room_id=room_id,
                notes=notes
            )

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
            return Response(
                {"error": "Ein Vernichtungsgrund ist erforderlich"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not destroyed_by_id:
            return Response(
                {"error": "Ein verantwortliches Mitglied muss angegeben werden"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        unit.is_destroyed = True
        unit.destroy_reason = reason
        unit.destroyed_at = timezone.now()
        unit.destroyed_by_id = destroyed_by_id
        unit.save()
        
        return Response({
            "message": f"Verpackungseinheit {unit.batch_number} wurde vernichtet"
        })