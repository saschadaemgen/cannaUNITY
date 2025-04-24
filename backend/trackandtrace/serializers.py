from rest_framework import serializers
from .models import (
    SeedPurchase, MotherPlantBatch, MotherPlant, 
    FloweringPlantBatch, FloweringPlant
)
from members.models import Member
from rooms.models import Room

class MemberSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Member
        fields = ['id', 'uuid', 'display_name']
    
    def get_display_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'name']

class SeedPurchaseSerializer(serializers.ModelSerializer):
    # Serializers für Mitglieder und Räume
    member = MemberSerializer(read_only=True)
    member_id = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(), 
        source='member',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    room = RoomSerializer(read_only=True)
    room_id = serializers.PrimaryKeyRelatedField(
        queryset=Room.objects.all(), 
        source='room',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    # Serializer für das Mitglied, das vernichtet hat
    destroyed_by = MemberSerializer(read_only=True)
    destroyed_by_id = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(), 
        source='destroyed_by',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    # Referenz zum Originalsamen für teilweise vernichtete Samen
    original_seed = serializers.PrimaryKeyRelatedField(read_only=True)
    
    # Abgeleitete Felder für Pflanzenanzahl
    mother_plant_count = serializers.SerializerMethodField()
    flowering_plant_count = serializers.SerializerMethodField()
    
    class Meta:
        model = SeedPurchase
        fields = [
            'id', 'batch_number', 'strain_name', 'quantity', 'remaining_quantity',
            'is_destroyed', 'destroy_reason', 'destroyed_at', 'created_at',
            'member', 'member_id', 'room', 'room_id', 'destroyed_by', 'destroyed_by_id',
            'original_seed', 'mother_plant_count', 'flowering_plant_count', 
            'destroyed_quantity'
        ]
    
    def get_mother_plant_count(self, obj):
        # Zähle die Mutterpflanzen für diesen Samen
        count = 0
        for batch in obj.mother_batches.all():
            count += batch.plants.filter(is_destroyed=False).count()
        return count
    
    def get_flowering_plant_count(self, obj):
        # Zähle die Blühpflanzen für diesen Samen
        count = 0
        for batch in obj.flowering_batches.all():
            count += batch.plants.filter(is_destroyed=False).count()
        return count

class MotherPlantSerializer(serializers.ModelSerializer):
    # Serializer für das Mitglied, das vernichtet hat
    destroyed_by = MemberSerializer(read_only=True)
    destroyed_by_id = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(), 
        source='destroyed_by',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    # Entfernen der SerializerMethodField für batch_number
    # batch_number = serializers.SerializerMethodField()
    
    class Meta:
        model = MotherPlant
        fields = [
            'id', 'batch_number', 'notes', 'is_destroyed', 'destroy_reason', 
            'destroyed_at', 'created_at', 'destroyed_by', 'destroyed_by_id'
        ]

class MotherPlantBatchSerializer(serializers.ModelSerializer):
    # Serializers für Mitglieder und Räume
    member = MemberSerializer(read_only=True)
    member_id = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(), 
        source='member',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    room = RoomSerializer(read_only=True)
    room_id = serializers.PrimaryKeyRelatedField(
        queryset=Room.objects.all(), 
        source='room',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    # Abgeleitete Felder für Stamm und Ursprungs-Batch-Nummer
    seed_strain = serializers.SerializerMethodField()
    seed_batch_number = serializers.SerializerMethodField()
    
    # Abgeleitete Felder für aktive und vernichtete Pflanzen
    active_plants_count = serializers.SerializerMethodField()
    destroyed_plants_count = serializers.SerializerMethodField()
    
    class Meta:
        model = MotherPlantBatch
        fields = [
            'id', 'batch_number', 'seed_purchase', 'quantity', 'notes',
            'created_at', 'member', 'member_id', 'room', 'room_id',
            'seed_strain', 'seed_batch_number', 'active_plants_count', 'destroyed_plants_count'
        ]
    
    def get_seed_strain(self, obj):
        return obj.seed_purchase.strain_name if obj.seed_purchase else None
    
    def get_seed_batch_number(self, obj):
        return obj.seed_purchase.batch_number if obj.seed_purchase else None
    
    def get_active_plants_count(self, obj):
        return obj.plants.filter(is_destroyed=False).count()
    
    def get_destroyed_plants_count(self, obj):
        return obj.plants.filter(is_destroyed=True).count()

class FloweringPlantSerializer(serializers.ModelSerializer):
    # Serializer für das Mitglied, das vernichtet hat
    destroyed_by = MemberSerializer(read_only=True)
    destroyed_by_id = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(), 
        source='destroyed_by',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    # Entfernen der SerializerMethodField für batch_number
    # batch_number = serializers.SerializerMethodField()
    
    class Meta:
        model = FloweringPlant
        fields = [
            'id', 'batch_number', 'notes', 'is_destroyed', 'destroy_reason', 
            'destroyed_at', 'created_at', 'destroyed_by', 'destroyed_by_id'
        ]

class FloweringPlantBatchSerializer(serializers.ModelSerializer):
    # Serializers für Mitglieder und Räume
    member = MemberSerializer(read_only=True)
    member_id = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(), 
        source='member',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    room = RoomSerializer(read_only=True)
    room_id = serializers.PrimaryKeyRelatedField(
        queryset=Room.objects.all(), 
        source='room',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    # Abgeleitete Felder für Stamm und Ursprungs-Batch-Nummer
    seed_strain = serializers.SerializerMethodField()
    seed_batch_number = serializers.SerializerMethodField()
    
    # Abgeleitete Felder für aktive und vernichtete Pflanzen
    active_plants_count = serializers.SerializerMethodField()
    destroyed_plants_count = serializers.SerializerMethodField()
    
    class Meta:
        model = FloweringPlantBatch
        fields = [
            'id', 'batch_number', 'seed_purchase', 'quantity', 'notes',
            'created_at', 'member', 'member_id', 'room', 'room_id',
            'seed_strain', 'seed_batch_number', 'active_plants_count', 'destroyed_plants_count'
        ]
    
    def get_seed_strain(self, obj):
        return obj.seed_purchase.strain_name if obj.seed_purchase else None
    
    def get_seed_batch_number(self, obj):
        return obj.seed_purchase.batch_number if obj.seed_purchase else None
    
    def get_active_plants_count(self, obj):
        return obj.plants.filter(is_destroyed=False).count()
    
    def get_destroyed_plants_count(self, obj):
        return obj.plants.filter(is_destroyed=True).count()