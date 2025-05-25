# backend/controller/api_views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from rooms.models import Room
from .models import (
    ControlUnit, ControlSchedule, ControlParameter,
    ControlStatus, ControlCommand
)
from .serializers import (
    ControlUnitSerializer, ControlUnitDetailSerializer,
    ControlScheduleSerializer, ControlParameterSerializer,
    ControlStatusSerializer, ControlCommandSerializer,
    RoomControlOverviewSerializer, SendCommandSerializer
)
from .plc_interface import PLCInterface  # Wird später implementiert


class ControlUnitViewSet(viewsets.ModelViewSet):
    """ViewSet für Steuerungseinheiten"""
    queryset = ControlUnit.objects.all().select_related('room').prefetch_related(
        'parameters', 'schedules', 'current_status'
    )
    serializer_class = ControlUnitSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ControlUnitDetailSerializer
        return ControlUnitSerializer
    
    @action(detail=True, methods=['post'])
    def send_to_plc(self, request, pk=None):
        """Sendet die aktuelle Konfiguration an die SPS"""
        control_unit = self.get_object()
        serializer = SendCommandSerializer(data=request.data)
        
        if serializer.is_valid():
            command_type = serializer.validated_data['command_type']
            parameters = serializer.validated_data['parameters']
            force = serializer.validated_data['force']
            
            # Prüfung ob Unit online ist
            if not force and control_unit.status != 'active':
                return Response(
                    {'error': 'Steuerungseinheit ist nicht aktiv'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Command erstellen
            command = ControlCommand.objects.create(
                control_unit=control_unit,
                command_type=command_type,
                payload={
                    'unit_config': ControlUnitSerializer(control_unit).data,
                    'parameters': parameters
                }
            )
            
            # An SPS senden (async oder über Celery-Task)
            try:
                plc = PLCInterface()
                result = plc.send_command(command)
                
                command.status = 'sent' if result else 'failed'
                command.sent_at = timezone.now()
                command.save()
                
                return Response(
                    ControlCommandSerializer(command).data,
                    status=status.HTTP_201_CREATED
                )
            except Exception as e:
                command.status = 'failed'
                command.error_message = str(e)
                command.save()
                
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """Gibt den aktuellen Status zurück"""
        control_unit = self.get_object()
        
        if hasattr(control_unit, 'current_status'):
            return Response(ControlStatusSerializer(control_unit.current_status).data)
        
        return Response(
            {'error': 'Kein Status verfügbar'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    @action(detail=False, methods=['get'])
    def by_room(self, request):
        """Gruppiert Steuerungseinheiten nach Raum"""
        room_id = request.query_params.get('room_id')
        
        if room_id:
            rooms = Room.objects.filter(id=room_id)
        else:
            rooms = Room.objects.all()
        
        serializer = RoomControlOverviewSerializer(rooms, many=True)
        return Response(serializer.data)


class ControlScheduleViewSet(viewsets.ModelViewSet):
    """ViewSet für Zeitpläne"""
    queryset = ControlSchedule.objects.all().select_related('control_unit')
    serializer_class = ControlScheduleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        control_unit_id = self.request.query_params.get('control_unit')
        
        if control_unit_id:
            queryset = queryset.filter(control_unit_id=control_unit_id)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Aktualisiert mehrere Zeitpläne gleichzeitig"""
        control_unit_id = request.data.get('control_unit_id')
        schedules_data = request.data.get('schedules', [])
        
        if not control_unit_id:
            return Response(
                {'error': 'control_unit_id erforderlich'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            control_unit = ControlUnit.objects.get(id=control_unit_id)
        except ControlUnit.DoesNotExist:
            return Response(
                {'error': 'Steuerungseinheit nicht gefunden'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        with transaction.atomic():
            # Alte Zeitpläne löschen
            control_unit.schedules.all().delete()
            
            # Neue erstellen
            created_schedules = []
            for schedule_data in schedules_data:
                schedule_data['control_unit'] = control_unit.id
                serializer = ControlScheduleSerializer(data=schedule_data)
                
                if serializer.is_valid():
                    schedule = serializer.save()
                    created_schedules.append(schedule)
                else:
                    transaction.set_rollback(True)
                    return Response(
                        serializer.errors,
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            return Response(
                ControlScheduleSerializer(created_schedules, many=True).data,
                status=status.HTTP_201_CREATED
            )


class ControlParameterViewSet(viewsets.ModelViewSet):
    """ViewSet für Parameter"""
    queryset = ControlParameter.objects.all().select_related('control_unit')
    serializer_class = ControlParameterSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        control_unit_id = self.request.query_params.get('control_unit')
        
        if control_unit_id:
            queryset = queryset.filter(control_unit_id=control_unit_id)
        
        return queryset


class ControlStatusViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet für Status (nur lesen)"""
    queryset = ControlStatus.objects.all().select_related('control_unit')
    serializer_class = ControlStatusSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Gibt eine Übersicht aller Status zurück"""
        room_id = request.query_params.get('room_id')
        unit_type = request.query_params.get('unit_type')
        
        queryset = self.get_queryset()
        
        if room_id:
            queryset = queryset.filter(control_unit__room_id=room_id)
        
        if unit_type:
            queryset = queryset.filter(control_unit__unit_type=unit_type)
        
        # Gruppierung nach Status
        overview = {
            'total': queryset.count(),
            'online': queryset.filter(is_online=True).count(),
            'offline': queryset.filter(is_online=False).count(),
            'errors': queryset.exclude(error_message__isnull=True).exclude(error_message='').count(),
        }
        
        return Response(overview)


class ControlCommandViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet für Befehle (nur lesen)"""
    queryset = ControlCommand.objects.all().select_related('control_unit')
    serializer_class = ControlCommandSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        control_unit_id = self.request.query_params.get('control_unit')
        status_filter = self.request.query_params.get('status')
        
        if control_unit_id:
            queryset = queryset.filter(control_unit_id=control_unit_id)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset