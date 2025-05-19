# backend/laborreports/models.py
from django.db import models
import uuid

class LaboratoryReport(models.Model):
    """Hauptmodell für Laborberichte."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report_number = models.CharField(max_length=50, unique=True, db_index=True)
    sample_id = models.CharField(max_length=100, db_index=True)
    sample_name = models.CharField(max_length=200)
    sample_type = models.CharField(max_length=100)
    
    # Personen (später aus Mitgliederdatenbank)
    collection_person = models.CharField(max_length=200, help_text="Person, die die Probe gesammelt hat")
    analysis_person = models.CharField(max_length=200, help_text="Person, die die Analyse durchgeführt hat")
    approval_person = models.CharField(max_length=200, help_text="Person, die den Bericht freigegeben hat")
    
    # Daten
    collection_date = models.DateField()
    analysis_date = models.DateField()
    approval_date = models.DateField(null=True, blank=True)
    
    # GMP/GACP-Konformität
    is_gmp_compliant = models.BooleanField(default=False)
    is_gacp_compliant = models.BooleanField(default=False)
    
    # Ergebnisse
    overall_status = models.CharField(
        max_length=20, 
        choices=[
            ('passed', 'Bestanden'),
            ('failed', 'Nicht bestanden'),
            ('pending', 'Ausstehend')
        ],
        default='pending'
    )
    notes = models.TextField(blank=True)
    
    # Metadaten
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Track & Trace Integration (Platzhalter)
    track_and_trace_batch = models.CharField(max_length=100, blank=True, null=True, 
                                            help_text="Batch-ID aus Track & Trace (zukünftige Integration)")
    
    def __str__(self):
        return f"Laborbericht {self.report_number} - {self.sample_name}"
    
    class Meta:
        verbose_name = "Laborbericht"
        verbose_name_plural = "Laborberichte"

class CannabinoidProfile(models.Model):
    """Cannabinoid-Profil für einen Laborbericht."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.OneToOneField(
        LaboratoryReport,
        on_delete=models.CASCADE,
        related_name='cannabinoid_profile'
    )
    
    # Cannabinoid-Werte in Prozent
    thc = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name="THC")
    thca = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name="THCA")
    cbd = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name="CBD")
    cbda = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name="CBDA")
    cbn = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name="CBN")
    cbg = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name="CBG")
    cbga = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name="CBGA")
    
    # Berechnete Gesamtwerte
    total_thc = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name="Gesamt-THC")
    total_cbd = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name="Gesamt-CBD")
    total_cannabinoids = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name="Gesamt-Cannabinoide")
    
    notes = models.TextField(blank=True, verbose_name="Anmerkungen")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Cannabinoid-Profil für {self.report}"
    
    def save(self, *args, **kwargs):
        # Berechnung der Gesamtwerte vor dem Speichern
        self.total_thc = float(self.thc) + (float(self.thca) * 0.877)
        self.total_cbd = float(self.cbd) + (float(self.cbda) * 0.877)
        self.total_cannabinoids = float(self.thc) + float(self.thca) + float(self.cbd) + \
                               float(self.cbda) + float(self.cbn) + float(self.cbg) + float(self.cbga)
        super().save(*args, **kwargs)
    
    class Meta:
        verbose_name = "Cannabinoid-Profil"
        verbose_name_plural = "Cannabinoid-Profile"

class TerpeneProfile(models.Model):
    """Terpen-Profil für einen Laborbericht."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.OneToOneField(
        LaboratoryReport,
        on_delete=models.CASCADE,
        related_name='terpene_profile'
    )
    
    # Terpen-Werte in Prozent
    myrcene = models.DecimalField(max_digits=5, decimal_places=3, default=0)
    limonene = models.DecimalField(max_digits=5, decimal_places=3, default=0)
    caryophyllene = models.DecimalField(max_digits=5, decimal_places=3, default=0)
    terpinolene = models.DecimalField(max_digits=5, decimal_places=3, default=0)
    linalool = models.DecimalField(max_digits=5, decimal_places=3, default=0)
    pinene = models.DecimalField(max_digits=5, decimal_places=3, default=0)
    humulene = models.DecimalField(max_digits=5, decimal_places=3, default=0)
    ocimene = models.DecimalField(max_digits=5, decimal_places=3, default=0)
    
    total_terpenes = models.DecimalField(max_digits=5, decimal_places=3, default=0, verbose_name="Gesamt-Terpene")
    
    notes = models.TextField(blank=True, verbose_name="Anmerkungen")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Terpen-Profil für {self.report}"
    
    def save(self, *args, **kwargs):
        # Berechnung der Gesamtwerte vor dem Speichern
        self.total_terpenes = float(self.myrcene) + float(self.limonene) + \
                            float(self.caryophyllene) + float(self.terpinolene) + \
                            float(self.linalool) + float(self.pinene) + \
                            float(self.humulene) + float(self.ocimene)
        super().save(*args, **kwargs)
    
    class Meta:
        verbose_name = "Terpen-Profil"
        verbose_name_plural = "Terpen-Profile"

class ContaminantCategory(models.Model):
    """Kategorien für Verunreinigungen."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = "Verunreinigungskategorie"
        verbose_name_plural = "Verunreinigungskategorien"

class ContaminantTest(models.Model):
    """Test auf Verunreinigungen für einen Laborbericht."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(
        LaboratoryReport,
        on_delete=models.CASCADE,
        related_name='contaminant_tests'
    )
    category = models.ForeignKey(
        ContaminantCategory,
        on_delete=models.PROTECT,
        related_name='tests'
    )
    
    name = models.CharField(max_length=100, verbose_name="Verunreinigungsname")
    threshold_value = models.DecimalField(
        max_digits=10, 
        decimal_places=4,
        verbose_name="Grenzwert"
    )
    detected_value = models.DecimalField(
        max_digits=10, 
        decimal_places=4,
        verbose_name="Gemessener Wert"
    )
    unit = models.CharField(
        max_length=20, 
        default="ppm",
        verbose_name="Einheit"
    )
    
    status = models.CharField(
        max_length=20, 
        choices=[
            ('passed', 'Bestanden'),
            ('failed', 'Nicht bestanden'),
            ('pending', 'Ausstehend')
        ],
        default='pending',
        verbose_name="Status"
    )
    
    notes = models.TextField(blank=True, verbose_name="Anmerkungen")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} Test für {self.report}"
    
    def save(self, *args, **kwargs):
        # Automatische Statusbestimmung basierend auf Grenzwerten
        if self.detected_value <= self.threshold_value:
            self.status = 'passed'
        else:
            self.status = 'failed'
        super().save(*args, **kwargs)
    
    class Meta:
        verbose_name = "Verunreinigungstest"
        verbose_name_plural = "Verunreinigungstests"
        unique_together = ('report', 'name')