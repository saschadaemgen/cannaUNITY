# backend/logo_bridge/api_views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import LogoDevice, LogoVariable, LogoCommand, LogoLog
from .serializers import (
    LogoDeviceSerializer, LogoVariableSerializer, 
    LogoCommandSerializer, LogoLogSerializer
)
from .services.logo_controller import logo_controller

class LogoDeviceViewSet(viewsets.ModelViewSet):
    queryset = LogoDevice.objects.all()
    serializer_class = LogoDeviceSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """Testet die Verbindung zu einem Logo-Gerät"""
        device = self.get_object()
        
        try:
            conn = logo_controller.get_connection(device)
            return Response({
                'success': True,
                'message': f'Successfully connected to {device.name}',
                'connected': conn.connected
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def disconnect(self, request, pk=None):
        """Trennt die Verbindung zu einem Logo-Gerät"""
        device = self.get_object()
        
        try:
            logo_controller.disconnect_device(device)
            return Response({
                'success': True,
                'message': f'Disconnected from {device.name}'
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """Gibt den aktuellen Status eines Logo-Geräts zurück"""
        device = self.get_object()
        
        # Prüfe ob Verbindung existiert
        is_connected = str(device.id) in logo_controller.connections
        
        return Response({
            'id': device.id,
            'name': device.name,
            'ip_address': device.ip_address,
            'protocol': device.protocol,
            'is_connected': is_connected,
            'is_active': device.is_active,
            'last_connection': device.last_connection,
            'variables_count': device.variables.count(),
            'commands_count': device.commands.count(),
            'recent_logs': LogoLog.objects.filter(device=device).count()
        })

class LogoVariableViewSet(viewsets.ModelViewSet):
    queryset = LogoVariable.objects.all()
    serializer_class = LogoVariableSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        device_id = self.request.query_params.get('device', None)
        if device_id:
            queryset = queryset.filter(device_id=device_id)
        return queryset.select_related('device')
    
    @action(detail=True, methods=['get'])
    def read(self, request, pk=None):
        """Liest den aktuellen Wert einer Variable"""
        variable = self.get_object()
        
        try:
            value = logo_controller.read_variable(variable, user=request.user)
            
            return Response({
                'success': True,
                'variable': variable.name,
                'address': variable.address,
                'value': value,
                'data_type': variable.data_type,
                'unit': variable.unit,
                'timestamp': timezone.now()
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def write(self, request, pk=None):
        """Schreibt einen Wert in eine Variable"""
        variable = self.get_object()
        value = request.data.get('value')
        
        if value is None:
            return Response({
                'error': 'Value is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Typ-Konvertierung
            if variable.data_type == 'bool':
                # Akzeptiere verschiedene Bool-Formate
                if isinstance(value, str):
                    value = value.lower() in ['true', '1', 'on', 'yes']
                else:
                    value = bool(value)
            elif variable.data_type == 'int':
                value = int(value)
            elif variable.data_type == 'float':
                value = float(value)
            elif variable.data_type == 'string':
                value = str(value)
            
            success = logo_controller.write_variable(variable, value, user=request.user)
            
            return Response({
                'success': success,
                'variable': variable.name,
                'address': variable.address,
                'value': value,
                'timestamp': timezone.now()
            })
        except ValueError as e:
            return Response({
                'success': False,
                'error': f'Invalid value: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def bulk_read(self, request):
        """Liest mehrere Variablen auf einmal"""
        variable_ids = request.data.get('variable_ids', [])
        
        if not variable_ids:
            return Response({
                'error': 'No variable_ids provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        results = []
        for var_id in variable_ids:
            try:
                variable = LogoVariable.objects.get(id=var_id)
                value = logo_controller.read_variable(variable, user=request.user)
                results.append({
                    'id': var_id,
                    'name': variable.name,
                    'value': value,
                    'unit': variable.unit,
                    'success': True
                })
            except Exception as e:
                results.append({
                    'id': var_id,
                    'success': False,
                    'error': str(e)
                })
        
        return Response({
            'results': results,
            'timestamp': timezone.now()
        })

class LogoCommandViewSet(viewsets.ModelViewSet):
    queryset = LogoCommand.objects.all()
    serializer_class = LogoCommandSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        device_id = self.request.query_params.get('device', None)
        if device_id:
            queryset = queryset.filter(device_id=device_id)
        return queryset.select_related('device').prefetch_related('variables')
    
    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """Führt einen vordefinierten Befehl aus"""
        command = self.get_object()
        parameters = request.data.get('parameters', {})
        
        try:
            success = logo_controller.execute_command(
                command, 
                parameters, 
                user=request.user
            )
            
            return Response({
                'success': success,
                'command': command.name,
                'device': command.device.name,
                'timestamp': timezone.now()
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class LogoLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LogoLog.objects.all()
    serializer_class = LogoLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter nach Device
        device_id = self.request.query_params.get('device', None)
        if device_id:
            queryset = queryset.filter(device_id=device_id)
        
        # Filter nach Variable
        variable_id = self.request.query_params.get('variable', None)
        if variable_id:
            queryset = queryset.filter(variable_id=variable_id)
        
        # Filter nach Action
        action = self.request.query_params.get('action', None)
        if action:
            queryset = queryset.filter(action=action)
        
        # Filter nach Success
        success = self.request.query_params.get('success', None)
        if success is not None:
            queryset = queryset.filter(success=success.lower() == 'true')
        
        # Filter nach Zeitraum
        from_date = self.request.query_params.get('from', None)
        to_date = self.request.query_params.get('to', None)
        
        if from_date:
            queryset = queryset.filter(timestamp__gte=from_date)
        if to_date:
            queryset = queryset.filter(timestamp__lte=to_date)
        
        return queryset.select_related('device', 'variable', 'user')[:200]
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Gibt Statistiken über die Logs zurück"""
        queryset = self.filter_queryset(self.get_queryset())
        
        total = queryset.count()
        successful = queryset.filter(success=True).count()
        failed = queryset.filter(success=False).count()
        
        by_action = {}
        for action in ['read', 'write', 'command']:
            by_action[action] = queryset.filter(action=action).count()
        
        return Response({
            'total': total,
            'successful': successful,
            'failed': failed,
            'by_action': by_action,
            'success_rate': (successful / total * 100) if total > 0 else 0
        })

# Service-Endpunkt für andere Apps
class LogoBridgeServiceViewSet(viewsets.ViewSet):
    """API für andere Apps um Logo zu steuern"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def read_value(self, request):
        """Liest einen Wert von der Logo
        
        Request body:
        {
            "device_name": "Hauptsteuerung",
            "variable_name": "Temperatur_Raum1"
        }
        """
        device_name = request.data.get('device_name')
        variable_name = request.data.get('variable_name')
        
        if not device_name or not variable_name:
            return Response({
                'error': 'device_name and variable_name are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            variable = LogoVariable.objects.select_related('device').get(
                device__name=device_name,
                name=variable_name
            )
            
            value = logo_controller.read_variable(variable, user=request.user)
            
            return Response({
                'success': True,
                'device': device_name,
                'variable': variable_name,
                'value': value,
                'data_type': variable.data_type,
                'unit': variable.unit,
                'timestamp': timezone.now()
            })
            
        except LogoVariable.DoesNotExist:
            return Response({
                'error': f'Variable "{variable_name}" not found for device "{device_name}"'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def write_value(self, request):
        """Schreibt einen Wert zur Logo"""
        device_name = request.data.get('device_name')
        variable_name = request.data.get('variable_name')
        value = request.data.get('value')
        
        if not device_name or not variable_name or value is None:
            return Response({
                'error': 'device_name, variable_name and value are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            variable = LogoVariable.objects.select_related('device').get(
                device__name=device_name,
                name=variable_name
            )
            
            # Typ-Konvertierung
            if variable.data_type == 'bool':
                if isinstance(value, str):
                    value = value.lower() in ['true', '1', 'on', 'yes']
                else:
                    value = bool(value)
            elif variable.data_type == 'int':
                value = int(value)
            elif variable.data_type == 'float':
                value = float(value)
            
            success = logo_controller.write_variable(variable, value, user=request.user)
            
            return Response({
                'success': success,
                'device': device_name,
                'variable': variable_name,
                'value': value,
                'timestamp': timezone.now()
            })
            
        except LogoVariable.DoesNotExist:
            return Response({
                'error': f'Variable "{variable_name}" not found for device "{device_name}"'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def execute_command(self, request):
        """Führt einen Befehl aus"""
        device_name = request.data.get('device_name')
        command_name = request.data.get('command_name')
        parameters = request.data.get('parameters', {})
        
        if not device_name or not command_name:
            return Response({
                'error': 'device_name and command_name are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            command = LogoCommand.objects.select_related('device').get(
                device__name=device_name,
                name=command_name
            )
            
            success = logo_controller.execute_command(
                command,
                parameters,
                user=request.user
            )
            
            return Response({
                'success': success,
                'device': device_name,
                'command': command_name,
                'timestamp': timezone.now()
            })
            
        except LogoCommand.DoesNotExist:
            return Response({
                'error': f'Command "{command_name}" not found for device "{device_name}"'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)