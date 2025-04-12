from django.db import models

class Room(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    capacity = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    # created_by-Feld wurde entfernt
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name