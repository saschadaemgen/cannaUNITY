# wawi/api_views.py
from rest_framework import viewsets, status, pagination
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from django.db import models
from django.utils import timezone
from django.db.models import Q, Sum, Count
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from trackandtrace.models import SeedPurchase, MotherPlantBatch, FloweringPlantBatch
import os
import uuid
import json

from .models import (
    CannabisStrain, 
    StrainImage, 
    StrainInventory, 
    StrainHistory,
    StrainPriceTier
)
from .serializers import (
    CannabisStrainSerializer, 
    StrainImageSerializer, 
    StrainInventorySerializer, 
    StrainHistorySerializer,
    StrainPriceTierSerializer
)

class StandardResultsSetPagination(pagination.PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class CannabisStrainViewSet(viewsets.ModelViewSet):
    queryset = CannabisStrain.objects.all().order_by('-created_at')
    serializer_class = CannabisStrainSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = CannabisStrain.objects.all().order_by('-created_at')
        
        # Filter by active/inactive
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active)
        
        # Filter by strain type
        strain_type = self.request.query_params.get('strain_type', None)
        if strain_type:
            queryset = queryset.filter(strain_type=strain_type)
        
        # Filter by THC content (min)
        thc_min = self.request.query_params.get('thc_min', None)
        if thc_min:
            queryset = queryset.filter(thc_percentage_max__gte=thc_min)
        
        # Filter by CBD content (min)
        cbd_min = self.request.query_params.get('cbd_min', None)
        if cbd_min:
            queryset = queryset.filter(cbd_percentage_max__gte=cbd_min)
        
        # Search by name, breeder, or genetic origin
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(breeder__icontains=search) |
                Q(genetic_origin__icontains=search)
            )
        
        # Filter by date range
        year = self.request.query_params.get('year', None)
        month = self.request.query_params.get('month', None)
        day = self.request.query_params.get('day', None)
        
        if year:
            queryset = queryset.filter(created_at__year=year)
        if month:
            queryset = queryset.filter(created_at__month=month)
        if day:
            queryset = queryset.filter(created_at__day=day)
        
        return queryset
    
    def perform_create(self, serializer):
        # Create a new strain
        strain = serializer.save()
        
        # Create default inventory for this strain
        StrainInventory.objects.create(
            strain=strain,
            total_quantity=0,
            available_quantity=0
        )
        
        # History-Eintrag erstellen
        member_id = self.request.data.get('member_id')
        if member_id:
            StrainHistory.objects.create(
                strain=strain,
                member_id=member_id,
                action='created'
            )
        
        # Verarbeite alle temporär gespeicherten Bilder für diese Strain
        temp_id = self.request.data.get('temp_id', None)
        if temp_id:
            self._process_pending_images(strain, temp_id)
    
    def perform_update(self, serializer):
        # Original-Objekt vor Änderungen abrufen (als Referenz)
        original_strain = self.get_object()
        original_data = CannabisStrainSerializer(original_strain).data
        
        # Aktualisierten Strain speichern
        strain = serializer.save()
        
        # Neue Daten nach der Speicherung
        updated_data = CannabisStrainSerializer(strain).data
        
        # Änderungen ermitteln - nur geänderte Felder sammeln
        changes = {}
        for field, new_value in updated_data.items():
            # Felder ignorieren, die nicht relevant sind
            if field in ['updated_at', 'created_at', 'id', 'images']:
                continue
                
            # Prüfen, ob ein Wert geändert wurde (mit Sonderbehandlung für None/Empty)
            if field in original_data:
                old_value = original_data[field]
                # Vergleich mit spezieller Behandlung für None/leere Werte
                if ((old_value is None and new_value) or 
                    (new_value is None and old_value) or
                    (old_value != new_value)):
                    # Änderung gefunden
                    changes[field] = {
                        'old': old_value,
                        'new': new_value
                    }
        
        # History-Eintrag erstellen, nur wenn es tatsächlich Änderungen gab
        if changes:
            member_id = self.request.data.get('member_id')
            if member_id:
                StrainHistory.objects.create(
                    strain=strain,
                    member_id=member_id,
                    action='updated',
                    changes=changes  # Speichern der detaillierten Änderungen
                )
        else:
            # Debug-Ausgabe, wenn keine Änderungen gefunden wurden
            print("Keine Änderungen gefunden bei der Aktualisierung von Strain:", strain.id)
    
    def _process_pending_images(self, strain, temp_id):
        """Verarbeite temporäre Bilder und verknüpfe sie mit der neuen Strain"""
        temp_dir = f"temp_strain_images/{temp_id}/"
        
        # Überprüfe, ob es temporäre Bilder für diese ID gibt
        if default_storage.exists(temp_dir):
            try:
                # Liste alle Dateien im temporären Verzeichnis auf
                _, temp_files = default_storage.listdir(temp_dir)
                
                for file_name in temp_files:
                    # Ignoriere Metadaten-Dateien für diesen Durchlauf
                    if file_name.endswith('.json'):
                        continue
                    
                    # Lese Metadaten aus der JSON-Datei, falls vorhanden
                    metadata_name = f"{os.path.splitext(file_name)[0]}.json"
                    caption = None
                    is_primary = False
                    
                    metadata_path = f"{temp_dir}{metadata_name}"
                    if default_storage.exists(metadata_path):
                        try:
                            with default_storage.open(metadata_path) as f:
                                metadata = json.loads(f.read().decode('utf-8'))
                                caption = metadata.get('caption')
                                is_primary = metadata.get('is_primary', False)
                        except Exception as e:
                            print(f"Fehler beim Lesen der Metadaten: {e}")
                    
                    # Erstelle das StrainImage-Objekt mit dem Bild
                    try:
                        # Lese das temporäre Bild
                        with default_storage.open(f"{temp_dir}{file_name}") as f:
                            content = f.read()
                            
                            # Speichere es im endgültigen Upload-Verzeichnis
                            upload_path = f"strain_images/{timezone.now().strftime('%Y/%m/')}{file_name}"
                            saved_path = default_storage.save(upload_path, ContentFile(content))
                            
                            # Erstelle das StrainImage-Objekt
                            StrainImage.objects.create(
                                strain=strain,
                                image=saved_path,
                                caption=caption,
                                is_primary=is_primary
                            )
                            
                        # Lösche die temporäre Datei
                        default_storage.delete(f"{temp_dir}{file_name}")
                        if default_storage.exists(metadata_path):
                            default_storage.delete(metadata_path)
                            
                    except Exception as e:
                        print(f"Fehler bei der Verarbeitung des Bildes {file_name}: {e}")
                
                # Versuche, das leere Temp-Verzeichnis zu löschen
                try:
                    default_storage.delete(temp_dir)
                except:
                    pass
                    
            except Exception as e:
                print(f"Fehler bei der Verarbeitung temporärer Bilder: {e}")
    
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_image(self, request, pk=None):
        """Upload an image for a strain"""
        strain = self.get_object()
        
        # Parse request data
        serializer = StrainImageSerializer(data=request.data)
        
        if serializer.is_valid():
            # If marked as primary, unmark other images
            is_primary = request.data.get('is_primary') == 'true'
            if is_primary:
                StrainImage.objects.filter(strain=strain, is_primary=True).update(is_primary=False)
                serializer.validated_data['is_primary'] = True
            
            # Save the image
            image = serializer.save(strain=strain)
            
            # Bild-Upload in Historie erfassen, falls member_id vorhanden
            member_id = request.data.get('member_id')
            if member_id:
                # Bilddetails für den Verlauf speichern
                image_data = {
                    'operation': 'upload',
                    'image_id': str(image.id),
                    'filename': os.path.basename(image.image.name),
                    'is_primary': is_primary,
                    'caption': image.caption
                }
                
                StrainHistory.objects.create(
                    strain=strain,
                    member_id=member_id,
                    action='image_uploaded',
                    image_data=image_data  # Speichere die Bilddaten im JSONField
                )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_temp_image(self, request):
        """
        Lädt ein Bild temporär hoch, bevor eine Strain erstellt wurde.
        Diese Bilder werden später mit der Strain verknüpft.
        """
        if 'image' not in request.FILES:
            return Response({"error": "Kein Bild gefunden"}, status=status.HTTP_400_BAD_REQUEST)
        
        image_file = request.FILES['image']
        caption = request.data.get('caption', '')
        is_primary = request.data.get('is_primary', 'false').lower() == 'true'
        temp_id = request.data.get('temp_id')
        
        if not temp_id:
            return Response({"error": "Keine temporäre ID angegeben"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Eindeutigen Dateinamen generieren
        file_name = f"{uuid.uuid4()}{os.path.splitext(image_file.name)[1]}"
        
        # Verzeichnis für temporäre Bilder
        temp_dir = f"temp_strain_images/{temp_id}/"
        
        try:
            # Stelle sicher, dass das Verzeichnis existiert
            os.makedirs(default_storage.path(temp_dir), exist_ok=True)
            
            # Bild speichern
            file_path = f"{temp_dir}{file_name}"
            saved_path = default_storage.save(file_path, ContentFile(image_file.read()))
            
            # Metadaten speichern
            metadata = {
                'caption': caption,
                'is_primary': is_primary,
                'original_filename': image_file.name
            }
            
            metadata_path = f"{temp_dir}{os.path.splitext(file_name)[0]}.json"
            default_storage.save(metadata_path, ContentFile(json.dumps(metadata).encode('utf-8')))
            
            # Erstelle eine URL für die Vorschau
            image_url = default_storage.url(saved_path)
            
            return Response({
                'id': os.path.splitext(file_name)[0],
                'image': image_url,
                'caption': caption,
                'is_primary': is_primary
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({"error": f"Fehler beim Speichern des Bildes: {str(e)}"}, 
                           status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['delete'])
    def delete_temp_image(self, request):
        """Löscht ein temporär hochgeladenes Bild"""
        temp_id = request.query_params.get('temp_id')
        image_id = request.query_params.get('image_id')
        
        if not temp_id or not image_id:
            return Response({"error": "Temporäre ID und Bild-ID sind erforderlich"}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Pfade zu Bild und Metadaten
        temp_dir = f"temp_strain_images/{temp_id}/"
        
        # Durchsuche das Verzeichnis nach Dateien mit der angegebenen ID
        try:
            _, files = default_storage.listdir(temp_dir)
            
            for file in files:
                if file.startswith(image_id):
                    file_path = f"{temp_dir}{file}"
                    default_storage.delete(file_path)
            
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            return Response({"error": f"Fehler beim Löschen des temporären Bildes: {str(e)}"}, 
                           status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['delete'])
    def remove_image(self, request, pk=None):
        """Remove an image from a strain"""
        strain = self.get_object()
        image_id = request.query_params.get('image_id', None)
        
        if not image_id:
            return Response({"error": "image_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            image = StrainImage.objects.get(id=image_id, strain=strain)
            
            # Bildinformationen vor dem Löschen erfassen
            image_info = {
                'image_id': str(image.id),
                'filename': os.path.basename(image.image.name),
                'is_primary': image.is_primary,
                'caption': image.caption
            }
            
            # Bild löschen
            image.delete()
            
            # Bild-Entfernung in Historie erfassen, falls member_id vorhanden
            member_id = request.query_params.get('member_id')
            if member_id:
                # Bilddetails für den Verlauf speichern
                image_data = {
                    'operation': 'remove',
                    **image_info
                }
                
                StrainHistory.objects.create(
                    strain=strain,
                    member_id=member_id,
                    action='image_removed',
                    image_data=image_data  # Speichere die Bilddaten im JSONField
                )
            
            return Response(status=status.HTTP_204_NO_CONTENT)
        except StrainImage.DoesNotExist:
            return Response({"error": "Image not found"}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def update_inventory(self, request, pk=None):
        """Update inventory for a strain"""
        strain = self.get_object()
        
        # Get or create inventory
        inventory, created = StrainInventory.objects.get_or_create(strain=strain)
        
        # Parse request data
        serializer = StrainInventorySerializer(inventory, data=request.data, partial=True)
        
        if serializer.is_valid():
            # Set last_restocked if quantity changed
            if 'total_quantity' in serializer.validated_data or 'available_quantity' in serializer.validated_data:
                serializer.validated_data['last_restocked'] = timezone.now()
            
            serializer.save()
            
            # Bestandsänderung in Historie erfassen, falls member_id vorhanden
            member_id = request.data.get('member_id')
            if member_id:
                StrainHistory.objects.create(
                    strain=strain,
                    member_id=member_id,
                    action='inventory_updated'
                )
            
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def terpenes(self, request):
        """Get list of all terpenes used in strains"""
        all_terpenes = set()
        
        # Get all strains with terpenes
        strains_with_terpenes = CannabisStrain.objects.filter(dominant_terpenes__isnull=False).values_list('dominant_terpenes', flat=True)
        
        # Extract and collect all terpenes
        for terpene_string in strains_with_terpenes:
            if terpene_string:
                terpenes = [t.strip() for t in terpene_string.split(',')]
                all_terpenes.update(terpenes)
        
        return Response(sorted(list(all_terpenes)))
    
    @action(detail=False, methods=['get'])
    def flavors(self, request):
        """Get list of all flavors used in strains"""
        all_flavors = set()
        
        # Get all strains with flavors
        strains_with_flavors = CannabisStrain.objects.filter(flavors__isnull=False).values_list('flavors', flat=True)
        
        # Extract and collect all flavors
        for flavor_string in strains_with_flavors:
            if flavor_string:
                flavors = [f.strip() for f in flavor_string.split(',')]
                all_flavors.update(flavors)
        
        return Response(sorted(list(all_flavors)))
    
    @action(detail=False, methods=['get'])
    def effects(self, request):
        """Get list of all effects used in strains"""
        all_effects = set()
        
        # Get all strains with effects
        strains_with_effects = CannabisStrain.objects.filter(effects__isnull=False).values_list('effects', flat=True)
        
        # Extract and collect all effects
        for effect_string in strains_with_effects:
            if effect_string:
                effects = [e.strip() for e in effect_string.split(',')]
                all_effects.update(effects)
        
        return Response(sorted(list(all_effects)))
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get stats about strains"""
        active_count = CannabisStrain.objects.filter(is_active=True).count()
        inactive_count = CannabisStrain.objects.filter(is_active=False).count()
        
        # Count by type
        strain_types = {}
        for strain_type, _ in CannabisStrain.STRAIN_TYPE_CHOICES:
            strain_types[strain_type] = CannabisStrain.objects.filter(strain_type=strain_type).count()
        
        # Average THC/CBD
        avg_thc_max = CannabisStrain.objects.aggregate(avg=models.Avg('thc_percentage_max'))['avg'] or 0
        avg_cbd_max = CannabisStrain.objects.aggregate(avg=models.Avg('cbd_percentage_max'))['avg'] or 0
        
        # Total in inventory
        total_inventory = StrainInventory.objects.aggregate(
            total=models.Sum('total_quantity'),
            available=models.Sum('available_quantity')
        )
        
        return Response({
            'active_count': active_count,
            'inactive_count': inactive_count,
            'strain_types': strain_types,
            'avg_thc_max': round(avg_thc_max, 2),
            'avg_cbd_max': round(avg_cbd_max, 2),
            'total_inventory': total_inventory['total'] or 0,
            'available_inventory': total_inventory['available'] or 0
        })
    
    @action(detail=True, methods=['patch'])
    def update_image_caption(self, request, pk=None):
        """Update the caption of an image"""
        strain = self.get_object()
        image_id = request.data.get('image_id')
        caption = request.data.get('caption')
        
        if not image_id:
            return Response({"error": "image_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            image = StrainImage.objects.get(id=image_id, strain=strain)
            
            # Ursprüngliche Beschriftung speichern
            old_caption = image.caption
            
            # Caption aktualisieren
            image.caption = caption
            image.save()
            
            # Caption-Änderung in Historie erfassen, falls member_id vorhanden
            member_id = request.data.get('member_id')
            if member_id:
                # Bilddetails für den Verlauf speichern
                image_data = {
                    'operation': 'update_caption',
                    'image_id': str(image.id),
                    'filename': os.path.basename(image.image.name),
                    'old_caption': old_caption,
                    'new_caption': caption
                }
                
                StrainHistory.objects.create(
                    strain=strain,
                    member_id=member_id,
                    action='image_caption_updated',
                    image_data=image_data  # Speichere die Bilddaten im JSONField
                )
            
            serializer = StrainImageSerializer(image)
            return Response(serializer.data)
        except StrainImage.DoesNotExist:
            return Response({"error": "Image not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['patch'])
    def set_primary_image(self, request, pk=None):
        """Set an image as the primary image for a strain"""
        strain = self.get_object()
        image_id = request.data.get('image_id')
        
        if not image_id:
            return Response({"error": "image_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Aktuelles primäres Bild identifizieren
            old_primary = StrainImage.objects.filter(strain=strain, is_primary=True).first()
            old_primary_id = str(old_primary.id) if old_primary else None
            
            # Zunächst alle als nicht-primär markieren
            StrainImage.objects.filter(strain=strain).update(is_primary=False)
            
            # Dann das ausgewählte Bild als primär markieren
            image = StrainImage.objects.get(id=image_id, strain=strain)
            image.is_primary = True
            image.save()
            
            # Primärbild-Änderung in Historie erfassen, falls member_id vorhanden
            member_id = request.data.get('member_id')
            if member_id:
                # Bilddetails für den Verlauf speichern
                image_data = {
                    'operation': 'set_primary',
                    'old_primary_image_id': old_primary_id,
                    'new_primary_image_id': str(image.id),
                    'new_primary_filename': os.path.basename(image.image.name)
                }
                
                StrainHistory.objects.create(
                    strain=strain,
                    member_id=member_id,
                    action='primary_image_changed',
                    image_data=image_data  # Speichere die Bilddaten im JSONField
                )
            
            return Response({"success": True})
        except StrainImage.DoesNotExist:
            return Response({"error": "Image not found"}, status=status.HTTP_404_NOT_FOUND)
            
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Gibt die Änderungshistorie einer Cannabis-Sorte zurück"""
        strain = self.get_object()
        history = StrainHistory.objects.filter(strain=strain).order_by('-timestamp')
        
        # Pagination implementieren
        page = self.paginate_queryset(history)
        if page is not None:
            serializer = StrainHistorySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = StrainHistorySerializer(history, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get', 'post'])
    def price_tiers(self, request, pk=None):
        """Verwaltet Preisstaffeln einer Sorte"""
        strain = self.get_object()
        
        if request.method == 'GET':
            tiers = strain.price_tiers.all()
            serializer = StrainPriceTierSerializer(tiers, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Wenn es die erste Preisstaffel ist, automatisch als Standard setzen
            if not strain.price_tiers.exists():
                request.data['is_default'] = True
            
            serializer = StrainPriceTierSerializer(data=request.data)
            if serializer.is_valid():
                # Wenn als Standard markiert, andere zurücksetzen
                if request.data.get('is_default'):
                    strain.price_tiers.update(is_default=False)
                
                serializer.save(strain=strain)
                
                # History-Eintrag
                member_id = request.data.get('member_id')
                if member_id:
                    StrainHistory.objects.create(
                        strain=strain,
                        member_id=member_id,
                        action='updated',
                        changes={'price_tier_added': {
                            'tier_name': serializer.data.get('tier_name'),
                            'quantity': serializer.data.get('quantity'),
                            'price': str(serializer.data.get('total_price'))
                        }}
                    )
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch', 'delete'], url_path='price_tiers/(?P<tier_id>[^/.]+)')
    def manage_price_tier(self, request, pk=None, tier_id=None):
        """Aktualisiert oder löscht eine einzelne Preisstaffel"""
        strain = self.get_object()
        
        try:
            tier = strain.price_tiers.get(id=tier_id)
        except StrainPriceTier.DoesNotExist:
            return Response(
                {'error': 'Preisstaffel nicht gefunden'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if request.method == 'PATCH':
            serializer = StrainPriceTierSerializer(tier, data=request.data, partial=True)
            if serializer.is_valid():
                # Wenn als Standard markiert, andere zurücksetzen
                if request.data.get('is_default'):
                    strain.price_tiers.exclude(id=tier_id).update(is_default=False)
                
                serializer.save()
                
                # History-Eintrag
                member_id = request.data.get('member_id')
                if member_id:
                    StrainHistory.objects.create(
                        strain=strain,
                        member_id=member_id,
                        action='updated',
                        changes={'price_tier_updated': {
                            'tier_id': str(tier_id),
                            'updates': request.data
                        }}
                    )
                
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            # Verhindere Löschen, wenn es die einzige Preisstaffel ist
            if strain.price_tiers.count() <= 1:
                return Response(
                    {'error': 'Die letzte Preisstaffel kann nicht gelöscht werden'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Wenn es der Standard war, setze eine andere als Standard
            if tier.is_default:
                other_tier = strain.price_tiers.exclude(id=tier_id).first()
                if other_tier:
                    other_tier.is_default = True
                    other_tier.save()
            
            tier_data = {
                'tier_name': tier.tier_name,
                'quantity': tier.quantity,
                'price': str(tier.total_price)
            }
            
            tier.delete()
            
            # History-Eintrag
            member_id = request.query_params.get('member_id')
            if member_id:
                StrainHistory.objects.create(
                    strain=strain,
                    member_id=member_id,
                    action='updated',
                    changes={'price_tier_deleted': tier_data}
                )
            
            return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['get'])
    def track_and_trace_stats(self, request, pk=None):
        """
        Gibt aggregierte Statistiken aus dem Track and Trace System für eine Cannabis-Sorte zurück.
        """
        strain = self.get_object()
        
        # Alle Samenkäufe für diese Sorte
        seed_purchases = SeedPurchase.objects.filter(strain=strain)
        
        # Gesamtstatistiken
        total_purchased = seed_purchases.aggregate(
            total=Sum('quantity')
        )['total'] or 0
        
        total_available = seed_purchases.filter(is_destroyed=False).aggregate(
            total=Sum('remaining_quantity')
        )['total'] or 0
        
        # Anzahl der Einkäufe (Chargen)
        purchase_count = seed_purchases.count()
        
        # Berechne die Anzahl der zu Mutterpflanzen konvertierten Samen
        mother_plants_count = 0
        for purchase in seed_purchases:
            # Zähle alle Mutterpflanzen-Batches für diesen Einkauf
            mother_batches = MotherPlantBatch.objects.filter(seed_purchase=purchase)
            for batch in mother_batches:
                mother_plants_count += batch.quantity
        
        # Berechne die Anzahl der zu Blühpflanzen konvertierten Samen
        flowering_plants_count = 0
        for purchase in seed_purchases:
            # Zähle alle Blühpflanzen-Batches für diesen Einkauf
            flowering_batches = FloweringPlantBatch.objects.filter(seed_purchase=purchase)
            for batch in flowering_batches:
                flowering_plants_count += batch.quantity
        
        # Detaillierte Einkaufsliste
        purchase_details = []
        for purchase in seed_purchases.order_by('-created_at'):
            # Berechne für jeden Einkauf die Konvertierungen
            mother_count = MotherPlantBatch.objects.filter(
                seed_purchase=purchase
            ).aggregate(total=Sum('quantity'))['total'] or 0
            
            flowering_count = FloweringPlantBatch.objects.filter(
                seed_purchase=purchase
            ).aggregate(total=Sum('quantity'))['total'] or 0
            
            purchase_details.append({
                'id': str(purchase.id),
                'batch_number': purchase.batch_number,
                'quantity': purchase.quantity,
                'remaining_quantity': purchase.remaining_quantity,
                'destroyed_quantity': purchase.destroyed_quantity,
                'is_destroyed': purchase.is_destroyed,
                'created_at': purchase.created_at,
                'member': f"{purchase.member.first_name} {purchase.member.last_name}" if purchase.member else None,
                'mother_plants_created': mother_count,
                'flowering_plants_created': flowering_count
            })
        
        return Response({
            'total_purchased': total_purchased,
            'total_available': total_available,
            'mother_plants_count': mother_plants_count,
            'flowering_plants_count': flowering_plants_count,
            'purchase_count': purchase_count,
            'purchase_details': purchase_details
        })