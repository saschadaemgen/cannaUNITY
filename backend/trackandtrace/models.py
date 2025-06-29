import uuid, io
from django.db import models
from django.utils import timezone
from members.models import Member
from rooms.models import Room
from wawi.models import CannabisStrain
from django.core.files.storage import default_storage
from django.core.validators import FileExtensionValidator, ValidationError

from PIL import Image

class SeedPurchase(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    strain_name = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField()
    remaining_quantity = models.PositiveIntegerField()
    destroyed_quantity = models.PositiveIntegerField(default=0)
    
    # Mitglieder- und Raumzuordnung für Samen-Einkauf
    member = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True, related_name='seed_purchases')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name='seed_purchases')
    
    # Mitgliederzuordnung für Vernichtung
    destroyed_by = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True, related_name='destroyed_seeds')
    is_destroyed = models.BooleanField(default=False)
    destroy_reason = models.TextField(blank=True, null=True)
    destroyed_at = models.DateTimeField(blank=True, null=True)
    
    original_seed = models.ForeignKey('self', blank=True, null=True, on_delete=models.SET_NULL, related_name='derived_seeds')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    strain = models.ForeignKey(CannabisStrain, on_delete=models.SET_NULL, null=True, blank=True, related_name='seed_purchases')
    
    thc_percentage_min = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    thc_percentage_max = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    cbd_percentage_min = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    cbd_percentage_max = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    flowering_time_min = models.IntegerField(null=True, blank=True)
    flowering_time_max = models.IntegerField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # Generiere Batch-Nummer falls nicht vorhanden
        if not self.batch_number:
            today = timezone.now()
            # Zähle Samen, die heute erstellt wurden
            count = SeedPurchase.objects.filter(
                created_at__year=today.year,
                created_at__month=today.month,
                created_at__day=today.day
            ).count() + 1
            
            # Generiere Batch-Nummer
            self.batch_number = f"charge:seed:{today.strftime('%d:%m:%Y')}:{count:04d}"

        if self.strain and not self.id:  # Nur bei Neuanlage
            self.strain_name = self.strain.name
            self.thc_percentage_min = self.strain.thc_percentage_min
            self.thc_percentage_max = self.strain.thc_percentage_max
            self.cbd_percentage_min = self.strain.cbd_percentage_min
            self.cbd_percentage_max = self.strain.cbd_percentage_max
            self.flowering_time_min = self.strain.flowering_time_min
            self.flowering_time_max = self.strain.flowering_time_max
        
        super().save(*args, **kwargs)

class MotherPlantBatch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    
    seed_purchase = models.ForeignKey(SeedPurchase, related_name='mother_batches', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    notes = models.TextField(blank=True, null=True)
    
    # Mitglieder- und Raumzuordnung für Mutterpflanzen-Erstellung
    member = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True,
                              related_name='mother_plant_batches')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True,
                            related_name='mother_plant_batches')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Generiere Batch-Nummer falls nicht vorhanden
        if not self.batch_number:
            today = timezone.now()
            # Zähle Mutterpflanzen-Batches, die heute erstellt wurden
            count = MotherPlantBatch.objects.filter(
                created_at__year=today.year,
                created_at__month=today.month,
                created_at__day=today.day
            ).count() + 1
            
            # Generiere Batch-Nummer
            self.batch_number = f"mother-plant:{today.strftime('%d:%m:%Y')}:{count:04d}"
        
        super().save(*args, **kwargs)

class MotherPlant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch = models.ForeignKey(MotherPlantBatch, related_name='plants', on_delete=models.CASCADE)
    batch_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    # Mitgliederzuordnung für Vernichtung
    destroyed_by = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='destroyed_mother_plants')
    
    is_destroyed = models.BooleanField(default=False)
    destroy_reason = models.TextField(blank=True, null=True)
    destroyed_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Generiere Batch-Nummer falls nicht vorhanden
        if not self.batch_number:
            today = timezone.now()
            # Zähle Mutterpflanzen, die heute erstellt wurden
            count = MotherPlant.objects.filter(
                created_at__year=today.year,
                created_at__month=today.month,
                created_at__day=today.day
            ).count() + 1
            
            # Generiere Batch-Nummer
            self.batch_number = f"mother-plant:{today.strftime('%d:%m:%Y')}:{count:04d}"
        
        super().save(*args, **kwargs)

class FloweringPlantBatch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    
    seed_purchase = models.ForeignKey(SeedPurchase, related_name='flowering_batches', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    notes = models.TextField(blank=True, null=True)
    
    # Mitglieder- und Raumzuordnung für Blühpflanzen-Erstellung
    member = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True,
                              related_name='flowering_plant_batches')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True,
                            related_name='flowering_plant_batches')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Generiere Batch-Nummer falls nicht vorhanden
        if not self.batch_number:
            today = timezone.now()
            # Zähle Blühpflanzen-Batches, die heute erstellt wurden
            count = FloweringPlantBatch.objects.filter(
                created_at__year=today.year,
                created_at__month=today.month,
                created_at__day=today.day
            ).count() + 1
            
            # Generiere Batch-Nummer
            self.batch_number = f"blooming-plant:{today.strftime('%d:%m:%Y')}:{count:04d}"
        
        super().save(*args, **kwargs)

class FloweringPlant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch = models.ForeignKey(FloweringPlantBatch, related_name='plants', on_delete=models.CASCADE)
    batch_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    # Mitgliederzuordnung für Vernichtung
    destroyed_by = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='destroyed_flowering_plants')
    
    is_destroyed = models.BooleanField(default=False)
    destroy_reason = models.TextField(blank=True, null=True)
    destroyed_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Generiere Batch-Nummer falls nicht vorhanden
        if not self.batch_number:
            today = timezone.now()
            # Zähle Blühpflanzen, die heute erstellt wurden
            count = FloweringPlant.objects.filter(
                created_at__year=today.year,
                created_at__month=today.month,
                created_at__day=today.day
            ).count() + 1
            
            # Generiere Batch-Nummer
            self.batch_number = f"blooming-plant:{today.strftime('%d:%m:%Y')}:{count:04d}"
        
        super().save(*args, **kwargs)

