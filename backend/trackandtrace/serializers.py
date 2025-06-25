from rest_framework import serializers
from .models import (
    SeedPurchase, MotherPlantBatch, MotherPlant, 
    FloweringPlantBatch, FloweringPlant, Cutting, CuttingBatch,
    BloomingCuttingBatch, BloomingCuttingPlant, HarvestBatch,
    DryingBatch, ProcessingBatch, PRODUCT_TYPE_CHOICES, LabTestingBatch, 
    PackagingBatch, PackagingUnit, ProductDistribution, SeedPurchaseImage, 
    MotherPlantBatchImage, CuttingBatchImage, BloomingCuttingBatchImage,
    FloweringPlantBatchImage, HarvestBatchImage, DryingBatchImage,
)
from members.models import Member
from rooms.models import Room
from wawi.models import CannabisStrain
from wawi.serializers import CannabisStrainSerializer

class MemberSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Member
        fields = ['id', 'uuid', 'display_name', 'first_name', 'last_name']
    
    def get_display_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'name']

# ========== IMAGE SERIALIZERS (VOR ALLEN ANDEREN) ==========
class BaseProductImageSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    video_url = serializers.SerializerMethodField()
    
    class Meta:
        fields = [
            'id', 'image', 'image_url', 'video', 'video_url',  # NEU: video Felder
            'thumbnail', 'thumbnail_url', 'media_type',  # NEU: media_type
            'title', 'description', 'image_type', 
            'uploaded_by', 'uploaded_by_name', 'uploaded_at'
        ]

    def get_video_url(self, obj):
        if obj.video:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.video.url)
        return None
    
    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            # Verwendet die __str__ Methode des Member Models
            # Dies gibt z.B. "Herr Max Mustermann" zurück
            return str(obj.uploaded_by)
        return "Unbekannt"
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None
    
    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
        return None

class SeedPurchaseImageSerializer(BaseProductImageSerializer):
    uploaded_by = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(),
        write_only=True
    )
    seed_purchase = serializers.PrimaryKeyRelatedField(
        queryset=SeedPurchase.objects.all(),
        write_only=True,
        required=False  # Dies ist wichtig!
    )
    
    class Meta(BaseProductImageSerializer.Meta):
        model = SeedPurchaseImage
        fields = BaseProductImageSerializer.Meta.fields + ['seed_purchase']

class MotherPlantBatchImageSerializer(BaseProductImageSerializer):
    uploaded_by = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(),
        write_only=True
    )
    mother_plant_batch = serializers.PrimaryKeyRelatedField(
        queryset=MotherPlantBatch.objects.all(),
        write_only=True,
        required=False
    )
    growth_stage = serializers.ChoiceField(
        choices=[
            ('seedling', 'Sämling'),
            ('vegetative', 'Vegetativ'),
            ('pre_flowering', 'Vorblüte'),
            ('mother', 'Mutterpflanze')
        ],
        required=False,
        allow_blank=True
    )
    
    class Meta(BaseProductImageSerializer.Meta):
        model = MotherPlantBatchImage
        # WICHTIG: fields muss eine explizite Liste sein
        fields = BaseProductImageSerializer.Meta.fields + ['mother_plant_batch', 'growth_stage']

class CuttingBatchImageSerializer(BaseProductImageSerializer):
    uploaded_by = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(),
        write_only=True
    )
    
    class Meta:
        model = CuttingBatchImage
        fields = [
            'id', 'image', 'image_url', 'thumbnail', 'thumbnail_url',
            'title', 'description', 'image_type', 
            'uploaded_by', 'uploaded_by_name', 'uploaded_at'
        ]

class BloomingCuttingBatchImageSerializer(BaseProductImageSerializer):
    uploaded_by = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(),
        write_only=True
    )
    blooming_cutting_batch = serializers.PrimaryKeyRelatedField(
        read_only=True  # Wird aus Query-Params gesetzt
    )
    
    class Meta:
        model = BloomingCuttingBatchImage
        fields = [
            'id', 'image', 'image_url', 'thumbnail', 'thumbnail_url',
            'title', 'description', 'image_type', 
            'uploaded_by', 'uploaded_by_name', 'uploaded_at',
            'blooming_cutting_batch'
        ]

