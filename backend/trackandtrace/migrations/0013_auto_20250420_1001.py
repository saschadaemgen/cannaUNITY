# Neue Migration
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('trackandtrace', '0012_packaging_productdistribution'),
    ]

    operations = [
        # Nur die Manufacturer- und Strain-Modelle erstellen
        migrations.CreateModel(
            name='Manufacturer',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='Name des Herstellers', max_length=255, unique=True)),
                ('website', models.URLField(blank=True, help_text='Website des Herstellers')),
                ('country', models.CharField(blank=True, help_text='Herkunftsland des Herstellers', max_length=100)),
                ('notes', models.TextField(blank=True, help_text='Zusätzliche Informationen zum Hersteller')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Hersteller',
                'verbose_name_plural': 'Hersteller',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Strain',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('strain_name', models.CharField(help_text='Name der Cannabis-Sorte', max_length=255)),
                ('genetics', models.CharField(blank=True, help_text='Genetische Abstammung', max_length=255)),
                ('sativa_percentage', models.IntegerField(default=50, help_text='Sativa-Anteil in Prozent')),
                ('indica_percentage', models.IntegerField(default=50, help_text='Indica-Anteil in Prozent')),
                ('thc_value', models.DecimalField(blank=True, decimal_places=2, help_text='THC-Gehalt laut Hersteller in %', max_digits=5, null=True)),
                ('cbd_value', models.DecimalField(blank=True, decimal_places=2, help_text='CBD-Gehalt laut Hersteller in %', max_digits=5, null=True)),
                ('flowering_time', models.PositiveIntegerField(blank=True, help_text='Blütezeit in Wochen', null=True)),
                ('notes', models.TextField(blank=True, help_text='Zusätzliche Informationen zur Sorte')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('manufacturer', models.ForeignKey(help_text='Hersteller der Sorte', on_delete=django.db.models.deletion.CASCADE, related_name='strains', to='trackandtrace.manufacturer')),
            ],
            options={
                'verbose_name': 'Cannabis-Sorte',
                'verbose_name_plural': 'Cannabis-Sorten',
                'ordering': ['manufacturer__name', 'strain_name'],
                'unique_together': {('manufacturer', 'strain_name')},
            },
        ),
    ]