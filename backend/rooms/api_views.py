from rest_framework import viewsets
from .models import Room
from .serializers import RoomSerializer

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    # Keine Berechtigungsprüfung für jetzt
    authentication_classes = []
    permission_classes = []
    
    # Keine perform_create-Methode mehr nötig