class CuttingBatch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    
    mother_batch = models.ForeignKey(MotherPlantBatch, related_name='cutting_batches', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    notes = models.TextField(blank=True, null=True)
    
    # Mitglieder- und Raumzuordnung für Stecklinge-Erstellung
    member = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True,
                              related_name='cutting_batches')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True,
                            related_name='cutting_batches')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Generiere Batch-Nummer falls nicht vorhanden
        if not self.batch_number:
            today = timezone.now()
            # Zähle Stecklinge-Batches, die heute erstellt wurden
            count = CuttingBatch.objects.filter(
                created_at__year=today.year,
                created_at__month=today.month,
                created_at__day=today.day
            ).count() + 1
            
            # Generiere Batch-Nummer
            self.batch_number = f"cutting:{today.strftime('%d:%m:%Y')}:{count:04d}"
        
        super().save(*args, **kwargs)

class Cutting(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch = models.ForeignKey(CuttingBatch, related_name='cuttings', on_delete=models.CASCADE)
    batch_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    # Mitgliederzuordnung für Vernichtung
    destroyed_by = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='destroyed_cuttings')
    
    is_destroyed = models.BooleanField(default=False)
    destroy_reason = models.TextField(blank=True, null=True)
    destroyed_at = models.DateTimeField(blank=True, null=True)

    converted_by = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='converted_cuttings')
    converted_at = models.DateTimeField(blank=True, null=True)
    converted_to = models.UUIDField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Generiere Batch-Nummer falls nicht vorhanden
        if not self.batch_number:
            today = timezone.now()
            # Zähle Stecklinge, die heute erstellt wurden
            count = Cutting.objects.filter(
                created_at__year=today.year,
                created_at__month=today.month,
                created_at__day=today.day
            ).count() + 1
            
            # Generiere Batch-Nummer
            self.batch_number = f"cutting:{today.strftime('%d:%m:%Y')}:{count:04d}"
        
        super().save(*args, **kwargs)

class BloomingCuttingBatch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    
    cutting_batch = models.ForeignKey(CuttingBatch, related_name='blooming_batches', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    notes = models.TextField(blank=True, null=True)
    
    # Mitglieder- und Raumzuordnung für Blühpflanzen-Erstellung
    member = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True,
                              related_name='blooming_cutting_batches')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True,
                            related_name='blooming_cutting_batches')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Generiere Batch-Nummer falls nicht vorhanden
        if not self.batch_number:
            today = timezone.now()
            # Zähle Blühpflanzen-Batches, die heute erstellt wurden
            count = BloomingCuttingBatch.objects.filter(
                created_at__year=today.year,
                created_at__month=today.month,
                created_at__day=today.day
            ).count() + 1
            
            # Generiere Batch-Nummer
            self.batch_number = f"charge:blooming-cutting:{today.strftime('%d:%m:%Y')}:{count:04d}"
        
        super().save(*args, **kwargs)

class BloomingCuttingPlant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch = models.ForeignKey(BloomingCuttingBatch, related_name='plants', on_delete=models.CASCADE)
    batch_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    # Mitgliederzuordnung für Vernichtung
    destroyed_by = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='destroyed_blooming_cutting_plants')
    
    is_destroyed = models.BooleanField(default=False)
    destroy_reason = models.TextField(blank=True, null=True)
    destroyed_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Generiere Batch-Nummer falls nicht vorhanden
        if not self.batch_number:
            today = timezone.now()
            # Zähle Blühpflanzen, die heute erstellt wurden
            count = BloomingCuttingPlant.objects.filter(
                created_at__year=today.year,
                created_at__month=today.month,
                created_at__day=today.day
            ).count() + 1
            
            # Generiere Batch-Nummer
            self.batch_number = f"blooming-cutting:{today.strftime('%d:%m:%Y')}:{count:04d}"
        
        super().save(*args, **kwargs)

