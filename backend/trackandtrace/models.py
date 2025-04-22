import uuid
from django.db import models
from django.utils import timezone

class SeedPurchase(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    strain_name = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField()
    remaining_quantity = models.PositiveIntegerField()
    
    is_destroyed = models.BooleanField(default=False)
    destroy_reason = models.TextField(blank=True, null=True)
    destroyed_at = models.DateTimeField(blank=True, null=True)
    
    original_seed = models.ForeignKey('self', blank=True, null=True, on_delete=models.SET_NULL, 
                                     related_name='derived_seeds')
    
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
            self.batch_number = f"seed:{today.strftime('%d:%m:%Y')}:{count:04d}"
        
        super().save(*args, **kwargs)

class MotherPlantBatch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    
    seed_purchase = models.ForeignKey(SeedPurchase, related_name='mother_batches', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    notes = models.TextField(blank=True, null=True)
    
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
    notes = models.TextField(blank=True, null=True)
    
    is_destroyed = models.BooleanField(default=False)
    destroy_reason = models.TextField(blank=True, null=True)
    destroyed_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class FloweringPlantBatch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    
    seed_purchase = models.ForeignKey(SeedPurchase, related_name='flowering_batches', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    notes = models.TextField(blank=True, null=True)
    
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
    notes = models.TextField(blank=True, null=True)
    
    is_destroyed = models.BooleanField(default=False)
    destroy_reason = models.TextField(blank=True, null=True)
    destroyed_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)