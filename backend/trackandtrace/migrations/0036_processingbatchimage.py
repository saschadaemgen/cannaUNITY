# Generated by Django 5.2.2 on 2025-06-25 10:46

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('members', '0012_remove_member_unifi_user_id'),
        ('trackandtrace', '0035_bloomingcuttingbatchimage_media_type_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProcessingBatchImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(blank=True, help_text='Bild-Datei (JPEG, PNG, etc.)', null=True, upload_to='trackandtrace/images/%Y/%m/%d/')),
                ('thumbnail', models.ImageField(blank=True, help_text='Automatisch generiertes Vorschaubild', null=True, upload_to='trackandtrace/thumbnails/%Y/%m/%d/')),
                ('video', models.FileField(blank=True, help_text='Video-Datei (max. 100MB)', null=True, upload_to='trackandtrace/videos/%Y/%m/%d/', validators=[django.core.validators.FileExtensionValidator(allowed_extensions=['mp4', 'mov', 'avi', 'webm', 'mkv'])])),
                ('media_type', models.CharField(choices=[('image', 'Bild'), ('video', 'Video')], default='image', editable=False, max_length=10)),
                ('title', models.CharField(blank=True, max_length=200)),
                ('description', models.TextField(blank=True)),
                ('image_type', models.CharField(choices=[('overview', 'Übersicht'), ('detail', 'Detail'), ('quality', 'Qualitätskontrolle'), ('documentation', 'Dokumentation')], default='overview', help_text='Art/Zweck der Aufnahme', max_length=50)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('processing_stage', models.CharField(blank=True, choices=[('input', 'Input Material'), ('processing', 'Während der Verarbeitung'), ('output', 'Fertiges Produkt'), ('quality', 'Qualitätskontrolle')], help_text='Stadium der Verarbeitung', max_length=50)),
                ('product_quality', models.CharField(blank=True, choices=[('premium', 'Premium Qualität'), ('standard', 'Standard Qualität'), ('budget', 'Budget Qualität')], help_text='Qualitätseinstufung des Produkts', max_length=50)),
                ('processing_batch', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='trackandtrace.processingbatch')),
                ('uploaded_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='uploaded_%(class)s_media', to='members.member')),
            ],
            options={
                'verbose_name': 'Verarbeitungs-Batch Bild/Video',
                'verbose_name_plural': 'Verarbeitungs-Batch Bilder/Videos',
                'db_table': 'trackandtrace_processing_batch_image',
                'ordering': ['-uploaded_at'],
            },
        ),
    ]
