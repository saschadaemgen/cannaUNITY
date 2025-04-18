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
    
    # Vernichtung
    is_destroyed = models.BooleanField(default=False)
    destruction_reason = models.CharField(max_length=255, blank=True)
    destruction_date = models.DateTimeField(null=True, blank=True)
    destroying_member = models.ForeignKey(
        Member,
        on_delete=models.PROTECT,
        related_name="%(class)s_destructions",
        null=True,
        blank=True,
        help_text="Mitglied, das die Vernichtung durchgeführt hat"
    )
    
    # Überführung
    is_transferred = models.BooleanField(default=False)
    transfer_date = models.DateTimeField(null=True, blank=True)
    transferring_member = models.ForeignKey(
        Member,
        on_delete=models.PROTECT,
        related_name="%(class)s_transfers",
        null=True,
        blank=True,
        help_text="Mitglied, das die Überführung durchgeführt hat"
    )
    
    # Umgebungsdaten
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
    # Raumzuordnung
    room = models.ForeignKey(
        'rooms.Room',  # String-Referenz um zirkuläre Imports zu vermeiden
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)ss",
        help_text="Raum, in dem dieser Prozessschritt stattfindet"
    )
    
    class Meta:
        abstract = True

    def mark_as_destroyed(self, reason, destroying_member):
        """Markiert einen Eintrag als vernichtet"""
        self.is_destroyed = True
        self.destruction_reason = reason
        self.destruction_date = timezone.now()
        self.destroying_member = destroying_member
        self.save()
        
    def mark_as_transferred(self, transferring_member):
        """Markiert einen Eintrag als übergeführt"""
        self.is_transferred = True
        self.transfer_date = timezone.now()
        self.transferring_member = transferring_member
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


