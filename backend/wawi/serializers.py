# wawi/serializers.py (korrigierte Version)
from rest_framework import serializers
from .models import CannabisStrain, StrainImage, StrainInventory
from members.models import Member
from members.serializers import MemberSerializer  # Importiere den existierenden Serializer

class StrainImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = StrainImage
        fields = ['id', 'image', 'is_primary', 'caption', 'created_at']
        read_only_fields = ['id', 'created_at']


class StrainInventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = StrainInventory
        fields = ['total_quantity', 'available_quantity', 'last_restocked']
        read_only_fields = ['last_restocked']


class CannabisStrainSerializer(serializers.ModelSerializer):
    # Serializer für Mitglieder
    member = MemberSerializer(read_only=True)
    member_id = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(), 
        source='member',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    # Nested Serializers für Bilder und Bestand
    images = StrainImageSerializer(many=True, read_only=True)
    inventory = StrainInventorySerializer(read_only=True)
    
    # Berechnung des Sativa-Prozentsatzes - HIER IST DIE KORREKTUR:
    # source entfernt, da es redundant ist
    sativa_percentage = serializers.IntegerField(read_only=True)
    
    # Einfachere Felder für Listen (aus dem Frontend als komma-separierte Strings)
    dominant_terpenes_list = serializers.SerializerMethodField()
    flavors_list = serializers.SerializerMethodField()
    effects_list = serializers.SerializerMethodField()
    
    # Methoden zur Konvertierung der kommaseparierten Listen
    def get_dominant_terpenes_list(self, obj):
        if not obj.dominant_terpenes:
            return []
        return [terpene.strip() for terpene in obj.dominant_terpenes.split(',')]
    
    def get_flavors_list(self, obj):
        if not obj.flavors:
            return []
        return [flavor.strip() for flavor in obj.flavors.split(',')]
    
    def get_effects_list(self, obj):
        if not obj.effects:
            return []
        return [effect.strip() for effect in obj.effects.split(',')]
    
    # Human-readable Werte für die Auswahl-Felder
    strain_type_display = serializers.CharField(source='get_strain_type_display', read_only=True)
    difficulty_display = serializers.CharField(source='get_difficulty_display', read_only=True)
    suitable_climate_display = serializers.CharField(source='get_suitable_climate_display', read_only=True)
    growing_method_display = serializers.CharField(source='get_growing_method_display', read_only=True)
    
    class Meta:
        model = CannabisStrain
        fields = [
            'id', 'name', 'breeder', 'batch_number',
            'strain_type', 'strain_type_display',
            'indica_percentage', 'sativa_percentage',
            'genetic_origin',
            'flowering_time_min', 'flowering_time_max',
            'height_indoor_min', 'height_indoor_max',
            'height_outdoor_min', 'height_outdoor_max',
            'yield_indoor_min', 'yield_indoor_max',
            'yield_outdoor_min', 'yield_outdoor_max',
            'difficulty', 'difficulty_display',
            'thc_percentage_min', 'thc_percentage_max',
            'cbd_percentage_min', 'cbd_percentage_max',
            'dominant_terpenes', 'dominant_terpenes_list',
            'flavors', 'flavors_list',
            'effects', 'effects_list',
            'general_information', 'growing_information',
            'suitable_climate', 'suitable_climate_display',
            'growing_method', 'growing_method_display',
            'resistance_mold', 'resistance_pests', 'resistance_cold',
            'awards', 'release_year', 'rating',
            'price_per_seed', 'seeds_per_pack',
            'member', 'member_id',
            'images', 'inventory',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'batch_number', 'created_at', 'updated_at']