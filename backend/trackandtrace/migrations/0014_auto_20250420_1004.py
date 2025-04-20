from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('trackandtrace', '0013_auto_20250420_1001'),
    ]

    operations = [
        # Legacy-Hersteller-Feld als Sicherung hinzufügen
        migrations.AddField(
            model_name='seedpurchase',
            name='manufacturer_name',
            field=models.CharField(blank=True, help_text='Name des Herstellers (Legacy-Feld)', max_length=255),
        ),
        # FK-Felder für Hersteller und Sorte hinzufügen (nullable)
        migrations.AddField(
            model_name='seedpurchase',
            name='manufacturer_id',
            field=models.ForeignKey(
                blank=True,
                help_text='Hersteller/Lieferant der Samen',
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='seed_purchases',
                to='trackandtrace.manufacturer'
            ),
        ),
        migrations.AddField(
            model_name='seedpurchase',
            name='strain',
            field=models.ForeignKey(
                blank=True,
                help_text='Cannabis-Sorte',
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='seed_purchases',
                to='trackandtrace.strain'
            ),
        ),
    ]