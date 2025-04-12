from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.utils.timezone import now, timedelta
from .models import AccessEvent

@csrf_exempt
def latest_rfid_event(request):
    cutoff = now() - timedelta(seconds=10)
    last_event = AccessEvent.objects.filter(timestamp__gte=cutoff).order_by('-timestamp').first()

    return JsonResponse({
        "name": last_event.actor if last_event else None,
        "timestamp": last_event.timestamp.strftime('%Y-%m-%d %H:%M:%S') if last_event else None
    })


@csrf_exempt
def get_events(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Nur GET-Anfragen sind erlaubt'}, status=405)

    try:
        last_id = int(request.GET.get('last_id', 0))
    except ValueError:
        last_id = 0

    limit = min(int(request.GET.get('limit', 50)), 100)
    events = AccessEvent.objects.filter(id__gt=last_id).order_by('-timestamp')[:limit]

    events_data = [{
        'id': event.id,
        'actor': event.actor,
        'door': event.door,
        'event_type': event.event_type,
        'authentication': event.authentication,
        'timestamp': event.timestamp.strftime('%d.%m.%Y %H:%M:%S')
    } for event in events]

    return JsonResponse({
        'events': events_data,
        'count': len(events_data),
        'ha_connected': getattr(settings, 'HA_WEBSOCKET_CONNECTED', False)
    })


@csrf_exempt
def ha_status(request):
    return JsonResponse({
        'connected': getattr(settings, 'HA_WEBSOCKET_CONNECTED', False),
        'last_connection': getattr(settings, 'HA_LAST_CONNECTION_TIME', None),
        'events_count': AccessEvent.objects.count()
    })
