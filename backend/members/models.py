from django.db import models
import uuid

class Member(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, null=True)
    birthdate = models.DateField(null=True, blank=True)
    zip_code = models.CharField(max_length=10, blank=True)
    city = models.CharField(max_length=100, blank=True)
    street = models.CharField(max_length=100, blank=True)
    house_number = models.CharField(max_length=10, blank=True)
    kontostand = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    physical_limitations = models.TextField(blank=True)
    mental_limitations = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    warnings = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