class HarvestBatch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    
    # Mögliche Quellen für die Ernte (nur eine sollte gesetzt sein)
    flowering_batch = models.ForeignKey(FloweringPlantBatch, on_delete=models.CASCADE, 
                                        related_name='harvests', null=True, blank=True)
    blooming_cutting_batch = models.ForeignKey(BloomingCuttingBatch, on_delete=models.CASCADE, 
                                              related_name='harvests', null=True, blank=True)
    
    # Gewicht in Gramm
    weight = models.DecimalField(max_digits=8, decimal_places=2)
    
    # Mitglieder- und Raumzuordnung
    member = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True,
                              related_name='harvests')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True,
                            related_name='harvests')
    
    notes = models.TextField(blank=True, null=True)
    is_destroyed = models.BooleanField(default=False)
    destroy_reason = models.TextField(blank=True, null=True)
    destroyed_at = models.DateTimeField(blank=True, null=True)
    destroyed_by = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='destroyed_harvests')
    
    # Neues Feld zur Kennzeichnung, dass diese Ernte zu einer Trocknung überführt wurde
    converted_to_drying = models.BooleanField(default=False)
    converted_to_drying_at = models.DateTimeField(blank=True, null=True)
    drying_batch = models.ForeignKey('DryingBatch', on_delete=models.SET_NULL, 
                                    related_name='source_harvest', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Generiere Batch-Nummer falls nicht vorhanden
        if not self.batch_number:
            today = timezone.now()
            # Zähle Ernten, die heute erstellt wurden
            count = HarvestBatch.objects.filter(
                created_at__year=today.year,
                created_at__month=today.month,
                created_at__day=today.day
            ).count() + 1
            
            # Generiere Batch-Nummer
            self.batch_number = f"charge:harvest:{today.strftime('%d:%m:%Y')}:{count:04d}"
        
        super().save(*args, **kwargs)
    
    @property
    def source_strain(self):
        """Gibt die Genetik der Quelle zurück."""
        if self.flowering_batch:
            # Das korrekte Attribut ist seed_purchase.strain_name, nicht seed_strain
            return self.flowering_batch.seed_purchase.strain_name
        elif self.blooming_cutting_batch:
            if (self.blooming_cutting_batch.cutting_batch and 
                self.blooming_cutting_batch.cutting_batch.mother_batch and 
                self.blooming_cutting_batch.cutting_batch.mother_batch.seed_purchase):
                return self.blooming_cutting_batch.cutting_batch.mother_batch.seed_purchase.strain_name
        return "Unbekannt"
    
    @property
    def source_batch_number(self):
        """Gibt die Batch-Nummer der Quelle zurück."""
        if self.flowering_batch:
            return self.flowering_batch.batch_number
        elif self.blooming_cutting_batch:
            return self.blooming_cutting_batch.batch_number
        return None
        
    @property
    def status(self):
        """Gibt den Status der Ernte zurück: active, dried oder destroyed."""
        if self.is_destroyed:
            return 'destroyed'
        elif self.converted_to_drying:
            return 'dried'
        else:
            return 'active'
    
    def generate_batch_number(self):
        """Generiert eine eindeutige Batch-Nummer für Ernten"""
        prefix = "harvest"  # WICHTIG: Muss "harvest" sein!
        
        # Aktuelles Datum
        now = timezone.now()
        date_part = now.strftime("%d:%m:%Y")
        
        # Zähler für den Tag
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Zähle Batches vom gleichen Tag
        count = HarvestBatch.objects.filter(
            created_at__range=(start_of_day, end_of_day)
        ).count()
        
        # Batch-Nummer mit führenden Nullen
        batch_number = f"{prefix}:{date_part}:{count + 1:04d}"
        
        return batch_number
    
    def save(self, *args, **kwargs):
        if not self.batch_number:
            self.batch_number = self.generate_batch_number()
        super().save(*args, **kwargs)
    
class DryingBatch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    
    # Quelle der Trocknung (Ernte)
    harvest_batch = models.ForeignKey(HarvestBatch, on_delete=models.CASCADE, 
                                     related_name='drying_batches')
    
    # Gewichte in Gramm
    initial_weight = models.DecimalField(max_digits=8, decimal_places=2)  # Gewicht aus der Ernte
    final_weight = models.DecimalField(max_digits=8, decimal_places=2)    # Trockengewicht
    
    # Mitglieder- und Raumzuordnung
    member = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True,
                              related_name='drying_batches')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True,
                            related_name='drying_batches')
    
    notes = models.TextField(blank=True, null=True)
    is_destroyed = models.BooleanField(default=False)
    destroy_reason = models.TextField(blank=True, null=True)
    destroyed_at = models.DateTimeField(blank=True, null=True)
    destroyed_by = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='destroyed_drying_batches')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    converted_to_processing = models.BooleanField(default=False)
    converted_to_processing_at = models.DateTimeField(blank=True, null=True)
    processing_batch = models.ForeignKey('ProcessingBatch', on_delete=models.SET_NULL, 
                                        related_name='source_drying', null=True, blank=True)
    
    def save(self, *args, **kwargs):
        # Generiere Batch-Nummer falls nicht vorhanden
        if not self.batch_number:
            today = timezone.now()
            # Zähle Trocknungen, die heute erstellt wurden
            count = DryingBatch.objects.filter(
                created_at__year=today.year,
                created_at__month=today.month,
                created_at__day=today.day
            ).count() + 1
            
            # Generiere Batch-Nummer
            self.batch_number = f"charge:drying:{today.strftime('%d:%m:%Y')}:{count:04d}"
        
        # Berechne Gewichtsverlust-Prozentsatz (kann später für Statistiken genutzt werden)
        if not hasattr(self, 'weight_loss_percentage') and self.initial_weight and self.final_weight:
            if float(self.initial_weight) > 0:
                self.weight_loss_percentage = (1 - (float(self.final_weight) / float(self.initial_weight))) * 100
            else:
                self.weight_loss_percentage = 0
        
        super().save(*args, **kwargs)
    
    @property
    def weight_loss(self):
        """Gibt den absoluten Gewichtsverlust in Gramm zurück."""
        if self.initial_weight and self.final_weight:
            return float(self.initial_weight) - float(self.final_weight)
        return 0
    
    @property
    def weight_loss_percentage(self):
        """Gibt den prozentualen Gewichtsverlust zurück."""
        if self.initial_weight and self.final_weight and float(self.initial_weight) > 0:
            return (1 - (float(self.final_weight) / float(self.initial_weight))) * 100
        return 0
    
    @property
    def source_strain(self):
        """Gibt die Genetik der Quelle zurück."""
        if self.harvest_batch:
            return self.harvest_batch.source_strain
        return "Unbekannt"
    
    def generate_batch_number(self):
        """Generiert eine eindeutige Batch-Nummer für Trocknungen"""
        prefix = "drying"  # WICHTIG: Muss "drying" sein!
        
        # Aktuelles Datum
        now = timezone.now()
        date_part = now.strftime("%d:%m:%Y")
        
        # Zähler für den Tag
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Zähle Batches vom gleichen Tag
        count = DryingBatch.objects.filter(
            created_at__range=(start_of_day, end_of_day)
        ).count()
        
        # Batch-Nummer mit führenden Nullen
        batch_number = f"{prefix}:{date_part}:{count + 1:04d}"
        
        return batch_number
    
    def save(self, *args, **kwargs):
        if not self.batch_number:
            self.batch_number = self.generate_batch_number()
        super().save(*args, **kwargs)  
    
# Produkt-Typen als Choices
PRODUCT_TYPE_CHOICES = [
    ('marijuana', 'Marihuana'),
    ('hashish', 'Haschisch'),
    # Erweiterbar für zukünftige Produkte
]

