# wawi/serializers.py
from rest_framework import serializers
from django.db import models
from .models import (
    CannabisStrain, 
    StrainImage, 
    StrainInventory, 
    StrainHistory,
    StrainPriceTier,
    StrainPurchaseHistory
)
from members.models import Member
from members.serializers import MemberSerializer

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


class StrainPurchaseHistorySerializer(serializers.ModelSerializer):
    purchased_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = StrainPurchaseHistory
        fields = [
            'id', 'purchase_date', 'quantity', 'total_cost',
            'supplier', 'invoice_number', 'notes', 
            'purchased_by', 'purchased_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_purchased_by_name(self, obj):
        if obj.purchased_by:
            return f"{obj.purchased_by.first_name} {obj.purchased_by.last_name}"
        return None


class StrainPriceTierSerializer(serializers.ModelSerializer):
    unit_price = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )
    discount_percentage = serializers.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        read_only=True
    )
    purchased_seeds = serializers.IntegerField(read_only=True)
    flowering_plants = serializers.IntegerField(read_only=True)
    mother_plants = serializers.IntegerField(read_only=True)
    available_seeds = serializers.IntegerField(read_only=True)
    
    # Für Frontend-Kompatibilität
    totalPurchasedQuantity = serializers.SerializerMethodField()
    floweringPlants = serializers.SerializerMethodField()
    motherPlants = serializers.SerializerMethodField()
    purchaseHistory = serializers.SerializerMethodField()
    
    class Meta:
        model = StrainPriceTier
        fields = [
            'id', 'tier_name', 'quantity', 'total_price', 'is_default',
            'unit_price', 'discount_percentage', 'purchased_seeds',
            'flowering_plants', 'mother_plants', 'available_seeds',
            'created_at', 'updated_at',
            # Frontend-kompatible Felder
            'totalPurchasedQuantity', 'floweringPlants', 'motherPlants',
            'purchaseHistory'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_totalPurchasedQuantity(self, obj):
        """Anzahl der eingekauften Packungen"""
        return obj.purchase_history.aggregate(
            total=models.Sum('quantity')
        )['total'] or 0
    
    def get_floweringPlants(self, obj):
        return obj.flowering_plants
    
    def get_motherPlants(self, obj):
        return obj.mother_plants
    
    def get_purchaseHistory(self, obj):
        """Letzte 3 Einkäufe für die Anzeige"""
        recent_purchases = obj.purchase_history.all()[:3]
        return [{
            'date': purchase.purchase_date.strftime('%d.%m.%Y'),
            'quantity': purchase.quantity
        } for purchase in recent_purchases]


class CannabisStrainSerializer(serializers.ModelSerializer):
    # Temporäre ID für Bildverarbeitung
    temp_id = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
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
    
    # Neue Felder für Preisstaffeln
    price_tiers = StrainPriceTierSerializer(many=True, read_only=True)
    lowest_unit_price = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )
    default_price_display = serializers.CharField(read_only=True)
    
    # Berechnung des Sativa-Prozentsatzes
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
            'is_active', 'created_at', 'updated_at',
            'temp_id',
            # Neue Preis-Felder
            'price_tiers', 'lowest_unit_price', 'default_price_display'
        ]
        read_only_fields = ['id', 'batch_number', 'created_at', 'updated_at']