class MotherPlant(BaseTrackingModel):
    """Modell für Mutterpflanzen, die aus Samen gezogen werden"""
    batch_number = models.CharField(
        max_length=50, 
        unique=True,
        help_text="Automatisch generierte Chargennummer (MOTHER_YYYYMMDD_NNN)"
    )
    seed_source = models.ForeignKey(
        SeedPurchase,
        on_delete=models.PROTECT,
        related_name="mother_plants",
        help_text="Ursprung der Mutterpflanze (Sameneinkauf)"
    )
    planting_date = models.DateField(help_text="Datum der Aussaat")
    genetic_name = models.CharField(
        max_length=255, 
        help_text="Genetische Bezeichnung"
    )
    plant_count = models.IntegerField(
        help_text="Anzahl der gepflanzten Mutterpflanzen"
    )
    remaining_plants = models.IntegerField(
        help_text="Anzahl der verbleibenden Mutterpflanzen"
    )
    growth_phase = models.CharField(
        max_length=50,
        choices=[
            ('seedling', 'Keimling'),
            ('vegetative', 'Vegetative Phase'),
            ('mother', 'Mutterpflanze'),
        ],
        default='seedling',
        help_text="Aktuelle Wachstumsphase"
    )
    growth_medium = models.CharField(
        max_length=255, 
        help_text="Wachstumsmedium (z.B. Erde, Kokos, Hydrokultur)",
        blank=True
    )
    fertilizer = models.CharField(
        max_length=255, 
        help_text="Verwendete Düngemittel",
        blank=True
    )
    light_cycle = models.CharField(
        max_length=50, 
        help_text="Lichtzyklus (z.B. 18/6, 24/0)",
        default="18/6",
        blank=True
    )
    image = models.ImageField(
        upload_to='mother_plants/', 
        null=True, 
        blank=True,
        help_text="Bild der Mutterpflanzen"
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.SET_NULL,  # Wenn ein Raum gelöscht wird, bleibt der Eintrag bestehen
        null=True,
        blank=True,
        related_name="%(class)ss",  # Dynamischer related_name basierend auf der Klasse
        help_text="Raum, in dem dieser Prozessschritt stattfindet"
    )
    
    class Meta:
        verbose_name = "Mutterpflanze"
        verbose_name_plural = "Mutterpflanzen"
        ordering = ['-planting_date', 'genetic_name']
    
    def __str__(self):
        return f"{self.genetic_name} ({self.batch_number})"
    
    def save(self, *args, **kwargs):
        # Automatische Batch-Nummer generieren, wenn nicht vorhanden
        if not self.batch_number:
            today = timezone.now().strftime('%Y%m%d')
            last_batch = MotherPlant.objects.filter(
                batch_number__startswith=f"MOTHER_{today}"
            ).order_by('batch_number').last()
            
            if last_batch:
                last_num = int(last_batch.batch_number.split('_')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
                
            self.batch_number = f"MOTHER_{today}_{new_num:03d}"
        
        # Bei erster Erstellung
        if self._state.adding:
            # Remaining-Plants ist initial gleich Plant-Count
            self.remaining_plants = self.plant_count
            
            # Verfügbare Samen reduzieren
            if self.seed_source and not self.seed_source.is_destroyed:
                # Überprüfen, ob genügend Samen verfügbar sind
                if self.seed_source.remaining_seeds < self.plant_count:
                    raise ValueError(
                        f"Nicht genügend Samen verfügbar. Vorhanden: {self.seed_source.remaining_seeds}, Benötigt: {self.plant_count}"
                    )
                
                # Anzahl der verwendeten Samen vom Quell-Samen abziehen
                self.seed_source.remaining_seeds -= self.plant_count
                self.seed_source.save()
            
        super().save(*args, **kwargs)

class Cutting(BaseTrackingModel):
    """Modell für Stecklinge, die von Mutterpflanzen geschnitten werden"""
    batch_number = models.CharField(
        max_length=50, 
        unique=True,
        help_text="Automatisch generierte Chargennummer (CUT_YYYYMMDD_NNN)"
    )
    mother_plant_source = models.ForeignKey(
        MotherPlant,
        on_delete=models.PROTECT,
        related_name="cuttings",
        help_text="Ursprung der Stecklinge (Mutterpflanze)"
    )
    cutting_date = models.DateField(help_text="Datum des Schneidens")
    genetic_name = models.CharField(
        max_length=255, 
        help_text="Genetische Bezeichnung (von der Mutterpflanze übernommen)"
    )
    cutting_count = models.IntegerField(
        help_text="Anzahl der geschnittenen Stecklinge"
    )
    remaining_cuttings = models.IntegerField(
        help_text="Anzahl der verbleibenden Stecklinge"
    )
    growth_phase = models.CharField(
        max_length=50,
        choices=[
            ('cutting', 'Frischer Schnitt'),
            ('rooting', 'Bewurzelung'),
            ('vegetative', 'Vegetative Phase'),
        ],
        default='cutting',
        help_text="Aktuelle Wachstumsphase"
    )
    growth_medium = models.CharField(
        max_length=255, 
        help_text="Wachstumsmedium (z.B. Erde, Kokos, Wasser)",
        blank=True
    )
    rooting_agent = models.CharField(
        max_length=255, 
        help_text="Verwendetes Bewurzelungsmittel",
        blank=True
    )
    light_cycle = models.CharField(
        max_length=50, 
        help_text="Lichtzyklus (z.B. 18/6, 24/0)",
        default="18/6",
        blank=True
    )
    image = models.ImageField(
        upload_to='cuttings/', 
        null=True, 
        blank=True,
        help_text="Bild der Stecklinge"
    )
    
    class Meta:
        verbose_name = "Steckling"
        verbose_name_plural = "Stecklinge"
        ordering = ['-cutting_date', 'genetic_name']
    
    def __str__(self):
        return f"{self.genetic_name} ({self.batch_number})"
    
    def save(self, *args, **kwargs):
        # Automatische Batch-Nummer generieren, wenn nicht vorhanden
        if not self.batch_number:
            today = timezone.now().strftime('%Y%m%d')
            last_batch = Cutting.objects.filter(
                batch_number__startswith=f"CUT_{today}"
            ).order_by('batch_number').last()
            
            if last_batch:
                last_num = int(last_batch.batch_number.split('_')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
                
            self.batch_number = f"CUT_{today}_{new_num:03d}"
        
        # Bei erster Erstellung
        if self._state.adding:
            # Genetik von der Mutterpflanze übernehmen, wenn nicht gesetzt
            if not self.genetic_name and self.mother_plant_source:
                self.genetic_name = self.mother_plant_source.genetic_name
                
            # Remaining-Cuttings ist initial gleich Cutting-Count
            self.remaining_cuttings = self.cutting_count
        
        super().save(*args, **kwargs)


class FloweringPlant(BaseTrackingModel):
    """Modell für Blühpflanzen, die entweder aus Samen oder Stecklingen gezogen werden"""
    batch_number = models.CharField(
        max_length=50, 
        unique=True,
        help_text="Automatisch generierte Chargennummer (FLOWER_YYYYMMDD_NNN)"
    )
    # Duale Herkunft (entweder aus Samen oder aus Stecklingen)
    seed_source = models.ForeignKey(
        SeedPurchase,
        on_delete=models.PROTECT,
        related_name="flowering_plants",
        null=True,
        blank=True,
        help_text="Ursprung der Blühpflanze (Sameneinkauf), wenn direkt aus Samen"
    )
    cutting_source = models.ForeignKey(
        Cutting,
        on_delete=models.PROTECT,
        related_name="flowering_plants",
        null=True,
        blank=True,
        help_text="Ursprung der Blühpflanze (Steckling), wenn aus Steckling"
    )
    planting_date = models.DateField(help_text="Datum der Aussaat/Einpflanzung")
    genetic_name = models.CharField(
        max_length=255, 
        help_text="Genetische Bezeichnung (übernommen von Quelle)"
    )
    plant_count = models.IntegerField(
        help_text="Anzahl der gepflanzten Blühpflanzen"
    )
    remaining_plants = models.IntegerField(
        help_text="Anzahl der verbleibenden Blühpflanzen"
    )
    growth_phase = models.CharField(
        max_length=50,
        choices=[
            ('vegetative', 'Vegetative Phase'),
            ('pre_flower', 'Vorblüte'),
            ('flowering', 'Blütephase'),
            ('late_flower', 'Spätblüte'),
            ('harvest_ready', 'Erntereif'),
        ],
        default='vegetative',
        help_text="Aktuelle Wachstumsphase"
    )
    growth_medium = models.CharField(
        max_length=255, 
        help_text="Wachstumsmedium (z.B. Erde, Kokos, Hydrokultur)",
        blank=True
    )
    fertilizer = models.CharField(
        max_length=255, 
        help_text="Verwendete Düngemittel",
        blank=True
    )
    light_cycle = models.CharField(
        max_length=50, 
        help_text="Lichtzyklus (z.B. 12/12, 11/13)",
        default="12/12",
        blank=True
    )
    expected_harvest_date = models.DateField(
        null=True,
        blank=True,
        help_text="Erwartetes Erntedatum"
    )
    image = models.ImageField(
        upload_to='flowering_plants/', 
        null=True, 
        blank=True,
        help_text="Bild der Blühpflanzen"
    )
    
    class Meta:
        verbose_name = "Blühpflanze"
        verbose_name_plural = "Blühpflanzen"
        ordering = ['-planting_date', 'genetic_name']
    
    def __str__(self):
        return f"{self.genetic_name} ({self.batch_number})"
    
    def save(self, *args, **kwargs):
        # Automatische Batch-Nummer generieren, wenn nicht vorhanden
        if not self.batch_number:
            today = timezone.now().strftime('%Y%m%d')
            last_batch = FloweringPlant.objects.filter(
                batch_number__startswith=f"FLOWER_{today}"
            ).order_by('batch_number').last()
            
            if last_batch:
                last_num = int(last_batch.batch_number.split('_')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
                
            self.batch_number = f"FLOWER_{today}_{new_num:03d}"
        
        # Bei erster Erstellung
        is_new = self._state.adding
        
        if is_new:
            # Remaining-Plants ist initial gleich Plant-Count
            self.remaining_plants = self.plant_count
            
            # Automatische Genetik-Übernahme von Quelle
            if not self.genetic_name:
                if self.seed_source:
                    self.genetic_name = self.seed_source.strain_name
                elif self.cutting_source:
                    self.genetic_name = self.cutting_source.genetic_name
            
            # Überprüfung: Entweder Samen ODER Steckling muss angegeben sein, nicht beides
            if bool(self.seed_source) == bool(self.cutting_source):
                raise ValueError(
                    "Entweder muss eine Samenquelle ODER eine Stecklingsquelle angegeben werden, nicht beide oder keine."
                )
            
            # Quell-Objekt als übergeführt markieren und Anzahl reduzieren
            if self.seed_source and not self.seed_source.is_destroyed and not self.seed_source.is_transferred:
                # Überprüfen, ob genügend Samen verfügbar sind
                if self.seed_source.remaining_seeds < self.plant_count:
                    raise ValueError(
                        f"Nicht genügend Samen verfügbar. Vorhanden: {self.seed_source.remaining_seeds}, Benötigt: {self.plant_count}"
                    )
                # Samen abziehen
                self.seed_source.remaining_seeds -= self.plant_count
                # Wenn keine Samen mehr übrig, als übergeführt markieren
                if self.seed_source.remaining_seeds == 0:
                    self.seed_source.mark_as_transferred(self.responsible_member)
                else:
                    self.seed_source.save()
            
            elif self.cutting_source and not self.cutting_source.is_destroyed and not self.cutting_source.is_transferred:
                # Überprüfen, ob genügend Stecklinge verfügbar sind
                if self.cutting_source.remaining_cuttings < self.plant_count:
                    raise ValueError(
                        f"Nicht genügend Stecklinge verfügbar. Vorhanden: {self.cutting_source.remaining_cuttings}, Benötigt: {self.plant_count}"
                    )
                # Stecklinge abziehen
                self.cutting_source.remaining_cuttings -= self.plant_count
                # Wenn keine Stecklinge mehr übrig, als übergeführt markieren
                if self.cutting_source.remaining_cuttings == 0:
                    self.cutting_source.mark_as_transferred(self.responsible_member)
                else:
                    self.cutting_source.save()
        
        super().save(*args, **kwargs)