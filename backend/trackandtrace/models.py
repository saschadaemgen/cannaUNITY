# backend/trackandtrace/models.py
from django.db import models
import uuid

class SeedPurchase(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    strain_name = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField(default=1)
    remaining_quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_destroyed = models.BooleanField(default=False)
    destroy_reason = models.TextField(blank=True, null=True)
    destroyed_at = models.DateTimeField(null=True, blank=True)
    original_seed = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='destroyed_seeds')

    def __str__(self):
        return self.strain_name

class MotherPlantBatch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seed_purchase = models.ForeignKey(SeedPurchase, on_delete=models.CASCADE, related_name='mother_batches')
    quantity = models.PositiveIntegerField(default=1)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Mutterpflanzen-Batch von {self.seed_purchase.strain_name} ({self.quantity} Stück)"

class MotherPlant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch = models.ForeignKey(MotherPlantBatch, on_delete=models.CASCADE, related_name='plants')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_destroyed = models.BooleanField(default=False)
    destroy_reason = models.TextField(blank=True, null=True)
    destroyed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Mutterpflanze von {self.batch.seed_purchase.strain_name}"

class FloweringPlantBatch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seed_purchase = models.ForeignKey(SeedPurchase, on_delete=models.CASCADE, related_name='flowering_batches')
    quantity = models.PositiveIntegerField(default=1)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Blühpflanzen-Batch von {self.seed_purchase.strain_name} ({self.quantity} Stück)"

class FloweringPlant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch = models.ForeignKey(FloweringPlantBatch, on_delete=models.CASCADE, related_name='plants')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_destroyed = models.BooleanField(default=False)
    destroy_reason = models.TextField(blank=True, null=True)
    destroyed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Blühpflanze von {self.batch.seed_purchase.strain_name}"