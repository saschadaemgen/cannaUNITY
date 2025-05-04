python manage.py shell    

from trackandtrace.models import (
    SeedPurchase, MotherPlantBatch, MotherPlant, 
    FloweringPlantBatch, FloweringPlant, 
    CuttingBatch, Cutting, BloomingCuttingBatch, BloomingCuttingPlant,
    HarvestBatch, DryingBatch, ProcessingBatch,
    LabTestingBatch, PackagingBatch, PackagingUnit  # PackagingUnit hinzugefügt
)

# Zuerst die Anzahl der Objekte zählen, die gelöscht werden
seed_count = SeedPurchase.objects.count()
mother_batch_count = MotherPlantBatch.objects.count()
mother_plant_count = MotherPlant.objects.count()
flowering_batch_count = FloweringPlantBatch.objects.count()
flowering_plant_count = FloweringPlant.objects.count()
cutting_batch_count = CuttingBatch.objects.count()
cutting_count = Cutting.objects.count()
blooming_cutting_batch_count = BloomingCuttingBatch.objects.count()
blooming_cutting_plant_count = BloomingCuttingPlant.objects.count()
harvest_count = HarvestBatch.objects.count()
drying_count = DryingBatch.objects.count()
processing_count = ProcessingBatch.objects.count()
labtesting_count = LabTestingBatch.objects.count()
packaging_unit_count = PackagingUnit.objects.count()  # Neue Zeile
packaging_count = PackagingBatch.objects.count()

print("Lösche alle Track & Trace-Daten...\n")

# Löschen der letzten Stufen zuerst aufgrund der Fremdschlüsselbeziehungen

# Löschen aller Verpackungseinheiten (neue Zeile)
packaging_unit_deleted, _ = PackagingUnit.objects.all().delete()
print(f"✓ {packaging_unit_count} Verpackungseinheiten wurden gelöscht.")

# Löschen aller Verpackungen
packaging_deleted, _ = PackagingBatch.objects.all().delete()
print(f"✓ {packaging_count} Verpackungen wurden gelöscht.")

# Löschen aller Laborkontrollen
labtesting_deleted, _ = LabTestingBatch.objects.all().delete()
print(f"✓ {labtesting_count} Laborkontrollen wurden gelöscht.")

# Löschen aller Verarbeitungen
processing_deleted, _ = ProcessingBatch.objects.all().delete()
print(f"✓ {processing_count} Verarbeitungen wurden gelöscht.")

# Löschen aller Trocknungen
drying_deleted, _ = DryingBatch.objects.all().delete()
print(f"✓ {drying_count} Trocknungen wurden gelöscht.")

# Löschen aller Ernten
harvest_deleted, _ = HarvestBatch.objects.all().delete()
print(f"✓ {harvest_count} Ernten wurden gelöscht.")

# Löschen aller Blühpflanzen aus Stecklingen
blooming_cutting_plant_deleted, _ = BloomingCuttingPlant.objects.all().delete()
print(f"✓ {blooming_cutting_plant_count} Blühpflanzen aus Stecklingen wurden gelöscht.")

# Löschen aller Blühpflanzen-aus-Stecklingen-Batches
blooming_cutting_batch_deleted, _ = BloomingCuttingBatch.objects.all().delete()
print(f"✓ {blooming_cutting_batch_count} Blühpflanzen-aus-Stecklingen-Batches wurden gelöscht.")

# Löschen aller Stecklinge
cutting_deleted, _ = Cutting.objects.all().delete()
print(f"✓ {cutting_count} Stecklinge wurden gelöscht.")

# Löschen aller Stecklinge-Batches
cutting_batch_deleted, _ = CuttingBatch.objects.all().delete()
print(f"✓ {cutting_batch_count} Stecklinge-Batches wurden gelöscht.")

# Löschen aller Blühpflanzen
flowering_deleted, _ = FloweringPlant.objects.all().delete()
print(f"✓ {flowering_plant_count} Blühpflanzen wurden gelöscht.")

# Löschen aller Blühpflanzen-Batches
flowering_batch_deleted, _ = FloweringPlantBatch.objects.all().delete()
print(f"✓ {flowering_batch_count} Blühpflanzen-Batches wurden gelöscht.")

# Löschen aller Mutterpflanzen
mother_deleted, _ = MotherPlant.objects.all().delete()
print(f"✓ {mother_plant_count} Mutterpflanzen wurden gelöscht.")

# Löschen aller Mutterpflanzen-Batches
mother_batch_deleted, _ = MotherPlantBatch.objects.all().delete()
print(f"✓ {mother_batch_count} Mutterpflanzen-Batches wurden gelöscht.")

# Löschen aller Samen
seed_deleted, _ = SeedPurchase.objects.all().delete()
print(f"✓ {seed_count} Sameneinträge wurden gelöscht.")

# Gesamtzahl gelöschter Datensätze berechnen
total_deleted = (
    packaging_unit_deleted +  # Neue Zeile
    packaging_deleted + labtesting_deleted + processing_deleted + 
    drying_deleted + harvest_deleted + 
    blooming_cutting_plant_deleted + blooming_cutting_batch_deleted +
    cutting_deleted + cutting_batch_deleted +
    flowering_deleted + flowering_batch_deleted + 
    mother_deleted + mother_batch_deleted + 
    seed_deleted
)

print(f"\nAlle Track and Trace Daten wurden erfolgreich gelöscht. Insgesamt wurden {total_deleted} Datensätze entfernt.")