class FloweringPlantBatchImageSerializer(BaseProductImageSerializer):
    """Serializer für Blühpflanzen-Batch Bilder"""
    uploaded_by = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(),
        write_only=True
    )
    flowering_plant_batch = serializers.PrimaryKeyRelatedField(
        read_only=True  # Wird im ViewSet aus batch_id gesetzt
    )
    
    class Meta(BaseProductImageSerializer.Meta):
        model = FloweringPlantBatchImage
        fields = BaseProductImageSerializer.Meta.fields + ['flowering_plant_batch']

class HarvestBatchImageSerializer(BaseProductImageSerializer):
    """Serializer für Ernte-Batch Bilder"""
    # WICHTIG: uploaded_by muss definiert sein!
    uploaded_by = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(),
        write_only=True
    )
    # WICHTIG: harvest_batch als read_only!
    harvest_batch = serializers.PrimaryKeyRelatedField(
        read_only=True
    )
    harvest_stage = serializers.ChoiceField(
        choices=[
            ('fresh', 'Frisch geerntet'),
            ('trimmed', 'Getrimmt'),
            ('packed', 'Verpackt für Trocknung'),
        ],
        required=False,
        allow_blank=True
    )
    
    class Meta(BaseProductImageSerializer.Meta):
        model = HarvestBatchImage
        fields = BaseProductImageSerializer.Meta.fields + ['harvest_batch', 'harvest_stage']

class DryingBatchImageSerializer(BaseProductImageSerializer):
    """Serializer für Trocknungs-Batch Bilder und Videos"""
    uploaded_by = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(),
        write_only=True
    )
    drying_batch = serializers.PrimaryKeyRelatedField(
        read_only=True
    )
    drying_stage = serializers.ChoiceField(
        choices=[
            ('wet', 'Feucht (Tag 1-3)'),
            ('drying', 'Trocknend (Tag 4-7)'),
            ('dry', 'Trocken (Tag 8+)'),
            ('curing', 'Reifend'),
        ],
        required=False,
        allow_blank=True
    )
    
    class Meta(BaseProductImageSerializer.Meta):
        model = DryingBatchImage
        fields = BaseProductImageSerializer.Meta.fields + ['drying_batch', 'drying_stage']
        
