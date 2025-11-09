# backend/controller/tasks.py

from celery import shared_task
from django.utils import timezone
from .models import ControlUnit, ControlStatus
from .plc_interface import PLCInterface

@shared_task
def sync_control_unit_status(control_unit_id):
    """Synchronisiert den Status einer Steuerungseinheit mit der SPS"""
    try:
        control_unit = ControlUnit.objects.get(id=control_unit_id)
        plc = PLCInterface()
        
        status_data = plc.read_status(control_unit)
        
        if status_data:
            status, created = ControlStatus.objects.get_or_create(
                control_unit=control_unit
            )
            
            status.is_online = status_data.get('is_online', False)
            status.current_value = status_data.get('current_value')
            status.secondary_value = status_data.get('secondary_value')
            status.measurements = status_data
            status.error_message = None if status.is_online else 'Keine Verbindung'
            status.save()
            
            control_unit.last_sync = timezone.now()
            control_unit.save()
            
            return True
    except Exception as e:
        print(f"Fehler beim Sync: {e}")
        return False

@shared_task
def sync_all_units():
    """Synchronisiert alle aktiven Steuerungseinheiten"""
    active_units = ControlUnit.objects.filter(status='active')
    
    for unit in active_units:
        sync_control_unit_status.delay(unit.id)