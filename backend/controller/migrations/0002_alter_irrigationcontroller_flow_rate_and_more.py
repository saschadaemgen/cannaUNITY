# Generated by Django 5.2.1 on 2025-05-17 08:28

import django.core.validators
from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('controller', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='irrigationcontroller',
            name='flow_rate',
            field=models.DecimalField(decimal_places=2, default=1.0, max_digits=8, validators=[django.core.validators.MinValueValidator(Decimal('0.01'))], verbose_name='Durchflussrate (l/min)'),
        ),
        migrations.AlterField(
            model_name='irrigationcontroller',
            name='max_volume_per_day',
            field=models.DecimalField(blank=True, decimal_places=2, help_text='Maximale Wassermenge pro Tag (0 für unbegrenzt)', max_digits=10, null=True, validators=[django.core.validators.MinValueValidator(Decimal('0.01'))], verbose_name='Max. Volumen pro Tag (l)'),
        ),
        migrations.AlterField(
            model_name='irrigationschedule',
            name='volume',
            field=models.DecimalField(blank=True, decimal_places=2, help_text='Zu verabreichende Wassermenge (wenn leer, wird aus Durchflussrate und Dauer berechnet)', max_digits=8, null=True, validators=[django.core.validators.MinValueValidator(Decimal('0.01'))], verbose_name='Volumen (l)'),
        ),
    ]