class SeedPurchaseSerializer(serializers.ModelSerializer):
    # Alte Mitglieder-Zuweisung (optional noch im Einsatz)
    member = MemberSerializer(read_only=True)
    member_id = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(),
        source='member',
        write_only=True,
        required=False,
        allow_null=True
    )

    strain = CannabisStrainSerializer(read_only=True)
    strain_id = serializers.PrimaryKeyRelatedField(
        queryset=CannabisStrain.objects.all(),
        source='strain',
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

    destroyed_by = MemberSerializer(read_only=True)
    destroyed_by_id = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(),
        source='destroyed_by',
        write_only=True,
        required=False,
        allow_null=True
    )

    original_seed = serializers.PrimaryKeyRelatedField(read_only=True)

    mother_plant_count = serializers.SerializerMethodField()
    flowering_plant_count = serializers.SerializerMethodField()

    images = SeedPurchaseImageSerializer(many=True, read_only=True)
    image_count = serializers.SerializerMethodField()

    class Meta:
        model = SeedPurchase
        fields = [
            'id', 'batch_number', 'strain_name', 'quantity', 'remaining_quantity',
            'is_destroyed', 'destroy_reason', 'destroyed_at', 'created_at',
            'member', 'member_id', 'room', 'room_id', 'destroyed_by', 'destroyed_by_id',
            'original_seed', 'mother_plant_count', 'flowering_plant_count',
            'destroyed_quantity', 'strain', 'strain_id',
            'thc_percentage_min', 'thc_percentage_max',
            'cbd_percentage_min', 'cbd_percentage_max',
            'flowering_time_min', 'flowering_time_max', 'images', 'image_count'
        ]

    def get_mother_plant_count(self, obj):
        return sum(batch.plants.filter(is_destroyed=False).count() for batch in obj.mother_batches.all())

    def get_flowering_plant_count(self, obj):
        return sum(batch.plants.filter(is_destroyed=False).count() for batch in obj.flowering_batches.all())
    
    def get_image_count(self, obj):
        return obj.images.count()


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

    images = MotherPlantBatchImageSerializer(many=True, read_only=True)
    image_count = serializers.SerializerMethodField()
    
    class Meta:
        model = MotherPlantBatch
        fields = [
            'id', 'batch_number', 'seed_purchase', 'quantity', 'notes',
            'created_at', 'member', 'member_id', 'room', 'room_id',
            'seed_strain', 'seed_batch_number', 'active_plants_count', 
            'destroyed_plants_count', 'converted_to_cuttings_count',
            'images', 'image_count'
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

    def get_image_count(self, obj):
        """Zählt die verknüpften Bilder"""
        return obj.images.count()


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

    images = FloweringPlantBatchImageSerializer(many=True, read_only=True)
    image_count = serializers.SerializerMethodField()
    
    class Meta:
        model = FloweringPlantBatch
        fields = [
            'id', 'batch_number', 'seed_purchase', 'quantity', 'notes',
            'created_at', 'member', 'member_id', 'room', 'room_id',
            'seed_strain', 'seed_batch_number', 'active_plants_count', 'destroyed_plants_count',
            'images', 'image_count'
        ]
    
    def get_seed_strain(self, obj):
        return obj.seed_purchase.strain_name if obj.seed_purchase else None
    
    def get_seed_batch_number(self, obj):
        return obj.seed_purchase.batch_number if obj.seed_purchase else None
    
    def get_active_plants_count(self, obj):
        return obj.plants.filter(is_destroyed=False).count()
    
    def get_destroyed_plants_count(self, obj):
        return obj.plants.filter(is_destroyed=True).count()
    
    def get_image_count(self, obj):
        """Gibt die Anzahl der Bilder für diesen Batch zurück."""
        return obj.images.count()

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
    
    # NEU: Bilder-Felder hinzufügen
    images = CuttingBatchImageSerializer(many=True, read_only=True)
    image_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CuttingBatch
        fields = [
            'id', 'batch_number', 'mother_batch', 'quantity', 'notes',
            'created_at', 'member', 'member_id', 'room', 'room_id',
            'mother_strain', 'mother_batch_number', 'seed_strain',
            'active_cuttings_count', 'destroyed_cuttings_count',
            'mother_plant_id', 'mother_plant_number',
            'images', 'image_count'  # NEU
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
    
    def get_image_count(self, obj):  # NEU - Diese Methode fehlte!
        """Gibt die Anzahl der Bilder für diesen Batch zurück."""
        return obj.images.count()
    
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

    images = BloomingCuttingBatchImageSerializer(many=True, read_only=True)
    image_count = serializers.SerializerMethodField()
    
    class Meta:
        model = BloomingCuttingBatch
        fields = [
            'id', 'batch_number', 'cutting_batch', 'quantity', 'notes',
            'created_at', 'member', 'member_id', 'room', 'room_id',
            'cutting_strain', 'cutting_batch_number', 'active_plants_count', 'destroyed_plants_count',
            'images', 'image_count'
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
    
    def get_image_count(self, obj):
        return obj.images.count()
    
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

    images = HarvestBatchImageSerializer(many=True, read_only=True)
    image_count = serializers.SerializerMethodField()    
    
    class Meta:
        model = HarvestBatch
        fields = [
            'id', 'batch_number', 'weight', 
            'flowering_batch', 'blooming_cutting_batch',
            'source_strain', 'source_batch_number', 'source_type',
            'member', 'member_id', 'room', 'room_id',
            'notes', 'is_destroyed', 'destroy_reason', 
            'destroyed_at', 'destroyed_by', 'destroyed_by_id',
            'created_at', 'images', 'image_count'
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
    
    def get_image_count(self, obj):
        """Gibt die Anzahl der Bilder für diesen Batch zurück."""
        return obj.images.count()
    
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

    images = DryingBatchImageSerializer(many=True, read_only=True)
    image_count = serializers.SerializerMethodField()
    
    class Meta:
        model = DryingBatch
        fields = [
            'id', 'batch_number', 'harvest_batch', 'initial_weight', 'final_weight',
            'source_strain', 'harvest_batch_number', 'weight_loss', 'weight_loss_percentage',
            'member', 'member_id', 'room', 'room_id',
            'notes', 'is_destroyed', 'destroy_reason', 
            'destroyed_at', 'destroyed_by', 'destroyed_by_id',
            'created_at',
            'images', 'image_count'  # DIESE FEHLTEN!
        ]
    
    def get_image_count(self, obj):
        """Gibt die Anzahl der Bilder UND Videos zurück."""
        return obj.images.count()
    
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
    
    # 🆕 NEUE PREISFELD-ANZEIGEN HINZUFÜGEN:
    price_per_gram_display = serializers.SerializerMethodField()
    total_batch_price_display = serializers.SerializerMethodField()
    unit_price_display = serializers.SerializerMethodField()
    
    class Meta:
        model = PackagingBatch
        fields = [
            'id', 'batch_number', 'lab_testing_batch', 'lab_testing_batch_number',
            'total_weight', 'unit_count', 'unit_weight',
            
            # 🆕 PREISFELDER HINZUFÜGEN:
            'price_per_gram', 'total_batch_price', 'unit_price',
            'price_per_gram_display', 'total_batch_price_display', 'unit_price_display',
            
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
    
    # 🆕 PREIS-FORMATIERUNG FÜR FRONTEND:
    def get_price_per_gram_display(self, obj):
        if obj.price_per_gram:
            return f"{float(obj.price_per_gram):.2f} €"
        return "Nicht festgelegt"
    
    def get_total_batch_price_display(self, obj):
        if obj.total_batch_price:
            return f"{float(obj.total_batch_price):.2f} €"
        return "Nicht berechnet"
    
    def get_unit_price_display(self, obj):
        if obj.unit_price:
            return f"{float(obj.unit_price):.2f} €"
        return "Nicht berechnet"

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
    
    # ERWEITERT: Batch-Informationen hinzufügen für Frontend-Darstellung
    batch = serializers.SerializerMethodField()
    
    # 🆕 PREISFELD-ANZEIGEN HINZUFÜGEN:
    unit_price_display = serializers.SerializerMethodField()
    price_per_gram_calculated = serializers.SerializerMethodField()
    
    class Meta:
        model = PackagingUnit
        fields = [
            'id', 'batch_number', 'weight', 'notes',
            
            # 🆕 PREIS HINZUFÜGEN:
            'unit_price', 'unit_price_display', 'price_per_gram_calculated',
            
            'is_destroyed', 'destroy_reason', 'destroyed_at',
            'created_at', 'destroyed_by', 'destroyed_by_id',
            'batch'  # Hinzugefügtes Feld
        ]
    
    # 🆕 PREIS-FORMATIERUNG:
    def get_unit_price_display(self, obj):
        if obj.unit_price:
            return f"{float(obj.unit_price):.2f} €"
        return "Nicht festgelegt"
    
    def get_price_per_gram_calculated(self, obj):
        price_per_gram = obj.price_per_gram_calculated  # Property aus Model
        if price_per_gram:
            return f"{price_per_gram:.2f} €/g"
        return "Nicht berechnet"
    
    def get_batch(self, obj):
        """
        Erstellt ein Batch-Objekt mit allen nötigen Informationen
        für die Frontend-Darstellung (Genetik, Produkttyp, THC/CBD)
        """
        if not obj.batch:
            return {
                'source_strain': 'Unbekannt',
                'product_type': 'unknown',
                'product_type_display': 'Unbekannt',
                'thc_content': None,
                'cbd_content': None
            }
            
        batch = obj.batch
        
        # Sichere Ermittlung des Produkttyps
        product_type = 'unknown'
        product_type_display = 'Unbekannt'
        
        if batch.lab_testing_batch and batch.lab_testing_batch.processing_batch:
            processing_batch = batch.lab_testing_batch.processing_batch
            product_type = processing_batch.product_type
            # Verwende die Django Choice-Methode für die Anzeige
            product_type_display = processing_batch.get_product_type_display()
        
        # Sammle alle nötigen Informationen vom PackagingBatch-Modell
        batch_data = {
            'id': batch.id,
            'batch_number': batch.batch_number,
            'source_strain': batch.source_strain,  # Property vom PackagingBatch-Modell
            'product_type': product_type,           # Direkt vom ProcessingBatch
            'product_type_display': product_type_display,  # Django Choice Display
            'thc_content': batch.thc_content,       # Property vom PackagingBatch-Modell
            'cbd_content': batch.cbd_content,       # Property vom PackagingBatch-Modell
            'total_weight': batch.total_weight,
            'unit_count': batch.unit_count,
            'unit_weight': batch.unit_weight,
            # 🆕 PREISFELDER HINZUFÜGEN:
            'price_per_gram': batch.price_per_gram,
            'total_batch_price': batch.total_batch_price,
            'unit_price': batch.unit_price,
        }
        
        return batch_data

class ProductDistributionSerializer(serializers.ModelSerializer):
    # Einfache Darstellung der Verpackungseinheiten mit erweiterten Batch-Daten
    packaging_units = PackagingUnitSerializer(many=True, read_only=True)
    packaging_unit_ids = serializers.PrimaryKeyRelatedField(
        queryset=PackagingUnit.objects.filter(is_destroyed=False),
        source='packaging_units',
        write_only=True,
        many=True
    )
    
    # Serializers für Distributor und Empfänger
    distributor = MemberSerializer(read_only=True)
    distributor_id = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(),
        source='distributor',
        write_only=True
    )
    
    recipient = MemberSerializer(read_only=True)
    recipient_id = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(),
        source='recipient',
        write_only=True
    )
    
    # 🆕 Preis-Felder
    total_price = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        required=False,
        help_text="Gesamtpreis der Transaktion"
    )
    balance_before = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        required=False,
        help_text="Kontostand vor der Transaktion"
    )
    balance_after = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        required=False,
        help_text="Kontostand nach der Transaktion"
    )
    calculated_total_price = serializers.ReadOnlyField(
        help_text="Berechneter Gesamtpreis aus den Verpackungseinheiten"
    )
    
    # Berechnete Felder
    total_weight = serializers.SerializerMethodField()
    product_type_summary = serializers.SerializerMethodField()
    total_value = serializers.SerializerMethodField(
        help_text="Summe aller unit_price Werte der verteilten Einheiten"
    )
    
    class Meta:
        model = ProductDistribution
        fields = [
            'id', 
            'batch_number', 
            'packaging_units', 
            'packaging_unit_ids',
            'distributor', 
            'distributor_id', 
            'recipient', 
            'recipient_id',
            'distribution_date', 
            'notes', 
            'created_at', 
            'updated_at',
            'total_weight', 
            'product_type_summary', 
            'total_value',
            # 🆕 Neue Preis-Felder
            'total_price',
            'balance_before',
            'balance_after',
            'calculated_total_price'
        ]
        read_only_fields = ['calculated_total_price', 'created_at', 'updated_at']
    
    def get_total_weight(self, obj):
        """Berechnet das Gesamtgewicht aller verteilten Verpackungseinheiten."""
        return obj.total_weight
    
    def get_product_type_summary(self, obj):
        """Erstellt eine Zusammenfassung der Produkttypen mit deren Gewichten."""
        types = obj.product_types
        result = []
        for product_type, weight in types.items():
            display_type = "Marihuana" if product_type == "marijuana" else (
                "Haschisch" if product_type == "hashish" else product_type)
            result.append({
                "type": display_type, 
                "weight": weight
            })
        return result
    
    def get_total_value(self, obj):
        """Berechnet den Gesamtwert aller verteilten Verpackungseinheiten."""
        total = 0.0
        for unit in obj.packaging_units.all():
            if unit.unit_price:
                total += float(unit.unit_price)
        return total if total > 0 else None
    
    def validate(self, attrs):
        """
        Zusätzliche Validierung für Preis-Konsistenz
        """
        attrs = super().validate(attrs)
        
        # Wenn total_price und packaging_units vorhanden sind, 
        # können wir die Konsistenz prüfen
        if 'total_price' in attrs and 'packaging_units' in attrs:
            calculated_price = 0.0
            for unit in attrs['packaging_units']:
                if hasattr(unit, 'unit_price') and unit.unit_price:
                    calculated_price += float(unit.unit_price)
            
            # Warnung bei Abweichung (optional - kann auch als Fehler implementiert werden)
            if calculated_price > 0 and abs(float(attrs['total_price']) - calculated_price) > 0.01:
                # Optional: Als Warnung loggen statt Fehler werfen
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(
                    f"Preisabweichung festgestellt: total_price={attrs['total_price']}, "
                    f"berechnet={calculated_price}"
                )
        
        return attrs
    
    def to_representation(self, instance):
        """
        Erweiterte Darstellung mit zusätzlichen berechneten Feldern
        """
        data = super().to_representation(instance)
        
        # Füge calculated_total_price hinzu (falls nicht im Model gespeichert)
        if 'calculated_total_price' in data and data['calculated_total_price'] is None:
            data['calculated_total_price'] = self.get_total_value(instance)
        
        # Formatiere Dezimalfelder für bessere Lesbarkeit
        for field in ['total_price', 'balance_before', 'balance_after', 'total_value']:
            if field in data and data[field] is not None:
                data[field] = float(data[field])
        
        return data