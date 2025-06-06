# Generated by Django 5.2.1 on 2025-06-04 15:26

import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('wawi', '0003_strainhistory_changes_strainhistory_image_data'),
    ]

    operations = [
        migrations.CreateModel(
            name='StrainPriceTier',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('tier_name', models.CharField(blank=True, max_length=100, verbose_name='Staffelbezeichnung')),
                ('quantity', models.IntegerField(verbose_name='Menge (Samen)')),
                ('total_price', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='Gesamtpreis')),
                ('is_default', models.BooleanField(default=False, verbose_name='Standardpreis')),
                ('sold_quantity', models.IntegerField(default=0, verbose_name='Verkaufte Menge')),
                ('in_cultivation', models.IntegerField(default=0, verbose_name='In Anzucht')),
                ('in_flowering', models.IntegerField(default=0, verbose_name='In Blüte')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('strain', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='price_tiers', to='wawi.cannabisstrain')),
            ],
            options={
                'verbose_name': 'Preisstaffel',
                'verbose_name_plural': 'Preisstaffeln',
                'ordering': ['quantity'],
                'unique_together': {('strain', 'quantity')},
            },
        ),
    ]
