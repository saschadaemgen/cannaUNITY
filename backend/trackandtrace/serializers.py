# trackandtrace/serializers.py
from rest_framework import serializers
from .models import SeedPurchase, MotherPlant, Cutting, FloweringPlant, Harvest, Drying, Processing, LabTesting, Packaging, ProductDistribution, Manufacturer, Strain, IndividualCutting, IndividualFloweringPlant
from members.models import Member
from rooms.models import Room
from members.serializers import MemberSerializer
from rooms.serializers import RoomSerializer 

class IndividualFloweringPlantSerializer(serializers.ModelSerializer):
    destroying_member_details = MemberSerializer(source='destroying_member', read_only=True)
    responsible_member_details = MemberSerializer(source='responsible_member', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    
    class Meta:
        model = IndividualFloweringPlant
        fields = [
            'uuid', 'batch_number', 'parent', 
            'is_destroyed', 'destruction_reason', 'destruction_date',
            'destroying_member', 'destroying_member_details',
            'responsible_member', 'responsible_member_details',
            'room', 'room_details',
            'created_at', 'updated_at',
            'genetic_name', 'planting_date', 'growth_phase', 'notes', 'is_active'
        ]
        read_only_fields = ['uuid', 'batch_number', 'created_at', 'updated_at']


class IndividualCuttingSerializer(serializers.ModelSerializer):
    destroying_member_details = MemberSerializer(source='destroying_member', read_only=True)
    responsible_member_details = MemberSerializer(source='responsible_member', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    
    class Meta:
        model = IndividualCutting
        fields = [
            'uuid', 'batch_number', 'parent', 
            'is_destroyed', 'destruction_reason', 'destruction_date',
            'destroying_member', 'destroying_member_details',
            'responsible_member', 'responsible_member_details',
            'room', 'room_details',
            'created_at', 'updated_at',
            'genetic_name', 'cutting_date', 'growth_phase', 'growth_medium', 
            'rooting_agent', 'light_cycle', 'notes', 'is_active'
        ]
        read_only_fields = ['uuid', 'batch_number', 'created_at', 'updated_at']

class ManufacturerSerializer(serializers.ModelSerializer):
    """Serializer für das Manufacturer-Modell mit allen Feldern"""
    class Meta:
        model = Manufacturer
        fields = [
            'id', 'name', 'website', 'country', 
            'contact_person', 'email', 'phone', 'order_history',
            # Neue Felder
            'address', 'contact_email', 'delivery_time',
            'notes', 'created_at', 'updated_at'
        ]
        

class StrainSerializer(serializers.ModelSerializer):
    manufacturer_details = ManufacturerSerializer(source='manufacturer', read_only=True)
    
    class Meta:
        model = Strain
        fields = [
            'id', 'manufacturer', 'manufacturer_details',
            'strain_name', 'strain_type', 'genetics', 
            'sativa_percentage', 'indica_percentage',
            'thc_value', 'cbd_value', 'flowering_time',
            'height_indoor', 'height_outdoor',
            'yield_indoor', 'yield_outdoor',
            'effect', 'flavor', 'growing_tips',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, data):
        """Validierung für Sativa/Indica-Prozentsätze"""
        sativa = data.get('sativa_percentage', 0)
        indica = data.get('indica_percentage', 0)
        
        if 'sativa_percentage' in data and 'indica_percentage' in data:
            if sativa + indica != 100:
                raise serializers.ValidationError(
                    "Sativa- und Indica-Prozentsatz müssen zusammen 100% ergeben."
                )
        elif 'sativa_percentage' in data:
            data['indica_percentage'] = 100 - sativa
        elif 'indica_percentage' in data:
            data['sativa_percentage'] = 100 - indica
        
        return data
    

class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ['id', 'first_name', 'last_name']


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'name', 'description']


# Anpassung des SeedPurchaseSerializer
class SeedPurchaseSerializer(serializers.ModelSerializer):
    responsible_member_details = MemberSerializer(source='responsible_member', read_only=True)
    destroying_member_details = MemberSerializer(source='destroying_member', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    
    # Diese Felder entfernen oder auskommentieren:
    # manufacturer_details = ManufacturerSerializer(source='manufacturer', read_only=True)
    # strain_details = StrainSerializer(source='strain', read_only=True)
    
    class Meta:
        model = SeedPurchase
        fields = [
            'uuid', 'batch_number', 
            'manufacturer',  # behalte dies als string-feld
            # 'manufacturer_details', 'manufacturer_name', # auskommentieren
            # 'strain', 'strain_details', # auskommentieren
            'genetics', 
            'strain_name', 'sativa_percentage', 'indica_percentage',
            'thc_value', 'cbd_value', 'purchase_date', 'total_seeds',
            'remaining_seeds', 'notes', 'is_destroyed', 
            'destruction_reason', 'destruction_date', 'destroying_member', 
            'destroying_member_details', 'temperature', 
            'humidity', 'image', 'document', 'created_at', 'updated_at',
            'responsible_member', 'responsible_member_details',
            'room', 'room_details'
        ]
        read_only_fields = ['uuid', 'batch_number', 'created_at', 'updated_at', 'remaining_seeds']


class MotherPlantSerializer(serializers.ModelSerializer):
    seed_source_details = SeedPurchaseSerializer(source='seed_source', read_only=True)
    responsible_member_details = MemberSerializer(source='responsible_member', read_only=True)
    destroying_member_details = MemberSerializer(source='destroying_member', read_only=True)
    growth_phase_display = serializers.CharField(source='get_growth_phase_display', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    
    class Meta:
        model = MotherPlant
        fields = [
            'uuid', 'batch_number', 'seed_source', 'seed_source_details',
            'planting_date', 'genetic_name', 'plant_count', 'remaining_plants',
            'growth_phase', 'growth_phase_display', 'growth_medium', 'fertilizer', 
            'light_cycle', 'image', 'notes', 'is_destroyed', 
            'destruction_reason', 'destruction_date', 'destroying_member',
            'destroying_member_details', 'temperature', 
            'humidity', 'created_at', 'updated_at',
            'responsible_member', 'responsible_member_details',
            'room', 'room_details'
        ]
        read_only_fields = [
            'uuid', 'batch_number', 'created_at', 'updated_at', 
            'remaining_plants', 'growth_phase_display'
        ]

class CuttingSerializer(serializers.ModelSerializer):
    mother_plant_source_details = MotherPlantSerializer(source='mother_plant_source', read_only=True)
    responsible_member_details = MemberSerializer(source='responsible_member', read_only=True)
    destroying_member_details = MemberSerializer(source='destroying_member', read_only=True)
    growth_phase_display = serializers.CharField(source='get_growth_phase_display', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    
    # Statt alle individuellen Stecklinge zu laden, nur die Anzahl zurückgeben
    individuals_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Cutting
        fields = [
            'uuid', 'batch_number', 'mother_plant_source', 'mother_plant_source_details',
            'cutting_date', 'genetic_name', 'cutting_count', 'remaining_cuttings',
            'growth_phase', 'growth_phase_display', 'growth_medium', 'rooting_agent', 
            'light_cycle', 'image', 'notes', 'is_destroyed', 
            'destruction_reason', 'destruction_date', 'destroying_member',
            'destroying_member_details', 'temperature', 
            'humidity', 'created_at', 'updated_at',
            'responsible_member', 'responsible_member_details',
            'room', 'room_details',
            'individuals_count'  # Ersetzt 'individuals'
        ]
        read_only_fields = [
            'uuid', 'batch_number', 'created_at', 'updated_at', 
            'remaining_cuttings', 'growth_phase_display'
        ]
    
    def get_individuals_count(self, obj):
        """Gibt die Anzahl der individuellen Stecklinge zurück statt der vollständigen Daten"""
        return obj.individual_cuttings.count()
    

class FloweringPlantSerializer(serializers.ModelSerializer):
    seed_source_details = SeedPurchaseSerializer(source='seed_source', read_only=True)
    cutting_source_details = CuttingSerializer(source='cutting_source', read_only=True)
    responsible_member_details = MemberSerializer(source='responsible_member', read_only=True)
    destroying_member_details = MemberSerializer(source='destroying_member', read_only=True)
    transferring_member_details = MemberSerializer(source='transferring_member', read_only=True)
    growth_phase_display = serializers.CharField(source='get_growth_phase_display', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    
    # Individuelle Pflanzen hinzufügen
    individuals = IndividualFloweringPlantSerializer(source='individual_plants', many=True, read_only=True)
    
    class Meta:
        model = FloweringPlant
        fields = [
            'uuid', 'batch_number', 
            'seed_source', 'seed_source_details',
            'cutting_source', 'cutting_source_details',
            'planting_date', 'genetic_name', 'plant_count', 'remaining_plants',
            'growth_phase', 'growth_phase_display', 'growth_medium', 'fertilizer', 
            'light_cycle', 'expected_harvest_date', 'image', 
            'notes', 
            'is_destroyed', 'destruction_reason', 'destruction_date', 
            'destroying_member', 'destroying_member_details',
            'is_transferred', 'transfer_date', 
            'transferring_member', 'transferring_member_details',
            'temperature', 'humidity', 'created_at', 'updated_at',
            'responsible_member', 'responsible_member_details',
            'room', 'room_details',
            'individuals'  # Neue Feld hinzufügen
        ]
        read_only_fields = [
            'uuid', 'batch_number', 'created_at', 'updated_at', 
            'remaining_plants', 'growth_phase_display',
            'is_transferred', 'transfer_date', 'transferring_member'
        ]


class HarvestSerializer(serializers.ModelSerializer):
    flowering_plant_source_details = FloweringPlantSerializer(source='flowering_plant_source', read_only=True)
    responsible_member_details = MemberSerializer(source='responsible_member', read_only=True)
    destroying_member_details = MemberSerializer(source='destroying_member', read_only=True)
    transferring_member_details = MemberSerializer(source='transferring_member', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    
    class Meta:
        model = Harvest
        fields = [
            'uuid', 'batch_number', 
            'flowering_plant_source', 'flowering_plant_source_details',
            'harvest_date', 'genetic_name', 'plant_count', 
            'fresh_weight', 'remaining_fresh_weight',
            'flower_weight', 'leaf_weight', 'stem_weight',
            'harvest_method', 'expected_drying_date', 'image',
            'notes', 
            'is_destroyed', 'destruction_reason', 'destruction_date', 
            'destroying_member', 'destroying_member_details',
            'is_transferred', 'transfer_date', 
            'transferring_member', 'transferring_member_details',
            'temperature', 'humidity', 'created_at', 'updated_at',
            'responsible_member', 'responsible_member_details',
            'room', 'room_details'
        ]
        read_only_fields = [
            'uuid', 'batch_number', 'created_at', 'updated_at', 
            'remaining_fresh_weight',
            'is_transferred', 'transfer_date', 'transferring_member'
        ]


class DryingSerializer(serializers.ModelSerializer):
    harvest_source_details = HarvestSerializer(source='harvest_source', read_only=True)
    responsible_member_details = MemberSerializer(source='responsible_member', read_only=True)
    destroying_member_details = MemberSerializer(source='destroying_member', read_only=True)
    transferring_member_details = MemberSerializer(source='transferring_member', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    
    class Meta:
        model = Drying
        fields = [
            'uuid', 'batch_number', 
            'harvest_source', 'harvest_source_details',
            'drying_start_date', 'drying_end_date', 'genetic_name', 
            'fresh_weight', 'dried_weight', 'remaining_dried_weight',
            'drying_method', 'target_humidity', 'target_temperature', 'image',
            'notes', 
            'is_destroyed', 'destruction_reason', 'destruction_date', 
            'destroying_member', 'destroying_member_details',
            'is_transferred', 'transfer_date', 
            'transferring_member', 'transferring_member_details',
            'temperature', 'humidity', 'created_at', 'updated_at',
            'responsible_member', 'responsible_member_details',
            'room', 'room_details'
        ]
        read_only_fields = [
            'uuid', 'batch_number', 'created_at', 'updated_at', 
            'remaining_dried_weight',
            'is_transferred', 'transfer_date', 'transferring_member'
        ]

class ProcessingSerializer(serializers.ModelSerializer):
    drying_source_details = DryingSerializer(source='drying_source', read_only=True)
    responsible_member_details = MemberSerializer(source='responsible_member', read_only=True)
    destroying_member_details = MemberSerializer(source='destroying_member', read_only=True)
    transferring_member_details = MemberSerializer(source='transferring_member', read_only=True)
    product_type_display = serializers.CharField(source='get_product_type_display', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    
    class Meta:
        model = Processing
        fields = [
            'uuid', 'batch_number', 
            'drying_source', 'drying_source_details',
            'processing_date', 'genetic_name', 
            'input_weight', 'remaining_weight',
            'processing_method', 'product_type', 'product_type_display',
            'flower_weight', 'trim_weight', 'waste_weight',
            'potency_estimate', 'expected_lab_date', 'image',
            'notes', 
            'is_destroyed', 'destruction_reason', 'destruction_date', 
            'destroying_member', 'destroying_member_details',
            'transfer_status', 'is_transferred', 'transfer_date', 'last_transfer_date',
            'transferring_member', 'transferring_member_details',
            'temperature', 'humidity', 'created_at', 'updated_at',
            'responsible_member', 'responsible_member_details',
            'room', 'room_details'
        ]
        read_only_fields = [
            'uuid', 'batch_number', 'created_at', 'updated_at', 
            'remaining_weight', 'product_type_display',
            'transfer_status', 'is_transferred', 'transfer_date', 'last_transfer_date',
            'transferring_member'
        ]


# LabTesting Serializer für serializers.py
class LabTestingSerializer(serializers.ModelSerializer):
    processing_source_details = ProcessingSerializer(source='processing_source', read_only=True)
    responsible_member_details = MemberSerializer(source='responsible_member', read_only=True)
    destroying_member_details = MemberSerializer(source='destroying_member', read_only=True)
    transferring_member_details = MemberSerializer(source='transferring_member', read_only=True)
    test_status_display = serializers.CharField(source='get_test_status_display', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    approval_status = serializers.SerializerMethodField()
    
    class Meta:
        model = LabTesting
        fields = [
            'uuid', 'batch_number', 
            'processing_source', 'processing_source_details',
            'sample_date', 'test_date', 'genetic_name',
            'test_status', 'test_status_display',
            'sample_weight', 'remaining_weight',
            'thc_content', 'cbd_content', 'moisture_content',
            'contaminants_check', 'pesticides_check', 
            'microbes_check', 'heavy_metals_check',
            'lab_name', 'test_method', 'notes_from_lab', 'lab_report',
            'is_approved', 'approval_date', 'approval_status',
            'notes', 
            'is_destroyed', 'destruction_reason', 'destruction_date', 
            'destroying_member', 'destroying_member_details',
            'transfer_status', 'is_transferred', 'transfer_date', 'last_transfer_date',
            'transferring_member', 'transferring_member_details',
            'temperature', 'humidity', 'created_at', 'updated_at',
            'responsible_member', 'responsible_member_details',
            'room', 'room_details'
        ]
        read_only_fields = [
            'uuid', 'batch_number', 'created_at', 'updated_at', 
            'approval_status', 'test_status_display',
            'transfer_status', 'is_transferred', 'transfer_date', 'last_transfer_date',
            'transferring_member'
        ]
    
    def get_approval_status(self, obj):
        """Gibt einen lesbaren Status der Freigabe zurück"""
        return obj.get_approval_status_display()
    

class PackagingSerializer(serializers.ModelSerializer):
    lab_testing_source_details = LabTestingSerializer(source='lab_testing_source', read_only=True)
    responsible_member_details = MemberSerializer(source='responsible_member', read_only=True)
    destroying_member_details = MemberSerializer(source='destroying_member', read_only=True)
    transferring_member_details = MemberSerializer(source='transferring_member', read_only=True)
    packaging_type_display = serializers.CharField(source='get_packaging_type_display', read_only=True)
    product_type_display = serializers.CharField(source='get_product_type_display', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    
    class Meta:
        model = Packaging
        fields = [
            'uuid', 'batch_number', 
            'lab_testing_source', 'lab_testing_source_details',
            'packaging_date', 'genetic_name',
            'input_weight', 'remaining_weight',
            'packaging_type', 'packaging_type_display',
            'product_type', 'product_type_display',
            'package_count', 'unit_weight',
            'packaging_material', 'is_quality_checked', 
            'quality_check_date', 'quality_check_notes',
            'has_labels', 'label_details', 'label_image',
            'shelf_life', 'storage_conditions', 'expiry_date',
            'notes', 
            'is_destroyed', 'destruction_reason', 'destruction_date', 
            'destroying_member', 'destroying_member_details',
            'transfer_status', 'is_transferred', 'transfer_date', 'last_transfer_date',
            'transferring_member', 'transferring_member_details',
            'temperature', 'humidity', 'created_at', 'updated_at',
            'responsible_member', 'responsible_member_details',
            'room', 'room_details'
        ]
        read_only_fields = [
            'uuid', 'batch_number', 'created_at', 'updated_at', 
            'packaging_type_display', 'product_type_display',
            'transfer_status', 'is_transferred', 'transfer_date', 'last_transfer_date',
            'transferring_member'
        ]


class ProductDistributionSerializer(serializers.ModelSerializer):
    packaging_source_details = PackagingSerializer(source='packaging_source', read_only=True)
    responsible_member_details = MemberSerializer(source='responsible_member', read_only=True)
    receiving_member_details = MemberSerializer(source='receiving_member', read_only=True)
    destroying_member_details = MemberSerializer(source='destroying_member', read_only=True)
    transferring_member_details = MemberSerializer(source='transferring_member', read_only=True)
    distribution_type_display = serializers.CharField(source='get_distribution_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    
    class Meta:
        model = ProductDistribution
        fields = [
            'uuid', 'batch_number', 
            'packaging_source', 'packaging_source_details',
            'distribution_date', 'genetic_name',
            'responsible_member', 'responsible_member_details',
            'receiving_member', 'receiving_member_details',
            'quantity', 'remaining_quantity',
            'package_count',
            'distribution_type', 'distribution_type_display',
            'price_per_unit', 'total_price', 'is_paid',
            'payment_method', 'payment_date',
            'status', 'status_display',
            'is_confirmed', 'confirmation_date', 'recipient_signature',
            'tracking_number', 'distribution_document',
            'notes', 
            'is_destroyed', 'destruction_reason', 'destruction_date', 
            'destroying_member', 'destroying_member_details',
            'transfer_status', 'is_transferred', 'transfer_date', 'last_transfer_date',
            'transferring_member', 'transferring_member_details',
            'temperature', 'humidity', 'created_at', 'updated_at',
            'room', 'room_details'
        ]
        read_only_fields = [
            'uuid', 'batch_number', 'created_at', 'updated_at', 
            'distribution_type_display', 'status_display',
            'transfer_status', 'is_transferred', 'transfer_date', 'last_transfer_date',
            'transferring_member', 'remaining_quantity'
        ]