# backend/laborreports/serializers.py
from rest_framework import serializers
from .models import (
    LaboratoryReport, 
    CannabinoidProfile, 
    TerpeneProfile, 
    ContaminantCategory, 
    ContaminantTest
)

class CannabinoidProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CannabinoidProfile
        fields = '__all__'  # Muss "__all__" oder eine Liste sein
        read_only_fields = ('total_thc', 'total_cbd', 'total_cannabinoids')

class TerpeneProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TerpeneProfile
        fields = '__all__'  # Muss "__all__" oder eine Liste sein
        read_only_fields = ('total_terpenes',)

class ContaminantCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ContaminantCategory
        fields = '__all__'

class ContaminantTestSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = ContaminantTest
        fields = '__all__'
        read_only_fields = ('status',)

class ContaminantTestNestedSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = ContaminantTest
        exclude = ('report',)  # Hier ist exclude korrekt
        read_only_fields = ('status',)

# Separate Write-Serializer für verschachtelte Daten
class CannabinoidProfileNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = CannabinoidProfile
        exclude = ('report', 'id', 'created_at', 'updated_at')
        read_only_fields = ('total_thc', 'total_cbd', 'total_cannabinoids')

class TerpeneProfileNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = TerpeneProfile
        exclude = ('report', 'id', 'created_at', 'updated_at')
        read_only_fields = ('total_terpenes',)

class LaboratoryReportListSerializer(serializers.ModelSerializer):
    class Meta:
        model = LaboratoryReport
        fields = [
            'id', 'report_number', 'sample_name', 'sample_type',
            'analysis_date', 'overall_status', 'created_at'
        ]

class LaboratoryReportDetailSerializer(serializers.ModelSerializer):
    cannabinoid_profile = CannabinoidProfileNestedSerializer(required=False)  # Verwenden Sie den Nested-Serializer
    terpene_profile = TerpeneProfileNestedSerializer(required=False)  # Verwenden Sie den Nested-Serializer
    contaminant_tests = ContaminantTestNestedSerializer(many=True, required=False)
    
    class Meta:
        model = LaboratoryReport
        fields = '__all__'
    
    def create(self, validated_data):
        cannabinoid_data = validated_data.pop('cannabinoid_profile', None)
        terpene_data = validated_data.pop('terpene_profile', None)
        contaminant_tests_data = validated_data.pop('contaminant_tests', [])
        
        # Laborbericht erstellen
        report = LaboratoryReport.objects.create(**validated_data)
        
        # Cannabinoid-Profil erstellen, falls vorhanden
        if cannabinoid_data:
            CannabinoidProfile.objects.create(report=report, **cannabinoid_data)
        
        # Terpen-Profil erstellen, falls vorhanden
        if terpene_data:
            TerpeneProfile.objects.create(report=report, **terpene_data)
        
        # Verunreinigungstests erstellen, falls vorhanden
        for test_data in contaminant_tests_data:
            category_id = test_data.pop('category', None)
            if category_id:
                try:
                    category_obj = ContaminantCategory.objects.get(id=category_id)
                    ContaminantTest.objects.create(
                        report=report, 
                        category=category_obj, 
                        **test_data
                    )
                except ContaminantCategory.DoesNotExist:
                    pass
        
        return report
    
    def update(self, instance, validated_data):
        cannabinoid_data = validated_data.pop('cannabinoid_profile', None)
        terpene_data = validated_data.pop('terpene_profile', None)
        contaminant_tests_data = validated_data.pop('contaminant_tests', [])
        
        # Laborbericht aktualisieren
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        
        # Cannabinoid-Profil aktualisieren oder erstellen
        if cannabinoid_data:
            cannabinoid_profile, created = CannabinoidProfile.objects.get_or_create(
                report=instance,
                defaults=cannabinoid_data
            )
            if not created:
                for key, value in cannabinoid_data.items():
                    setattr(cannabinoid_profile, key, value)
                cannabinoid_profile.save()
        
        # Terpen-Profil aktualisieren oder erstellen
        if terpene_data:
            terpene_profile, created = TerpeneProfile.objects.get_or_create(
                report=instance,
                defaults=terpene_data
            )
            if not created:
                for key, value in terpene_data.items():
                    setattr(terpene_profile, key, value)
                terpene_profile.save()
        
        # Verunreinigungstests behandeln
        if contaminant_tests_data:
            instance.contaminant_tests.all().delete()
            for test_data in contaminant_tests_data:
                category_id = test_data.pop('category', None)
                if category_id:
                    try:
                        category_obj = ContaminantCategory.objects.get(id=category_id)
                        ContaminantTest.objects.create(
                            report=instance, 
                            category=category_obj, 
                            **test_data
                        )
                    except ContaminantCategory.DoesNotExist:
                        pass
        
        return instance