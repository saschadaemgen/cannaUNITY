# Generated by Django 5.2.1 on 2025-05-19 15:48

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='NfcDebugLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('token', models.CharField(max_length=128)),
                ('status', models.CharField(max_length=32)),
                ('raw_data', models.TextField(blank=True)),
            ],
        ),
    ]
