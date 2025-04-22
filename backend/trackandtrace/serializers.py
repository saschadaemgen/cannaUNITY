from rest_framework import serializers
from .models import (
    SeedPurchase, MotherPlantBatch, MotherPlant, 
    FloweringPlantBatch, FloweringPlant
)

class SeedPurchaseSerializer(serializers.ModelSerializer):
    mother_plant_count = serializers.SerializerMethodField()
    flowering_plant_count = serializers.SerializerMethodField()
    original_seed_info = serializers.SerializerMethodField()
    
    class Meta:
        model = SeedPurchase
        fields = [
            'id', 'strain_name', 'quantity', 'remaining_quantity', 
            'mother_plant_count', 'flowering_plant_count', 
            'created_at', 'updated_at', 'is_destroyed', 'destroy_reason', 'destroyed_at',
            'original_seed', 'original_seed_info'
        ]
    
    def get_mother_plant_count(self, obj):
        return sum(batch.quantity for batch in obj.mother_batches.all())
    
    def get_flowering_plant_count(self, obj):
        return sum(batch.quantity for batch in obj.flowering_batches.all())
    
    def get_original_seed_info(self, obj):
        """Liefert Informationen über den Originalsamen, falls vorhanden"""
        if obj.original_seed and obj.original_seed.id != obj.id:
            return {
                'id': str(obj.original_seed.id),
                'strain_name': obj.original_seed.strain_name,
                'is_destroyed': obj.original_seed.is_destroyed
            }
        return None
    
    # Diese Methode formatiert die Ausgabe, ohne die Eingabe zu beeinflussen
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # Datum formatieren, wenn vorhanden
        if representation.get('created_at'):
            representation['created_at'] = instance.created_at.strftime("%d.%m.%Y %H:%M:%S")
        
        # Andere Datums-Felder könnten auch formatiert werden
        if representation.get('updated_at'):
            representation['updated_at'] = instance.updated_at.strftime("%d.%m.%Y %H:%M:%S")
        
        if representation.get('destroyed_at') and instance.destroyed_at:
            representation['destroyed_at'] = instance.destroyed_at.strftime("%d.%m.%Y %H:%M:%S")
        
        return representation

class MotherPlantSerializer(serializers.ModelSerializer):
    class Meta:
        model = MotherPlant
        fields = [
            'id', 'notes', 'created_at', 'updated_at', 
            'is_destroyed', 'destroy_reason', 'destroyed_at'
        ]

class MotherPlantBatchSerializer(serializers.ModelSerializer):
    seed_strain = serializers.CharField(source='seed_purchase.strain_name', read_only=True)
    plants = MotherPlantSerializer(many=True, read_only=True)
    active_plants_count = serializers.SerializerMethodField()
    destroyed_plants_count = serializers.SerializerMethodField()
    
    class Meta:
        model = MotherPlantBatch
        fields = [
            'id', 'seed_purchase', 'seed_strain', 'quantity', 
            'notes', 'plants', 'created_at', 'updated_at',
            'active_plants_count', 'destroyed_plants_count'
        ]
    
    def get_active_plants_count(self, obj):
        return obj.plants.filter(is_destroyed=False).count()
    
    def get_destroyed_plants_count(self, obj):
        return obj.plants.filter(is_destroyed=True).count()

class FloweringPlantSerializer(serializers.ModelSerializer):
    class Meta:
        model = FloweringPlant
        fields = [
            'id', 'notes', 'created_at', 'updated_at', 
            'is_destroyed', 'destroy_reason', 'destroyed_at'
        ]

class FloweringPlantBatchSerializer(serializers.ModelSerializer):
    seed_strain = serializers.CharField(source='seed_purchase.strain_name', read_only=True)
    plants = FloweringPlantSerializer(many=True, read_only=True)
    active_plants_count = serializers.SerializerMethodField()
    destroyed_plants_count = serializers.SerializerMethodField()
    
    class Meta:
        model = FloweringPlantBatch
        fields = [
            'id', 'seed_purchase', 'seed_strain', 'quantity', 
            'notes', 'plants', 'created_at', 'updated_at',
            'active_plants_count', 'destroyed_plants_count'
        ]
    
    def get_active_plants_count(self, obj):
        return obj.plants.filter(is_destroyed=False).count()
    
    def get_destroyed_plants_count(self, obj):
        return obj.plants.filter(is_destroyed=True).count()