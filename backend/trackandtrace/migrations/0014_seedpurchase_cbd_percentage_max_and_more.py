# Generated by Django 5.2.1 on 2025-05-10 08:06

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('trackandtrace', '0013_packagingunit'),
        ('wawi', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='seedpurchase',
            name='cbd_percentage_max',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
        migrations.AddField(
            model_name='seedpurchase',
            name='cbd_percentage_min',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
        migrations.AddField(
            model_name='seedpurchase',
            name='flowering_time_max',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='seedpurchase',
            name='flowering_time_min',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='seedpurchase',
            name='strain',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='seed_purchases', to='wawi.cannabisstrain'),
        ),
        migrations.AddField(
            model_name='seedpurchase',
            name='thc_percentage_max',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
        migrations.AddField(
            model_name='seedpurchase',
            name='thc_percentage_min',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
    ]
