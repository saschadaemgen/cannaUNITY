# trackandtrace/models.py
import uuid
from django.db import models
from django.utils import timezone
from members.models import Member
from rooms.models import Room

class BaseTrackingModel(models.Model):
    """Basis-Modell für alle Track & Trace Einträge"""
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    responsible_member = models.ForeignKey(
        Member, 
        on_delete=models.PROTECT,
        related_name="%(class)s_responsibilities"
    )
    notes = models.TextField(blank=True)
    is_destroyed = models.BooleanField(default=False)
    destruction_reason = models.CharField(max_length=255, blank=True)
    destruction_date = models.DateTimeField(null=True, blank=True)
    temperature = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Temperatur während des Arbeitsschritts in °C"
    )
    humidity = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Luftfeuchtigkeit während des Arbeitsschritts in %"
    )
    
    class Meta:
        abstract = True

    def mark_as_destroyed(self, reason):
        """Markiert einen Eintrag als vernichtet"""
        self.is_destroyed = True
        self.destruction_reason = reason
        self.destruction_date = timezone.now()
        self.save()


class SeedPurchase(BaseTrackingModel):
    """Modell für den Samen-Einkauf (erster Schritt)"""
    batch_number = models.CharField(
        max_length=50, 
        unique=True,
        help_text="Automatisch generierte Chargennummer (SEED_YYYYMMDD_NNN)"
    )
    manufacturer = models.CharField(max_length=255, help_text="Hersteller/Lieferant der Samen")
    genetics = models.CharField(max_length=255, help_text="Genetische Abstammung")
    strain_name = models.CharField(max_length=255, help_text="Name der Cannabis-Sorte")
    sativa_percentage = models.IntegerField(help_text="Sativa-Anteil in Prozent")
    indica_percentage = models.IntegerField(help_text="Indica-Anteil in Prozent")
    thc_value = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="THC-Gehalt laut Hersteller in %"
    )
    cbd_value = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="CBD-Gehalt laut Hersteller in %"
    )
    purchase_date = models.DateField(help_text="Kaufdatum der Samen")
    total_seeds = models.IntegerField(help_text="Anzahl gekaufter Samen")
    remaining_seeds = models.IntegerField(help_text="Anzahl verbleibender Samen")
    image = models.ImageField(
        upload_to='seeds/', 
        null=True, 
        blank=True,
        help_text="Bild der Samen oder Verpackung"
    )
    document = models.FileField(
        upload_to='seed_docs/', 
        null=True, 
        blank=True,
        help_text="Begleitdokumente (Kaufbeleg, Zertifikate, etc.)"
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="seed_purchases",
        help_text="Raum, in dem die Samen gelagert werden"
    )
    
    class Meta:
        verbose_name = "Samen-Einkauf"
        verbose_name_plural = "Samen-Einkäufe"
        ordering = ['-purchase_date', 'strain_name']
    
    def __str__(self):
        return f"{self.strain_name} ({self.batch_number})"
    
    def save(self, *args, **kwargs):
        # Automatische Batch-Nummer generieren, wenn nicht vorhanden
        if not self.batch_number:
            today = timezone.now().strftime('%Y%m%d')
            last_batch = SeedPurchase.objects.filter(
                batch_number__startswith=f"SEED_{today}"
            ).order_by('batch_number').last()
            
            if last_batch:
                last_num = int(last_batch.batch_number.split('_')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
                
            self.batch_number = f"SEED_{today}_{new_num:03d}"
            
        # Bei erster Erstellung remaining_seeds = total_seeds
        if self._state.adding:  # Besser als `if not self.pk`
            self.remaining_seeds = self.total_seeds
            
        super().save(*args, **kwargs)


