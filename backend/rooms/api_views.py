# backend/rooms/api_views.py

from rest_framework import viewsets
from .models import Room, RoomItemType, RoomItem, Sensor
from .serializers import (RoomSerializer, RoomDetailSerializer, 
                         RoomItemTypeSerializer, RoomItemSerializer, 
                         SensorSerializer)

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    # Keine Berechtigungsprüfung für jetzt
    authentication_classes = []
    permission_classes = []
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RoomDetailSerializer
        return RoomSerializer

class RoomItemTypeViewSet(viewsets.ModelViewSet):
    queryset = RoomItemType.objects.all()
    serializer_class = RoomItemTypeSerializer
    authentication_classes = []
    permission_classes = []

class RoomItemViewSet(viewsets.ModelViewSet):
    queryset = RoomItem.objects.all()
    serializer_class = RoomItemSerializer
    authentication_classes = []
    permission_classes = []
    
    def get_queryset(self):
        queryset = RoomItem.objects.all()
        room_id = self.request.query_params.get('room', None)
        if room_id is not None:
            queryset = queryset.filter(room__id=room_id)
        return queryset

class SensorViewSet(viewsets.ModelViewSet):
    queryset = Sensor.objects.all()
    serializer_class = SensorSerializer
    authentication_classes = []
    permission_classes = []
    
    def get_queryset(self):
        queryset = Sensor.objects.all()
        room_item_id = self.request.query_params.get('room_item', None)
        if room_item_id is not None:
            queryset = queryset.filter(room_item__id=room_item_id)
        return queryset