class StrainHistorySerializer(serializers.ModelSerializer):
    member_name = serializers.SerializerMethodField()
    action_display = serializers.SerializerMethodField()
    timestamp_formatted = serializers.SerializerMethodField()
    changes_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = StrainHistory
        fields = [
            'id', 'member', 'member_name', 'action', 'action_display', 
            'timestamp', 'timestamp_formatted', 'changes', 'image_data', 
            'changes_formatted'
        ]
    
    def get_member_name(self, obj):
        if obj.member:
            return f"{obj.member.first_name} {obj.member.last_name}"
        return None
    
    def get_action_display(self, obj):
        return obj.get_action_display()
    
    def get_timestamp_formatted(self, obj):
        return obj.timestamp.strftime('%d.%m.%Y %H:%M')
    
    def get_changes_formatted(self, obj):
        """
        Formatiert die Änderungen in ein benutzerfreundliches Format.
        """
        if not obj.changes:
            return None
            
        try:
            # Mapping für Feldnamen zu benutzerfreundlichen Bezeichnungen
            field_name_mapping = {
                'name': 'Sortenname',
                'breeder': 'Hersteller/Züchter',
                'strain_type': 'Samentyp',
                'indica_percentage': 'Indica-Anteil (%)',
                'genetic_origin': 'Genetische Herkunft',
                'flowering_time_min': 'Blütezeit Minimum (Tage)',
                'flowering_time_max': 'Blütezeit Maximum (Tage)',
                'height_indoor_min': 'Höhe Indoor Minimum (cm)',
                'height_indoor_max': 'Höhe Indoor Maximum (cm)',
                'height_outdoor_min': 'Höhe Outdoor Minimum (cm)',
                'height_outdoor_max': 'Höhe Outdoor Maximum (cm)',
                'yield_indoor_min': 'Ertrag Indoor Minimum (g/m²)',
                'yield_indoor_max': 'Ertrag Indoor Maximum (g/m²)',
                'yield_outdoor_min': 'Ertrag Outdoor Minimum (g/Pflanze)',
                'yield_outdoor_max': 'Ertrag Outdoor Maximum (g/Pflanze)',
                'difficulty': 'Schwierigkeitsgrad',
                'thc_percentage_min': 'THC-Gehalt Minimum (%)',
                'thc_percentage_max': 'THC-Gehalt Maximum (%)',
                'cbd_percentage_min': 'CBD-Gehalt Minimum (%)',
                'cbd_percentage_max': 'CBD-Gehalt Maximum (%)',
                'dominant_terpenes': 'Dominante Terpene',
                'flavors': 'Geschmacksrichtungen',
                'effects': 'Effekte/Wirkungen',
                'general_information': 'Allgemeine Informationen',
                'growing_information': 'Anbauspezifische Informationen',
                'suitable_climate': 'Geeignetes Klima',
                'growing_method': 'Anbaumethode',
                'resistance_mold': 'Schimmelresistenz',
                'resistance_pests': 'Schädlingsresistenz',
                'resistance_cold': 'Kälteresistenz',
                'awards': 'Auszeichnungen',
                'release_year': 'Jahr der Markteinführung',
                'rating': 'Bewertung',
                'price_per_seed': 'Preis pro Samen (€)',
                'seeds_per_pack': 'Anzahl Samen pro Packung',
                'is_active': 'Aktiv',
                # Neue Preis-bezogene Änderungen
                'price_tier_added': 'Preisstaffel hinzugefügt',
                'price_tier_updated': 'Preisstaffel aktualisiert',
                'price_tier_deleted': 'Preisstaffel gelöscht',
                'purchase_added': 'Einkauf hinzugefügt'
            }
            
            # Mapping für Auswahlfeldwerte
            strain_type_mapping = {
                'feminized': 'Feminisiert',
                'regular': 'Regulär',
                'autoflower': 'Autoflower',
                'f1_hybrid': 'F1 Hybrid',
                'cbd': 'CBD-Samen'
            }
            
            difficulty_mapping = {
                'beginner': 'Anfänger',
                'intermediate': 'Mittel',
                'advanced': 'Fortgeschritten',
                'expert': 'Experte'
            }
            
            climate_mapping = {
                'indoor': 'Indoor',
                'outdoor': 'Outdoor',
                'greenhouse': 'Gewächshaus',
                'all': 'Alle'
            }
            
            growing_method_mapping = {
                'soil': 'Erde',
                'hydro': 'Hydrokultur',
                'coco': 'Kokos',
                'all': 'Alle'
            }
            
            # Boolean-Werte formatieren
            boolean_mapping = {
                True: 'Ja',
                False: 'Nein'
            }
            
            # Ergebnisdictionary initialisieren
            formatted_changes = {}
            
            # Jede Änderung verarbeiten
            for field, change in obj.changes.items():
                # Sonderbehandlung für Preis-bezogene Änderungen
                if field in ['price_tier_added', 'price_tier_updated', 'price_tier_deleted', 'purchase_added']:
                    formatted_changes[field_name_mapping.get(field, field)] = change
                    continue
                
                # Sicherstellen, dass change ein Dictionary ist
                if not isinstance(change, dict):
                    continue
                
                # Feldnamen formatieren
                field_display = field_name_mapping.get(field, field)
                
                # Alten und neuen Wert extrahieren mit Fehlerbehandlung
                old_value = change.get('old', None)
                new_value = change.get('new', None)
                
                # Spezialformatierung für bestimmte Feldtypen
                if field == 'strain_type':
                    old_value = strain_type_mapping.get(str(old_value), old_value) if old_value is not None else None
                    new_value = strain_type_mapping.get(str(new_value), new_value) if new_value is not None else None
                elif field == 'difficulty':
                    old_value = difficulty_mapping.get(str(old_value), old_value) if old_value is not None else None
                    new_value = difficulty_mapping.get(str(new_value), new_value) if new_value is not None else None
                elif field == 'suitable_climate':
                    old_value = climate_mapping.get(str(old_value), old_value) if old_value is not None else None
                    new_value = climate_mapping.get(str(new_value), new_value) if new_value is not None else None
                elif field == 'growing_method':
                    old_value = growing_method_mapping.get(str(old_value), old_value) if old_value is not None else None
                    new_value = growing_method_mapping.get(str(new_value), new_value) if new_value is not None else None
                elif field == 'is_active':
                    old_value = boolean_mapping.get(old_value, old_value) if old_value is not None else None
                    new_value = boolean_mapping.get(new_value, new_value) if new_value is not None else None
                elif field == 'indica_percentage':
                    old_value = f"{old_value}% Indica / {100 - old_value}% Sativa" if old_value is not None else None
                    new_value = f"{new_value}% Indica / {100 - new_value}% Sativa" if new_value is not None else None
                elif field == 'rating':
                    old_value = f"{old_value} Sterne" if old_value is not None else None
                    new_value = f"{new_value} Sterne" if new_value is not None else None
                elif field == 'price_per_seed':
                    old_value = f"{old_value}€" if old_value is not None else None
                    new_value = f"{new_value}€" if new_value is not None else None
                
                # Listen-Werte formatieren (kommaseparierte Strings)
                elif field in ['dominant_terpenes', 'flavors', 'effects']:
                    if old_value and isinstance(old_value, str):
                        old_value = ", ".join([item.strip() for item in old_value.split(',')])
                    if new_value and isinstance(new_value, str):
                        new_value = ", ".join([item.strip() for item in new_value.split(',')])
                
                # Formatiertes Ergebnis hinzufügen
                formatted_changes[field_display] = {
                    'alt': old_value,
                    'neu': new_value
                }
                
            return formatted_changes
            
        except Exception as e:
            # Fehlerbehandlung für unerwartete Formate
            return {'Fehler': str(e)}