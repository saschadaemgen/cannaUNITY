from rest_framework import serializers
from .models import (
    SeedPurchase, MotherPlantBatch, MotherPlant, 
    FloweringPlantBatch, FloweringPlant, Cutting, CuttingBatch,
    BloomingCuttingBatch, BloomingCuttingPlant, HarvestBatch,
    DryingBatch, ProcessingBatch, PRODUCT_TYPE_CHOICES, LabTestingBatch, 
    PackagingBatch, PackagingUnit
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
    
    # Neues abgeleitetes Feld für die Anzahl der erstellten Stecklinge
    converted_to_cuttings_count = serializers.SerializerMethodField()
    
    class Meta:
        model = MotherPlantBatch
        fields = [
            'id', 'batch_number', 'seed_purchase', 'quantity', 'notes',
            'created_at', 'member', 'member_id', 'room', 'room_id',
            'seed_strain', 'seed_batch_number', 'active_plants_count', 
            'destroyed_plants_count', 'converted_to_cuttings_count'
        ]
    
    def get_seed_strain(self, obj):
        return obj.seed_purchase.strain_name if obj.seed_purchase else None
    
    def get_seed_batch_number(self, obj):
        return obj.seed_purchase.batch_number if obj.seed_purchase else None
    
    def get_active_plants_count(self, obj):
        return obj.plants.filter(is_destroyed=False).count()
    
    def get_destroyed_plants_count(self, obj):
        return obj.plants.filter(is_destroyed=True).count()
    
    def get_converted_to_cuttings_count(self, obj):
        """Berechnet die Anzahl der aus diesem Batch erstellten Stecklinge."""
        count = 0
        cutting_batches = CuttingBatch.objects.filter(mother_batch=obj)
        for batch in cutting_batches:
            count += batch.quantity
        return count

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

class CuttingSerializer(serializers.ModelSerializer):
    # Serializer für das Mitglied, das vernichtet hat
    destroyed_by = MemberSerializer(read_only=True)
    destroyed_by_id = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(), 
        source='destroyed_by',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    # Serializer für das Mitglied, das konvertiert hat
    converted_by = MemberSerializer(read_only=True)
    converted_by_id = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(),
        source='converted_by',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    # Hinzufügen eines Feldes für die Blühpflanzen-Batch-ID
    converted_to = serializers.SerializerMethodField()
    
    class Meta:
        model = Cutting
        fields = [
            'id', 'batch_number', 'notes', 'is_destroyed', 'destroy_reason', 
            'destroyed_at', 'created_at', 'destroyed_by', 'destroyed_by_id',
            'converted_to', 'converted_at', 'converted_by', 'converted_by_id'
        ]
    
    def get_converted_to(self, obj):
        """
        Extrahiert die Blühpflanzen-Batch-ID aus dem destroy_reason, wenn der Steckling
        zu einer Blühpflanze konvertiert wurde
        """
        # Wenn das Feld direkt in der Datenbank gespeichert ist, verwende es
        if hasattr(obj, 'converted_to') and obj.converted_to:
            return str(obj.converted_to)
            
        # Ansonsten versuche, die Batch-ID aus dem destroy_reason zu extrahieren
        if obj.is_destroyed and obj.destroy_reason and "Zu Blühpflanze konvertiert" in obj.destroy_reason:
            # Versuche, die Batch-ID aus dem String zu extrahieren
            import re
            match = re.search(r'Charge: (.+?)(\)|\s|$)', obj.destroy_reason)
            if match:
                batch_number = match.group(1)
                # Versuche, die BloomingCuttingBatch mit dieser Nummer zu finden
                try:
                    batch = BloomingCuttingBatch.objects.filter(batch_number=batch_number).first()
                    if batch:
                        return str(batch.id)
                except:
                    pass
        return None

# Dateiname: serializers.py

class CuttingBatchSerializer(serializers.ModelSerializer):
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
    
    # Abgeleitete Felder für Stamm und Ursprungs-Informationen
    mother_strain = serializers.SerializerMethodField()
    mother_batch_number = serializers.SerializerMethodField()
    seed_strain = serializers.SerializerMethodField()
    
    # Abgeleitete Felder für aktive und vernichtete Stecklinge
    active_cuttings_count = serializers.SerializerMethodField()
    destroyed_cuttings_count = serializers.SerializerMethodField()
    
    # Neue Felder für detaillierte Mutterpflanzendaten
    mother_plant_id = serializers.SerializerMethodField()
    mother_plant_number = serializers.SerializerMethodField()
    
    class Meta:
        model = CuttingBatch
        fields = [
            'id', 'batch_number', 'mother_batch', 'quantity', 'notes',
            'created_at', 'member', 'member_id', 'room', 'room_id',
            'mother_strain', 'mother_batch_number', 'seed_strain',
            'active_cuttings_count', 'destroyed_cuttings_count',
            'mother_plant_id', 'mother_plant_number'  # Neue Felder hinzugefügt
        ]
    
    def get_mother_strain(self, obj):
        return obj.mother_batch.seed_purchase.strain_name if obj.mother_batch and obj.mother_batch.seed_purchase else None
    
    def get_mother_batch_number(self, obj):
        return obj.mother_batch.batch_number if obj.mother_batch else None
    
    def get_seed_strain(self, obj):
        return obj.mother_batch.seed_purchase.strain_name if obj.mother_batch and obj.mother_batch.seed_purchase else None
    
    def get_active_cuttings_count(self, obj):
        return obj.cuttings.filter(is_destroyed=False).count()
    
    def get_destroyed_cuttings_count(self, obj):
        return obj.cuttings.filter(is_destroyed=True).count()
    
    def get_mother_plant_id(self, obj):
        """Gibt die ID der Mutterpflanze zurück, wenn in den Notes gespeichert."""
        if not obj.notes:
            return None
            
        # Suche nach "Erstellt von Mutterpflanze ... (ID: ...)" im Notes-Feld
        import re
        id_match = re.search(r'Erstellt von Mutterpflanze .+ \(ID: ([a-f0-9-]+)\)', obj.notes)
        if id_match:
            return id_match.group(1)
        return None
    
    def get_mother_plant_number(self, obj):
        """Gibt die Nummer der Mutterpflanze zurück, wenn in den Notes gespeichert."""
        if not obj.notes:
            return None
            
        # Suche nach "Erstellt von Mutterpflanze ..." im Notes-Feld
        import re
        number_match = re.search(r'Erstellt von Mutterpflanze ([\w\-:.]+)', obj.notes)
        if number_match:
            return number_match.group(1)
        return None
    
class BloomingCuttingPlantSerializer(serializers.ModelSerializer):
    # Serializer für das Mitglied, das vernichtet hat
    destroyed_by = MemberSerializer(read_only=True)
    destroyed_by_id = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(), 
        source='destroyed_by',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = BloomingCuttingPlant
        fields = [
            'id', 'batch_number', 'notes', 'is_destroyed', 'destroy_reason', 
            'destroyed_at', 'created_at', 'destroyed_by', 'destroyed_by_id'
        ]

class BloomingCuttingBatchSerializer(serializers.ModelSerializer):
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
    
    # Abgeleitete Felder für Steckling-Informationen
    cutting_strain = serializers.SerializerMethodField()
    cutting_batch_number = serializers.SerializerMethodField()
    
    # Abgeleitete Felder für aktive und vernichtete Pflanzen
    active_plants_count = serializers.SerializerMethodField()
    destroyed_plants_count = serializers.SerializerMethodField()
    
    class Meta:
        model = BloomingCuttingBatch
        fields = [
            'id', 'batch_number', 'cutting_batch', 'quantity', 'notes',
            'created_at', 'member', 'member_id', 'room', 'room_id',
            'cutting_strain', 'cutting_batch_number', 'active_plants_count', 'destroyed_plants_count'
        ]
    
    def get_cutting_strain(self, obj):
        # Wenn vorhanden, hole die Genetik über Mutterpflanzen und Samen
        if obj.cutting_batch and obj.cutting_batch.mother_batch and obj.cutting_batch.mother_batch.seed_purchase:
            return obj.cutting_batch.mother_batch.seed_purchase.strain_name
        return "Unbekannt"
    
    def get_cutting_batch_number(self, obj):
        return obj.cutting_batch.batch_number if obj.cutting_batch else None
    
    def get_active_plants_count(self, obj):
        return obj.plants.filter(is_destroyed=False).count()
    
    def get_destroyed_plants_count(self, obj):
        return obj.plants.filter(is_destroyed=True).count()
    
class HarvestBatchSerializer(serializers.ModelSerializer):
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
    
    # Abgeleitete Felder für Quelle und Genetik
    source_strain = serializers.SerializerMethodField()
    source_batch_number = serializers.SerializerMethodField()
    source_type = serializers.SerializerMethodField()
    
    class Meta:
        model = HarvestBatch
        fields = [
            'id', 'batch_number', 'weight', 
            'flowering_batch', 'blooming_cutting_batch',
            'source_strain', 'source_batch_number', 'source_type',
            'member', 'member_id', 'room', 'room_id',
            'notes', 'is_destroyed', 'destroy_reason', 
            'destroyed_at', 'destroyed_by', 'destroyed_by_id',
            'created_at'
        ]
    
    def get_source_strain(self, obj):
        if obj.flowering_batch:
            return obj.flowering_batch.seed_purchase.strain_name if obj.flowering_batch.seed_purchase else "Unbekannt"
        elif obj.blooming_cutting_batch:
            if (obj.blooming_cutting_batch.cutting_batch and 
                obj.blooming_cutting_batch.cutting_batch.mother_batch and 
                obj.blooming_cutting_batch.cutting_batch.mother_batch.seed_purchase):
                return obj.blooming_cutting_batch.cutting_batch.mother_batch.seed_purchase.strain_name
        return "Unbekannt"
    
    def get_source_batch_number(self, obj):
        return obj.source_batch_number
    
    def get_source_type(self, obj):
        if obj.flowering_batch:
            return "Blühpflanze aus Samen"
        elif obj.blooming_cutting_batch:
            return "Blühpflanze aus Steckling"
        return "Unbekannt"
    
class DryingBatchSerializer(serializers.ModelSerializer):
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
    
    # Abgeleitete Felder für Quelle und Genetik
    source_strain = serializers.SerializerMethodField()
    harvest_batch_number = serializers.SerializerMethodField()
    weight_loss = serializers.SerializerMethodField()
    weight_loss_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = DryingBatch
        fields = [
            'id', 'batch_number', 'harvest_batch', 'initial_weight', 'final_weight',
            'source_strain', 'harvest_batch_number', 'weight_loss', 'weight_loss_percentage',
            'member', 'member_id', 'room', 'room_id',
            'notes', 'is_destroyed', 'destroy_reason', 
            'destroyed_at', 'destroyed_by', 'destroyed_by_id',
            'created_at'
        ]
    
    def get_source_strain(self, obj):
        return obj.source_strain
    
    def get_harvest_batch_number(self, obj):
        return obj.harvest_batch.batch_number if obj.harvest_batch else None
    
    def get_weight_loss(self, obj):
        return obj.weight_loss
    
    def get_weight_loss_percentage(self, obj):
        return obj.weight_loss_percentage
    
class ProcessingBatchSerializer(serializers.ModelSerializer):
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
    
    # Abgeleitete Felder für Quelle und Genetik
    source_strain = serializers.SerializerMethodField()
    drying_batch_number = serializers.SerializerMethodField()
    product_type_display = serializers.SerializerMethodField()
    yield_percentage = serializers.SerializerMethodField()
    waste_weight = serializers.SerializerMethodField()
    
    class Meta:
        model = ProcessingBatch
        fields = [
            'id', 'batch_number', 'drying_batch', 'product_type', 'product_type_display',
            'input_weight', 'output_weight', 'yield_percentage', 'waste_weight',
            'source_strain', 'drying_batch_number',
            'member', 'member_id', 'room', 'room_id',
            'notes', 'is_destroyed', 'destroy_reason', 
            'destroyed_at', 'destroyed_by', 'destroyed_by_id',
            'created_at'
        ]
    
    def get_source_strain(self, obj):
        return obj.source_strain
    
    def get_drying_batch_number(self, obj):
        return obj.drying_batch.batch_number if obj.drying_batch else None
    
    def get_product_type_display(self, obj):
        return dict(PRODUCT_TYPE_CHOICES).get(obj.product_type, obj.product_type)
    
    def get_yield_percentage(self, obj):
        return obj.yield_percentage
    
    def get_waste_weight(self, obj):
        return obj.waste_weight
    
class LabTestingBatchSerializer(serializers.ModelSerializer):
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
    
    # Abgeleitete Felder für Quelle und Genetik
    source_strain = serializers.SerializerMethodField()
    processing_batch_number = serializers.SerializerMethodField()
    remaining_weight = serializers.SerializerMethodField()
    product_type = serializers.SerializerMethodField()
    product_type_display = serializers.SerializerMethodField()
    
    class Meta:
        model = LabTestingBatch
        fields = [
            'id', 'batch_number', 'processing_batch', 'processing_batch_number',
            'input_weight', 'sample_weight', 'remaining_weight',
            'status', 'thc_content', 'cbd_content', 'lab_notes',
            'source_strain', 'product_type', 'product_type_display',
            'member', 'member_id', 'room', 'room_id',
            'notes', 'is_destroyed', 'destroy_reason', 
            'destroyed_at', 'destroyed_by', 'destroyed_by_id',
            'converted_to_packaging', 'converted_to_packaging_at',
            'created_at'
        ]
    
    def get_source_strain(self, obj):
        return obj.source_strain
    
    def get_processing_batch_number(self, obj):
        return obj.processing_batch.batch_number if obj.processing_batch else None
    
    def get_remaining_weight(self, obj):
        return obj.remaining_weight
    
    def get_product_type(self, obj):
        return obj.product_type
    
    def get_product_type_display(self, obj):
        if obj.processing_batch:
            # Verwende die Übersetzungsmethode direkt mit dem Auswahlwert
            return dict(PRODUCT_TYPE_CHOICES).get(obj.processing_batch.product_type, obj.processing_batch.product_type)
        return "Unbekannt"

class PackagingBatchSerializer(serializers.ModelSerializer):
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
    
    # Abgeleitete Felder für Quelle und Genetik
    source_strain = serializers.SerializerMethodField()
    lab_testing_batch_number = serializers.SerializerMethodField()
    product_type = serializers.SerializerMethodField()
    product_type_display = serializers.SerializerMethodField()
    thc_content = serializers.SerializerMethodField()
    cbd_content = serializers.SerializerMethodField()
    
    class Meta:
        model = PackagingBatch
        fields = [
            'id', 'batch_number', 'lab_testing_batch', 'lab_testing_batch_number',
            'total_weight', 'unit_count', 'unit_weight',
            'source_strain', 'product_type', 'product_type_display',
            'thc_content', 'cbd_content',
            'member', 'member_id', 'room', 'room_id',
            'notes', 'is_destroyed', 'destroy_reason', 
            'destroyed_at', 'destroyed_by', 'destroyed_by_id',
            'created_at'
        ]
    
    def get_source_strain(self, obj):
        return obj.source_strain
    
    def get_lab_testing_batch_number(self, obj):
        return obj.lab_testing_batch.batch_number if obj.lab_testing_batch else None
    
    def get_product_type(self, obj):
        return obj.product_type
    
    def get_product_type_display(self, obj):
        if obj.lab_testing_batch and obj.lab_testing_batch.processing_batch:
            # Verwende die Übersetzungsmethode direkt mit dem Auswahlwert
            return dict(PRODUCT_TYPE_CHOICES).get(obj.lab_testing_batch.processing_batch.product_type, 
                                                obj.lab_testing_batch.processing_batch.product_type)
        return "Unbekannt"
    
    def get_thc_content(self, obj):
        return obj.thc_content
    
    def get_cbd_content(self, obj):
        return obj.cbd_content
    
class PackagingUnitSerializer(serializers.ModelSerializer):
    # Serializer für das Mitglied, das vernichtet hat
    destroyed_by = MemberSerializer(read_only=True)
    destroyed_by_id = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(), 
        source='destroyed_by',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = PackagingUnit
        fields = [
            'id', 'batch_number', 'weight', 'notes', 
            'is_destroyed', 'destroy_reason', 'destroyed_at',
            'created_at', 'destroyed_by', 'destroyed_by_id'
        ]