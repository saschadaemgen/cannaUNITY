from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import PLCDevice, PLCOutput, PLCLog
from .serializers import PLCDeviceSerializer, PLCOutputSerializer, PLCLogSerializer
from .plc_service import S7WebServerClient

class PLCDeviceViewSet(viewsets.ModelViewSet):
    queryset = PLCDevice.objects.all()
    serializer_class = PLCDeviceSerializer
    permission_classes = [IsAuthenticated]

class PLCOutputViewSet(viewsets.ModelViewSet):
    queryset = PLCOutput.objects.all()
    serializer_class = PLCOutputSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """Schaltet einen Ausgang um"""
        output = self.get_object()
        device = output.device
        
        # PLC-Client erstellen
        client = S7WebServerClient(
            ip=device.ip_address,
            port=device.port,
            username=device.username,
            password=device.password
        )
        
        # Aktuellen Status lesen
        old_state = client.read_output(output.address)
        
        # Umschalten
        new_state = client.toggle_output(output.address)
        
        # Log erstellen
        log = PLCLog.objects.create(
            output=output,
            action='toggle',
            old_state=old_state,
            new_state=new_state,
            user=request.user,
            success=new_state is not None,
            error_message="" if new_state is not None else "Toggle failed"
        )
        
        # Status in DB aktualisieren
        if new_state is not None:
            output.current_state = new_state
            output.save()
        
        return Response({
            'success': new_state is not None,
            'current_state': new_state,
            'log_id': str(log.id)
        })
    
    @action(detail=True, methods=['post'])
    def set_state(self, request, pk=None):
        """Setzt einen Ausgang auf einen bestimmten Wert"""
        output = self.get_object()
        device = output.device
        new_state = request.data.get('state', False)
        
        client = S7WebServerClient(
            ip=device.ip_address,
            port=device.port,
            username=device.username,
            password=device.password
        )
        
        old_state = output.current_state
        success = client.write_output(output.address, new_state)
        
        log = PLCLog.objects.create(
            output=output,
            action='on' if new_state else 'off',
            old_state=old_state,
            new_state=new_state if success else None,
            user=request.user,
            success=success
        )
        
        if success:
            output.current_state = new_state
            output.save()
        
        return Response({
            'success': success,
            'current_state': output.current_state
        })
    
    @action(detail=True, methods=['get'])
    def read_state(self, request, pk=None):
        """Liest den aktuellen Status vom Gerät"""
        output = self.get_object()
        device = output.device
        
        client = S7WebServerClient(
            ip=device.ip_address,
            port=device.port,
            username=device.username,
            password=device.password
        )
        
        current_state = client.read_output(output.address)
        
        if current_state is not None:
            output.current_state = current_state
            output.save()
        
        return Response({
            'success': current_state is not None,
            'current_state': current_state,
            'last_updated': output.last_updated
        })

class PLCLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PLCLog.objects.all().order_by('-timestamp')
    serializer_class = PLCLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        output_id = self.request.query_params.get('output', None)
        if output_id:
            queryset = queryset.filter(output_id=output_id)
        return queryset