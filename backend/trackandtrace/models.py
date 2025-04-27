import uuid
from django.db import models
from django.utils import timezone
from members.models import Member
from rooms.models import Room

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