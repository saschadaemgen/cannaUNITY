# trackandtrace/serializers.py
from rest_framework import serializers
from .models import SeedPurchase, MotherPlant, Cutting, FloweringPlant, Harvest, Drying, Processing
from members.models import Member
from rooms.models import Room

class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ['id', 'first_name', 'last_name']

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'name', 'description']

class SeedPurchaseSerializer(serializers.ModelSerializer):
    responsible_member_details = MemberSerializer(source='responsible_member', read_only=True)
    destroying_member_details = MemberSerializer(source='destroying_member', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    
    class Meta:
        model = SeedPurchase
        fields = [
            'uuid', 'batch_number', 'manufacturer', 'genetics', 
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
            'room', 'room_details'
        ]
        read_only_fields = [
            'uuid', 'batch_number', 'created_at', 'updated_at', 
            'remaining_cuttings', 'growth_phase_display'
        ]


class FloweringPlantSerializer(serializers.ModelSerializer):
    seed_source_details = SeedPurchaseSerializer(source='seed_source', read_only=True)
    cutting_source_details = CuttingSerializer(source='cutting_source', read_only=True)
    responsible_member_details = MemberSerializer(source='responsible_member', read_only=True)
    destroying_member_details = MemberSerializer(source='destroying_member', read_only=True)
    transferring_member_details = MemberSerializer(source='transferring_member', read_only=True)
    growth_phase_display = serializers.CharField(source='get_growth_phase_display', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    
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
            'room', 'room_details'
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