class ProcessingBatch(models.Model):
    """Modell für die Verarbeitung getrockneter Cannabis zu Endprodukten (Marihuana, Haschisch)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    
    # Quelle der Verarbeitung (Trocknung)
    drying_batch = models.ForeignKey(DryingBatch, on_delete=models.CASCADE, 
                                     related_name='processing_batches')
    
    # Typ des Produkts
    product_type = models.CharField(max_length=20, choices=PRODUCT_TYPE_CHOICES)
    
    # Gewichte in Gramm
    input_weight = models.DecimalField(max_digits=8, decimal_places=2)  # Gewicht aus der Trocknung
    output_weight = models.DecimalField(max_digits=8, decimal_places=2)  # Gewicht des Endprodukts
    
    # Mitglieder- und Raumzuordnung
    member = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True,
                              related_name='processing_batches')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True,
                            related_name='processing_batches')
    
    notes = models.TextField(blank=True, null=True)
    is_destroyed = models.BooleanField(default=False)
    destroy_reason = models.TextField(blank=True, null=True)
    destroyed_at = models.DateTimeField(blank=True, null=True)
    destroyed_by = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='destroyed_processing_batches')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            # Index für Produkttyp-Filter
            models.Index(
                fields=['product_type'], 
                name='processing_batch_type_idx'
            ),
        ]
    
    def save(self, *args, **kwargs):
        # Generiere Batch-Nummer falls nicht vorhanden
        if not self.batch_number:
            today = timezone.now()
            # Erstelle ein Präfix basierend auf dem Produkttyp
            prefix = "marijuana" if self.product_type == "marijuana" else "hashish"
            
            # Zähle Verarbeitungs-Batches dieses Typs, die heute erstellt wurden
            count = ProcessingBatch.objects.filter(
                created_at__year=today.year,
                created_at__month=today.month,
                created_at__day=today.day,
                product_type=self.product_type
            ).count() + 1
            
            # Generiere Batch-Nummer mit Produkttyp im Prefix
            self.batch_number = f"charge:{prefix}:{today.strftime('%d:%m:%Y')}:{count:04d}"
        
        # Berechne Ausbeute-Prozentsatz
        if not hasattr(self, 'yield_percentage') and self.input_weight and self.output_weight:
            if float(self.input_weight) > 0:
                self.yield_percentage = (float(self.output_weight) / float(self.input_weight)) * 100
            else:
                self.yield_percentage = 0
        
        super().save(*args, **kwargs)
    
    @property
    def yield_percentage(self):
        """Gibt den prozentualen Anteil des Outputs im Verhältnis zum Input zurück."""
        if self.input_weight and self.output_weight and float(self.input_weight) > 0:
            return (float(self.output_weight) / float(self.input_weight)) * 100
        return 0
    
    @property
    def waste_weight(self):
        """Gibt das Gewicht des Abfalls/Verlusts in Gramm zurück."""
        if self.input_weight and self.output_weight:
            return float(self.input_weight) - float(self.output_weight)
        return 0
    
    @property
    def source_strain(self):
        """Gibt die Genetik der Quelle zurück."""
        if self.drying_batch:
            return self.drying_batch.source_strain
        return "Unbekannt"
    
    def __str__(self):
        product_type_display = dict(PRODUCT_TYPE_CHOICES).get(self.product_type, self.product_type)
        return f"{product_type_display} {self.batch_number} ({self.output_weight}g)"
    
# models.py (Erweiterung)

# Nach der ProcessingBatch-Klasse hinzufügen:

class LabTestingBatch(models.Model):
    """Modell für die Laborkontrolle von verarbeiteten Cannabis-Produkten"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    
    # Quelle der Laborkontrolle (Verarbeitung)
    processing_batch = models.ForeignKey(ProcessingBatch, on_delete=models.CASCADE, 
                                         related_name='lab_testing_batches')
    
    # Gewichte in Gramm
    input_weight = models.DecimalField(max_digits=8, decimal_places=2)  # Gewicht aus der Verarbeitung
    sample_weight = models.DecimalField(max_digits=8, decimal_places=2)  # Gewicht der Laborprobe
    
    # Status der Laborprobe
    LAB_STATUS_CHOICES = [
        ('pending', 'In Bearbeitung'),
        ('passed', 'Freigegeben'),
        ('failed', 'Nicht bestanden'),
    ]
    status = models.CharField(max_length=20, choices=LAB_STATUS_CHOICES, default='pending')
    thc_content = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # THC-Gehalt in %
    cbd_content = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # CBD-Gehalt in %
    lab_notes = models.TextField(blank=True, null=True)  # Laborbericht
    
    # Mitglieder- und Raumzuordnung
    member = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True,
                              related_name='lab_testing_batches')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True,
                            related_name='lab_testing_batches')
    
    notes = models.TextField(blank=True, null=True)
    is_destroyed = models.BooleanField(default=False)
    destroy_reason = models.TextField(blank=True, null=True)
    destroyed_at = models.DateTimeField(blank=True, null=True)
    destroyed_by = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='destroyed_lab_testing_batches')
    
    # Felder für die Überführung zur Verpackung
    converted_to_packaging = models.BooleanField(default=False)
    converted_to_packaging_at = models.DateTimeField(blank=True, null=True)
    packaging_batch = models.ForeignKey('PackagingBatch', on_delete=models.SET_NULL, 
                                      related_name='source_lab_testing', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            # Index für THC-Gehalt (für Filter und Sortierung)
            models.Index(
                fields=['thc_content'], 
                name='lab_testing_thc_idx'
            ),
            
            # Index für Processing-Batch Relations
            models.Index(
                fields=['processing_batch'], 
                name='lab_testing_processing_idx'
            )
        ]
    
    def save(self, *args, **kwargs):
        # Generiere Batch-Nummer falls nicht vorhanden
        if not self.batch_number:
            today = timezone.now()
            # Erstelle ein Präfix basierend auf dem Produkttyp der Quelle
            prefix = "labtesting"
            if self.processing_batch:
                prefix = f"labtesting-{self.processing_batch.product_type}"
            
            # Zähle Laborkontroll-Batches, die heute erstellt wurden
            count = LabTestingBatch.objects.filter(
                created_at__year=today.year,
                created_at__month=today.month,
                created_at__day=today.day
            ).count() + 1
            
            # Generiere Batch-Nummer mit Präfix
            self.batch_number = f"charge:{prefix}:{today.strftime('%d:%m:%Y')}:{count:04d}"
        
        super().save(*args, **kwargs)
    
    @property
    def remaining_weight(self):
        """Gibt das verbleibende Gewicht nach Abzug der Laborprobe zurück."""
        if self.input_weight and self.sample_weight:
            return float(self.input_weight) - float(self.sample_weight)
        return 0
    
    @property
    def source_strain(self):
        """Gibt die Genetik der Quelle zurück."""
        if self.processing_batch:
            return self.processing_batch.source_strain
        return "Unbekannt"
    
    @property
    def product_type(self):
        """Gibt den Produkttyp der Quelle zurück."""
        if self.processing_batch:
            return self.processing_batch.product_type
        return "Unbekannt"
    
    @property
    def product_type_display(self):
        """Gibt den formatierten Produkttyp der Quelle zurück."""
        if self.processing_batch:
            return self.processing_batch.product_type_display
        return "Unbekannt"

