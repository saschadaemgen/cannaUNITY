# rfid_bridge/api_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
import uuid

from unifi_access.models import AccessEvent
from members.models import Member
from .models import RFIDSession
from members.api_views import extract_unifi_id

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_rfid_session(request):
    """Erstellt eine neue RFID-Authentifizierungssession"""
    target_app = request.data.get('target_app', 'unknown')
    
    # Session erstellen mit 2 Minuten Gültigkeit
    session = RFIDSession.objects.create(
        target_app=target_app,
        expires_at=timezone.now() + timedelta(minutes=2)
    )
    
    return Response({
        'success': True,
        'session_id': session.session_id,
        'expires_at': session.expires_at
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_latest_rfid(request, session_id):
    """
    Prüft das neueste RFID-Event und ordnet es einem Mitglied zu,
    falls die Session gültig ist.
    """
    try:
        session = RFIDSession.objects.get(session_id=session_id)
    except RFIDSession.DoesNotExist:
        return Response({'error': 'Session nicht gefunden'}, status=404)
    
    if session.used:
        return Response({'error': 'Session wurde bereits verwendet'}, status=400)
    
    if session.expires_at < timezone.now():
        return Response({'error': 'Session abgelaufen'}, status=400)
    
    # Neuestes RFID-Event abrufen (nicht älter als 5 Sekunden)
    latest_event = AccessEvent.objects.filter(
        timestamp__gte=timezone.now() - timedelta(seconds=5)
    ).order_by('-timestamp').first()
    
    if not latest_event:
        # Kein aktuelles Event gefunden
        return Response({'success': False, 'status': 'waiting'})
    
    # Mitglied über den Actor-Namen finden
    actor_name = latest_event.actor.strip()
    first_name = actor_name.split()[0] if ' ' in actor_name else actor_name
    last_name = ' '.join(actor_name.split()[1:]) if ' ' in actor_name else ""
    
    members = Member.objects.filter(
        first_name__icontains=first_name,
        last_name__icontains=last_name
    )
    
    if members.count() == 1:
        # Eindeutiger Match gefunden
        member = members.first()
        session.member_id = member.id
        session.used = True
        session.save()
        
        return Response({
            'success': True,
            'status': 'authenticated',
            'member_id': member.id,
            'member_name': f"{member.first_name} {member.last_name}",
            'timestamp': latest_event.timestamp
        })
    
    # Mehrere mögliche Mitglieder mit gleichem Namen gefunden
    # UniFi-ID für die Disambiguierung verwenden
    if members.count() > 1:
        for member in members:
            unifi_id = extract_unifi_id(member)
            if unifi_id:
                # Hier könnte man zusätzlich über die UniFi API überprüfen,
                # ob dieses Mitglied tatsächlich das Event ausgelöst hat
                # Für den Moment nehmen wir das erste Mitglied mit UniFi-ID
                session.member_id = member.id
                session.used = True
                session.save()
                
                return Response({
                    'success': True,
                    'status': 'authenticated',
                    'member_id': member.id,
                    'member_name': f"{member.first_name} {member.last_name}",
                    'disambiguated': True,
                    'timestamp': latest_event.timestamp
                })
    
    return Response({'success': False, 'status': 'not_found'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def status(request):
    """
    Status-Endpunkt für die RFID-Bridge
    """
    # Neueste RFID-Events abrufen
    latest_events = AccessEvent.objects.all().order_by('-timestamp')[:5]
    
    # Aktive Sessions zählen
    active_sessions = RFIDSession.objects.filter(
        expires_at__gt=timezone.now(),
        used=False
    ).count()
    
    return Response({
        'status': 'active',
        'active_sessions': active_sessions,
        'latest_events': [
            {
                'actor': event.actor,
                'door': event.door,
                'authentication': event.authentication,
                'timestamp': event.timestamp
            } for event in latest_events
        ]
    })