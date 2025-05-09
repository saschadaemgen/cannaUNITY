# wawi/api_views.py
from rest_framework import viewsets, status, pagination
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from django.db import models
from django.utils import timezone
from django.db.models import Q

from .models import CannabisStrain, StrainImage, StrainInventory
from .serializers import CannabisStrainSerializer, StrainImageSerializer, StrainInventorySerializer

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
    
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_image(self, request, pk=None):
        """Upload an image for a strain"""
        strain = self.get_object()
        
        # Parse request data
        serializer = StrainImageSerializer(data=request.data)
        
        if serializer.is_valid():
            # If marked as primary, unmark other images
            if request.data.get('is_primary') == 'true':
                StrainImage.objects.filter(strain=strain, is_primary=True).update(is_primary=False)
                serializer.validated_data['is_primary'] = True
            
            # Save the image
            serializer.save(strain=strain)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
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
            
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'])
    def remove_image(self, request, pk=None):
        """Remove an image from a strain"""
        strain = self.get_object()
        image_id = request.query_params.get('image_id', None)
        
        if not image_id:
            return Response({"error": "image_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            image = StrainImage.objects.get(id=image_id, strain=strain)
            image.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except StrainImage.DoesNotExist:
            return Response({"error": "Image not found"}, status=status.HTTP_404_NOT_FOUND)
    
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