class PackagingBatch(models.Model):
    """Modell für die Verpackung von freigegeben Produkten nach der Laborkontrolle"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    
    # Quelle der Verpackung (Laborkontrolle)
    lab_testing_batch = models.ForeignKey(LabTestingBatch, on_delete=models.CASCADE, 
                                         related_name='packaging_batches')
    
    # Verpackungsinformationen
    total_weight = models.DecimalField(max_digits=8, decimal_places=2)  # Gesamtgewicht
    unit_count = models.PositiveIntegerField()  # Anzahl der Verpackungseinheiten
    unit_weight = models.DecimalField(max_digits=6, decimal_places=2)  # Gewicht pro Einheit in Gramm
    
    # 🆕 NEUE PREISFELDER HINZUFÜGEN:
    price_per_gram = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Preis pro Gramm in Euro"
    )
    total_batch_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Gesamtpreis für diese Verpackung (automatisch berechnet)"
    )
    unit_price = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Preis pro Verpackungseinheit (automatisch berechnet)"
    )
    
    # Mitglieder- und Raumzuordnung
    member = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True,
                              related_name='packaging_batches')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True,
                            related_name='packaging_batches')
    
    notes = models.TextField(blank=True, null=True)
    is_destroyed = models.BooleanField(default=False)
    destroy_reason = models.TextField(blank=True, null=True)
    destroyed_at = models.DateTimeField(blank=True, null=True)
    destroyed_by = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='destroyed_packaging_batches')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            # Index für Lab-Testing-Batch Relations
            models.Index(
                fields=['lab_testing_batch'], 
                name='packaging_batch_lab_idx'
            ),
            
            # Index für Batch-Nummer
            models.Index(
                fields=['batch_number'], 
                name='packaging_batch_number_idx'
            ),
            
            # Index für Erstellungsdatum
            models.Index(
                fields=['-created_at'], 
                name='packaging_batch_created_idx'
            )
        ]
    
    def save(self, *args, **kwargs):
        # Speichere zuerst den Status, bevor der erste save
        creating = self.pk is None
        
        if not self.batch_number:
            today = timezone.now()
            prefix = "packaging"
            if self.lab_testing_batch and self.lab_testing_batch.processing_batch:
                prefix = f"packaging-{self.lab_testing_batch.processing_batch.product_type}"
            
            count = PackagingBatch.objects.filter(
                created_at__year=today.year,
                created_at__month=today.month,
                created_at__day=today.day
            ).count() + 1
            
            self.batch_number = f"charge:{prefix}:{today.strftime('%d:%m:%Y')}:{count:04d}"
        
        # 🆕 AUTOMATISCHE PREISBERECHNUNG:
        if self.price_per_gram and self.total_weight:
            # Berechne Gesamtpreis der Verpackung
            self.total_batch_price = float(self.price_per_gram) * float(self.total_weight)
            
            # Berechne Preis pro Verpackungseinheit
            if self.unit_weight:
                self.unit_price = float(self.price_per_gram) * float(self.unit_weight)
        
        super().save(*args, **kwargs)
        
        # Prüfe, ob Units existieren - wenn nicht, erstelle sie
        if self.unit_count > 0 and not self.is_destroyed:
            units_count = self.units.count()
            if units_count == 0:
                print(f"DEBUG: ERSTELLE UNITS - Anzahl: {self.unit_count}")
                for _ in range(self.unit_count):
                    PackagingUnit.objects.create(
                        batch=self,
                        weight=self.unit_weight,
                        notes=f"Automatisch erstellt aus Batch {self.batch_number}"
                    )
    
    @property
    def source_strain(self):
        """Gibt die Genetik der Quelle zurück."""
        if self.lab_testing_batch:
            return self.lab_testing_batch.source_strain
        return "Unbekannt"
    
    @property
    def product_type(self):
        """Gibt den Produkttyp der Quelle zurück."""
        if self.lab_testing_batch and self.lab_testing_batch.processing_batch:
            return self.lab_testing_batch.processing_batch.product_type
        return "Unbekannt"
    
    @property
    def product_type_display(self):
        """Gibt den formatierten Produkttyp der Quelle zurück."""
        if self.lab_testing_batch and self.lab_testing_batch.processing_batch:
            return self.lab_testing_batch.processing_batch.product_type_display
        return "Unbekannt"
    
    @property
    def thc_content(self):
        """Gibt den THC-Gehalt aus der Laborprobe zurück."""
        if self.lab_testing_batch:
            return self.lab_testing_batch.thc_content
        return None
    
    @property
    def cbd_content(self):
        """Gibt den CBD-Gehalt aus der Laborprobe zurück."""
        if self.lab_testing_batch:
            return self.lab_testing_batch.cbd_content
        return None
    

class PackagingUnit(models.Model):
    """Modell für individuelle Verpackungseinheiten innerhalb eines Verpackungs-Batches"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch = models.ForeignKey(PackagingBatch, related_name='units', on_delete=models.CASCADE)
    batch_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    weight = models.DecimalField(max_digits=6, decimal_places=2)  # Gewicht in Gramm
    notes = models.TextField(blank=True, null=True)
    
    # 🆕 NEUES PREISFELD HINZUFÜGEN:
    unit_price = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Preis für diese Verpackungseinheit in Euro"
    )
    
    # Mitgliederzuordnung für Vernichtung
    destroyed_by = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='destroyed_packaging_units')
    
    is_destroyed = models.BooleanField(default=False)
    destroy_reason = models.TextField(blank=True, null=True)
    destroyed_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        # 🔧 KORRIGIERTE INDIZES - nur existierende Fields verwenden
        indexes = [
            # Basis-Index für Verfügbarkeits-Filter
            models.Index(
                fields=['is_destroyed'], 
                name='packaging_unit_available_idx'
            ),
            
            # Index für Gewichts-Filter
            models.Index(
                fields=['weight'], 
                name='packaging_unit_weight_idx'
            ),
            
            # Index für Batch-Relation
            models.Index(
                fields=['batch'], 
                name='packaging_unit_batch_idx'
            ),
            
            # Composite Index für häufige Kombinationen
            models.Index(
                fields=['is_destroyed', 'weight'], 
                name='packaging_unit_filters_idx'
            ),
            
            # Index für Erstellungsdatum (für Sortierung)
            models.Index(
                fields=['-created_at'], 
                name='packaging_unit_created_idx'
            )
        ]
        
        # 🔧 KORRIGIERTES ORDERING - nur direkte Fields
        ordering = ['-created_at', 'batch_number']
    
    def save(self, *args, **kwargs):
        # Generiere Batch-Nummer falls nicht vorhanden
        if not self.batch_number:
            today = timezone.now()
            # Zähle Verpackungseinheiten, die heute erstellt wurden
            count = PackagingUnit.objects.filter(
                created_at__year=today.year,
                created_at__month=today.month,
                created_at__day=today.day
            ).count() + 1
            
            # Produkttyp aus dem übergeordneten Batch ermitteln
            product_type_prefix = "pack"
            if self.batch.lab_testing_batch and self.batch.lab_testing_batch.processing_batch:
                product_type = self.batch.lab_testing_batch.processing_batch.product_type
                product_type_prefix = f"pack-{product_type}"
            
            # Generiere Batch-Nummer
            self.batch_number = f"unit:{product_type_prefix}:{today.strftime('%d:%m:%Y')}:{count:04d}"
        
        # 🆕 PREISBERECHNUNG AUS DEM BATCH, FALLS NICHT GESETZT:
        if not self.unit_price and self.batch and self.batch.price_per_gram and self.weight:
            self.unit_price = float(self.batch.price_per_gram) * float(self.weight)
        
        super().save(*args, **kwargs)
    
    @property
    def price_per_gram_calculated(self):
        """Berechnet den Preis pro Gramm für diese Einheit"""
        if self.unit_price and self.weight and float(self.weight) > 0:
            return float(self.unit_price) / float(self.weight)
        return None

