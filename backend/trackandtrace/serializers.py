# trackandtrace/serializers.py
from rest_framework import serializers
from .models import SeedPurchase
from members.models import Member
from rooms.models import Room

class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ['id', 'first_name', 'last_name']

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'name', 'description']

class SeedPurchaseSerializer(serializers.ModelSerializer):
    responsible_member_details = MemberSerializer(source='responsible_member', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    
    class Meta:
        model = SeedPurchase
        fields = [
            'uuid', 'batch_number', 'manufacturer', 'genetics', 
            'strain_name', 'sativa_percentage', 'indica_percentage',
            'thc_value', 'cbd_value', 'purchase_date', 'total_seeds',
            'remaining_seeds', 'notes', 'is_destroyed', 
            'destruction_reason', 'destruction_date', 'temperature', 
            'humidity', 'image', 'document', 'created_at', 'updated_at',
            'responsible_member', 'responsible_member_details',
            'room', 'room_details'  # Neue Felder
        ]
        read_only_fields = ['uuid', 'batch_number', 'created_at', 'updated_at', 'remaining_seeds']