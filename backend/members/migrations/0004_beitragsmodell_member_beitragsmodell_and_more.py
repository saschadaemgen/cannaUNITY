# Generated by Django 5.2 on 2025-04-17 13:34

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('members', '0003_qualitycomponent'),
    ]

    operations = [
        migrations.CreateModel(
            name='Beitragsmodell',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('beschreibung', models.TextField(blank=True)),
                ('maximalmenge', models.PositiveIntegerField(help_text='Maximale Menge pro Monat in Gramm')),
                ('preis_monatlich', models.DecimalField(decimal_places=2, max_digits=8)),
                ('ist_mixmodell', models.BooleanField(default=False)),
            ],
        ),
        migrations.AddField(
            model_name='member',
            name='beitragsmodell',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='members.beitragsmodell'),
        ),
        migrations.CreateModel(
            name='BeitragsmodellEintrag',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('qualitaetsstufe', models.CharField(choices=[('Q1', 'Q1'), ('Q2', 'Q2'), ('Q3', 'Q3')], max_length=2)),
                ('menge', models.PositiveIntegerField()),
                ('preis_pro_gramm', models.DecimalField(decimal_places=2, max_digits=5)),
                ('modell', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='eintraege', to='members.beitragsmodell')),
            ],
        ),
    ]