class ProductDistribution(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    
    # Verknüpfung zu verteilten Verpackungseinheiten
    packaging_units = models.ManyToManyField(PackagingUnit, related_name='distributions')
    
    # Mitarbeiter und Empfänger
    distributor = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, 
                                    related_name='distributed_products')
    recipient = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, 
                                  related_name='received_products')
    
    # Ausgabeinformationen
    distribution_date = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True, null=True)
    
    # 🆕 Neue Preis-Felder
    total_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        verbose_name="Gesamtpreis"
    )
    
    balance_before = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        verbose_name="Kontostand vorher"
    )
    
    balance_after = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        verbose_name="Kontostand nachher"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.batch_number:
            today = timezone.now()
            count = ProductDistribution.objects.filter(
                created_at__year=today.year,
                created_at__month=today.month,
                created_at__day=today.day
            ).count() + 1
            
            self.batch_number = f"distro:{today.strftime('%d:%m:%Y')}:{count:04d}"
        
        super().save(*args, **kwargs)
    
    @property
    def total_weight(self):
        """Berechnet das Gesamtgewicht aller verteilten Verpackungseinheiten."""
        return sum(float(unit.weight) for unit in self.packaging_units.all())
    
    @property
    def product_types(self):
        """Gibt eine Zusammenfassung der Produkttypen zurück."""
        types = {}
        for unit in self.packaging_units.all():
            product_type = unit.batch.product_type if unit.batch else "Unbekannt"
            types[product_type] = types.get(product_type, 0) + float(unit.weight)
        return types
    
    # 🆕 Property für Preisberechnung
    @property
    def calculated_total_price(self):
        """Berechnet den Gesamtpreis basierend auf den Verpackungseinheiten"""
        if self.total_price:
            return float(self.total_price)
        
        total = 0
        for unit in self.packaging_units.all():
            if unit.unit_price:
                total += float(unit.unit_price)
        return total
    
    @property
    def price_per_gram(self):
        """Berechnet den durchschnittlichen Preis pro Gramm"""
        if self.total_weight > 0:
            return self.calculated_total_price / self.total_weight
        return 0
    
    def __str__(self):
        return f"Distribution {self.batch_number} - {self.recipient} ({self.total_weight}g)"
    
    class Meta:
        ordering = ['-distribution_date']
        verbose_name = "Cannabis-Ausgabe"
        verbose_name_plural = "Cannabis-Ausgaben"

import io
from PIL import Image
from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from members.models import Member  # Anpassen je nach deiner App-Struktur


