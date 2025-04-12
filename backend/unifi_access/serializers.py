from rest_framework import serializers
from .models import AccessEvent

class AccessEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccessEvent
        fields = '__all__'