class BaseProductImage(models.Model):
    """Abstrakte Basisklasse für Produktbilder UND Videos im Track & Trace System"""
    
    # Bild-Feld (jetzt optional, da entweder Bild ODER Video)
    image = models.ImageField(
        upload_to='trackandtrace/images/%Y/%m/%d/',
        blank=True,
        null=True,
        help_text="Bild-Datei (JPEG, PNG, etc.)"
    )
    
    # Thumbnail (automatisch generiert für Bilder)
    thumbnail = models.ImageField(
        upload_to='trackandtrace/thumbnails/%Y/%m/%d/', 
        blank=True, 
        null=True,
        help_text="Automatisch generiertes Vorschaubild"
    )
    
    # NEU: Video-Feld
    video = models.FileField(
        upload_to='trackandtrace/videos/%Y/%m/%d/',
        blank=True,
        null=True,
        validators=[
            FileExtensionValidator(allowed_extensions=['mp4', 'mov', 'avi', 'webm', 'mkv'])
        ],
        help_text="Video-Datei (max. 100MB)"
    )
    
    # NEU: Media-Type für einfachere Unterscheidung
    media_type = models.CharField(
        max_length=10,
        choices=[
            ('image', 'Bild'),
            ('video', 'Video'),
        ],
        default='image',
        editable=False  # Wird automatisch gesetzt
    )
    
    # Metadaten
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    image_type = models.CharField(
        max_length=50, 
        choices=[
            ('overview', 'Übersicht'),
            ('detail', 'Detail'),
            ('quality', 'Qualitätskontrolle'),
            ('documentation', 'Dokumentation'),
        ], 
        default='overview',
        help_text="Art/Zweck der Aufnahme"
    )
    
    # Tracking
    uploaded_by = models.ForeignKey(
        Member, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='uploaded_%(class)s_media'  # Angepasst für Bilder UND Videos
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        abstract = True
        ordering = ['-uploaded_at']
    
    def clean(self):
        """Validierung: Entweder Bild ODER Video, nicht beides"""
        super().clean()
        if self.image and self.video:
            raise ValidationError("Es kann nur entweder ein Bild oder ein Video hochgeladen werden, nicht beides.")
        if not self.image and not self.video:
            raise ValidationError("Es muss entweder ein Bild oder ein Video hochgeladen werden.")
    
    def make_thumbnail(self):
        """Erstellt automatisch ein Thumbnail (150x150px) - nur für Bilder"""
        if not self.image:
            return None
            
        img = Image.open(self.image)
        
        # Konvertiere RGBA zu RGB falls nötig
        if img.mode in ('RGBA', 'LA', 'P'):
            # Erstelle einen weißen Hintergrund
            background = Image.new('RGB', img.size, (255, 255, 255))
            # Konvertiere zu RGB
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        
        # Thumbnail erstellen
        img.thumbnail((150, 150), Image.Resampling.LANCZOS)
        
        thumb_io = io.BytesIO()
        img.save(thumb_io, format='JPEG', quality=85)
        thumb_io.seek(0)
        
        # Generiere Dateinamen für Thumbnail
        thumb_filename = f"thumb_{self.image.name.split('/')[-1]}"
        # Ändere Dateiendung zu .jpg falls nötig
        if not thumb_filename.lower().endswith(('.jpg', '.jpeg')):
            thumb_filename = thumb_filename.rsplit('.', 1)[0] + '.jpg'
        
        # Speichere Thumbnail
        self.thumbnail.save(thumb_filename, thumb_io, save=False)
        
        return self.thumbnail
    
    def save(self, *args, **kwargs):
        # Automatisch media_type setzen basierend auf hochgeladenem Content
        if self.video:
            self.media_type = 'video'
        else:
            self.media_type = 'image'
        
        # Speichere zuerst das Objekt
        super().save(*args, **kwargs)
        
        # Generiere Thumbnail nur für Bilder und nur wenn noch keins existiert
        if self.image and self.media_type == 'image' and not self.thumbnail:
            self.make_thumbnail()
            # Speichere nochmal um das Thumbnail zu persistieren
            super().save(update_fields=['thumbnail'])
    
    def get_media_url(self):
        """Hilfsmethode um die URL des Mediums zu bekommen (Bild oder Video)"""
        if self.media_type == 'video' and self.video:
            return self.video.url
        elif self.media_type == 'image' and self.image:
            return self.image.url
        return None
    
    def get_display_url(self):
        """Gibt die URL für die Anzeige zurück (Thumbnail für Bilder, Video-URL für Videos)"""
        if self.media_type == 'image' and self.thumbnail:
            return self.thumbnail.url
        return self.get_media_url()
    
    def __str__(self):
        media_str = "Video" if self.media_type == 'video' else "Bild"
        return f"{media_str}: {self.title or 'Unbenannt'} ({self.get_image_type_display()})"

# Konkrete Image-Models für jeden Schritt:

class SeedPurchaseImage(BaseProductImage):
    seed_purchase = models.ForeignKey(
        SeedPurchase, 
        related_name='images', 
        on_delete=models.CASCADE
    )
    
    def __str__(self):
        return f"Bild für {self.seed_purchase.batch_number} - {self.title or 'Ohne Titel'}"


class MotherPlantBatchImage(BaseProductImage):
    mother_plant_batch = models.ForeignKey(
        MotherPlantBatch, 
        related_name='images', 
        on_delete=models.CASCADE
    )
    growth_stage = models.CharField(
        max_length=50, 
        blank=True,
        choices=[
            ('seedling', 'Sämling'),
            ('vegetative', 'Vegetativ'),
            ('pre_flowering', 'Vorblüte'),
            ('mother', 'Mutterpflanze')
        ],
        help_text="Wachstumsstadium der Pflanzen"
    )
    
    def __str__(self):
        return f"Bild für {self.mother_plant_batch.batch_number} - {self.title or 'Ohne Titel'}"
    
class CuttingBatchImage(BaseProductImage):
    cutting_batch = models.ForeignKey(
        CuttingBatch, 
        related_name='images', 
        on_delete=models.CASCADE
    )
    
    def __str__(self):
        return f"Bild für {self.cutting_batch.batch_number} - {self.title or 'Ohne Titel'}"
    
class BloomingCuttingBatchImage(BaseProductImage):
    blooming_cutting_batch = models.ForeignKey(
        BloomingCuttingBatch, 
        related_name='images', 
        on_delete=models.CASCADE
    )
    
    def __str__(self):
        return f"Bild für {self.blooming_cutting_batch.batch_number} - {self.title or 'Ohne Titel'}"
    
class FloweringPlantBatchImage(BaseProductImage):
    """Bilder für Blühpflanzen direkt aus Samen"""
    flowering_plant_batch = models.ForeignKey(
        'FloweringPlantBatch',
        on_delete=models.CASCADE,
        related_name='images'
    )
    
    class Meta:
        db_table = 'trackandtrace_flowering_plant_batch_image'
        verbose_name = 'Blühpflanzen-Batch Bild'
        verbose_name_plural = 'Blühpflanzen-Batch Bilder'
        ordering = ['-uploaded_at']

class HarvestBatchImage(BaseProductImage):
    """Bilder für Ernte-Chargen"""
    harvest_batch = models.ForeignKey(
        'HarvestBatch',
        on_delete=models.CASCADE,
        related_name='images'
    )
    
    # Zusätzliches Feld für Ernte-Stadium
    harvest_stage = models.CharField(
        max_length=50,
        blank=True,
        choices=[
            ('fresh', 'Frisch geerntet'),
            ('trimmed', 'Getrimmt'),
            ('packed', 'Verpackt für Trocknung'),
        ],
        help_text="Stadium der Ernte"
    )
    
    class Meta:
        db_table = 'trackandtrace_harvest_batch_image'
        verbose_name = 'Ernte-Batch Bild'
        verbose_name_plural = 'Ernte-Batch Bilder'
        ordering = ['-uploaded_at']

class DryingBatchImage(BaseProductImage):
    """Bilder und Videos für Trocknungs-Chargen"""
    drying_batch = models.ForeignKey(
        'DryingBatch',
        on_delete=models.CASCADE,
        related_name='images'  # Behalten wir als 'images' für Kompatibilität
    )
    
    # Zusätzliches Feld für Trocknungs-Stadium
    drying_stage = models.CharField(
        max_length=50,
        blank=True,
        choices=[
            ('wet', 'Feucht (Tag 1-3)'),
            ('drying', 'Trocknend (Tag 4-7)'),
            ('dry', 'Trocken (Tag 8+)'),
            ('curing', 'Reifend'),
        ],
        help_text="Stadium der Trocknung"
    )
    
    class Meta:
        db_table = 'trackandtrace_drying_batch_image'
        verbose_name = 'Trocknungs-Batch Bild/Video'
        verbose_name_plural = 'Trocknungs-Batch Bilder/Videos'
        ordering = ['-uploaded_at']

class ProcessingBatchImage(BaseProductImage):
    """Bilder und Videos für Verarbeitungs-Chargen"""
    processing_batch = models.ForeignKey(
        'ProcessingBatch',
        on_delete=models.CASCADE,
        related_name='images'
    )
    
    # Zusätzliches Feld für Verarbeitungs-Stadium
    processing_stage = models.CharField(
        max_length=50,
        blank=True,
        choices=[
            ('input', 'Input Material'),
            ('processing', 'Während der Verarbeitung'),
            ('output', 'Fertiges Produkt'),
            ('quality', 'Qualitätskontrolle'),
        ],
        help_text="Stadium der Verarbeitung"
    )
    
    # Produkttyp-spezifisches Feld
    product_quality = models.CharField(
        max_length=50,
        blank=True,
        choices=[
            ('premium', 'Premium Qualität'),
            ('standard', 'Standard Qualität'),
            ('budget', 'Budget Qualität'),
        ],
        help_text="Qualitätseinstufung des Produkts"
    )
    
    class Meta:
        db_table = 'trackandtrace_processing_batch_image'
        verbose_name = 'Verarbeitungs-Batch Bild/Video'
        verbose_name_plural = 'Verarbeitungs-Batch Bilder/Videos'
        ordering = ['-uploaded_at']

class LabTestingBatchImage(BaseProductImage):
    """Bilder und Videos für Laborkontroll-Chargen"""
    lab_testing_batch = models.ForeignKey(
        'LabTestingBatch',
        on_delete=models.CASCADE,
        related_name='images'
    )
    
    # Zusätzliches Feld für Test-Stadium
    test_stage = models.CharField(
        max_length=50,
        blank=True,
        choices=[
            ('sample_prep', 'Probenvorbereitung'),
            ('testing', 'Während des Tests'),
            ('results', 'Testergebnisse'),
            ('microscopy', 'Mikroskopie'),
            ('chromatography', 'Chromatographie'),
        ],
        help_text="Stadium des Labortests"
    )
    
    # Test-spezifisches Feld
    test_type = models.CharField(
        max_length=50,
        blank=True,
        choices=[
            ('cannabinoid', 'Cannabinoid-Profil'),
            ('terpene', 'Terpen-Analyse'),
            ('microbial', 'Mikrobiologie'),
            ('pesticide', 'Pestizid-Screening'),
            ('heavy_metal', 'Schwermetalle'),
            ('visual', 'Visuelle Inspektion'),
        ],
        help_text="Art des durchgeführten Tests"
    )
    
    class Meta:
        db_table = 'trackandtrace_lab_testing_batch_image'
        verbose_name = 'Laborkontroll-Batch Bild/Video'
        verbose_name_plural = 'Laborkontroll-Batch Bilder/Videos'
        ordering = ['-uploaded_at']

class PackagingBatchImage(BaseProductImage):
    """Bilder und Videos für Verpackungs-Chargen"""
    packaging_batch = models.ForeignKey(
        'PackagingBatch',
        on_delete=models.CASCADE,
        related_name='images'
    )
    
    # Zusätzliches Feld für Verpackungs-Stadium
    packaging_stage = models.CharField(
        max_length=50,
        blank=True,
        choices=[
            ('pre_packaging', 'Vor der Verpackung'),
            ('packaging_process', 'Während der Verpackung'),
            ('final_product', 'Fertiges Produkt'),
            ('labeling', 'Etikettierung'),
            ('sealing', 'Versiegelung'),
            ('batch_photo', 'Chargen-Übersicht'),
        ],
        help_text="Stadium der Verpackung"
    )
    
    # Verpackungs-spezifisches Feld
    package_type = models.CharField(
        max_length=50,
        blank=True,
        choices=[
            ('primary', 'Primärverpackung'),
            ('secondary', 'Sekundärverpackung'),
            ('label', 'Etikett/Label'),
            ('seal', 'Siegel/Verschluss'),
            ('batch_overview', 'Chargen-Übersicht'),
        ],
        help_text="Art der dokumentierten Verpackung"
    )
    
    class Meta:
        db_table = 'trackandtrace_packaging_batch_image'
        verbose_name = 'Verpackungs-Batch Bild/Video'
        verbose_name_plural = 'Verpackungs-Batch Bilder/Videos'
        ordering = ['-uploaded_at']


