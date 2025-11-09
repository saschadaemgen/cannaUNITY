# backend/unifi_api_debug/api_views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.generics import ListAPIView
from django.conf import settings
from .services import UnifiAccessService
from django.utils.timezone import now
from rest_framework import status
from .models import NfcDebugLog
from .serializers import NfcDebugLogSerializer
from .unifi_rfid_listener import (
    get_token_from_reader,
    resolve_and_store_user_from_token,
    get_recent_rfid_user
)
from members.models import Member
import requests

UNIFI_API_URL = f"{settings.UNIFI_ACCESS_HOST}/api/v1/developer"
UNIFI_API_TOKEN = settings.UNIFI_ACCESS_TOKEN

class TestNfcSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # NEU: Optional device_id aus Query Parameters
        device_id = request.query_params.get('device_id', None)
        
        token = get_token_from_reader(device_id)
        if not token:
            return Response({"success": False, "message": "Keine Karte erkannt."})

        headers = {
            "Authorization": f"Bearer {UNIFI_API_TOKEN}",
            "Accept": "application/json",
        }

        full_name = None
        unifi_user_id = None

        try:
            response = requests.get(f"{UNIFI_API_URL}/users", headers=headers, verify=False)
            if response.status_code == 200:
                for user in response.json().get("data", []):
                    for card in user.get("nfc_cards", []):
                        if card.get("token") == token:
                            full_name = user.get("full_name")
                            unifi_user_id = user.get("id")
                            break
        except Exception:
            pass

        member_name = None

        if full_name:
            try:
                parts = full_name.strip().split()
                first_name = parts[0]
                last_name = parts[-1] if len(parts) > 1 else ""
                member = Member.objects.get(first_name__iexact=first_name, last_name__iexact=last_name)
                member_name = str(member)
            except Member.DoesNotExist:
                pass

        NfcDebugLog.objects.create(
            token=token,
            status="success" if member_name else "unbekannt",
            raw_data=str({
                "unifi_name": full_name,
                "unifi_id": unifi_user_id,
                "member_name": member_name,
                "device_id": device_id  # NEU: Device ID im Log speichern
            })
        )

        return Response({
            "success": True,
            "token": token,
            "unifi_id": unifi_user_id,
            "unifi_name": full_name,
            "member_name": member_name or "Nicht gefunden",
            "device_id": device_id  # NEU: Device ID in Response
        })


class DebugLogListView(ListAPIView):
    queryset = NfcDebugLog.objects.all().order_by("-timestamp")
    serializer_class = NfcDebugLogSerializer

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return Response({ "logs": response.data })


class BindRfidSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # NEU: Device ID aus Query Parameters holen
        device_id = request.query_params.get('device_id', None)
        
        # Wenn eine device_id übergeben wurde, diese verwenden
        token, user_id, full_name = resolve_and_store_user_from_token(device_id)

        if not token:
            return Response({
                "success": False, 
                "message": "Keine Karte erkannt.",
                "device_id": device_id
            }, status=400)

        if not user_id:
            return Response({
                "success": False, 
                "token": token, 
                "message": "Kein zugehöriger UniFi-Nutzer gefunden.",
                "device_id": device_id
            }, status=404)

        return Response({
            "success": True,
            "token": token,
            "unifi_user_id": user_id,
            "unifi_name": full_name,
            "message": "RFID erfolgreich mit UniFi-Benutzer verknüpft.",
            "device_id": device_id  # NEU: Device ID in Response
        })


class SecureMemberBindingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Diese View verknüpft eine RFID-Karte mit einem Mitglied anhand des Namens aus UniFi.
        Die Zuordnung funktioniert nur, wenn der Token vorher durch den Listener bestätigt wurde.
        """
        token = request.data.get("token")
        if not token:
            return Response({"detail": "Kein Token übergeben."}, status=status.HTTP_400_BAD_REQUEST)

        unifi_user_id = get_recent_rfid_user(token)
        if not unifi_user_id:
            return Response({"detail": "Kein gültiger Benutzer im Cache gefunden."}, status=status.HTTP_403_FORBIDDEN)

        full_name = request.data.get("unifi_name", "")
        if not full_name:
            return Response({"detail": "Kein Name zur Validierung übergeben."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            first_name, last_name = full_name.strip().split(" ", 1)
        except ValueError:
            return Response({"detail": "Ungültiger Name."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            member = Member.objects.get(first_name__iexact=first_name, last_name__iexact=last_name)
        except Member.DoesNotExist:
            return Response({"detail": "Mitglied nicht gefunden."}, status=status.HTTP_404_NOT_FOUND)

        # NEU: Optional device_id aus Request Data
        device_id = request.data.get("device_id", None)

        return Response({
            "success": True,
            "member_id": member.id,
            "member_name": str(member),
            "timestamp": now(),
            "device_id": device_id  # NEU: Device ID in Response
        })


class CancelRfidSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.core.cache import cache
        
        # NEU: Optional device-spezifische Session ID
        device_id = request.data.get('device_id', None)
        cache_key = f'active_rfid_session_id_{device_id}' if device_id else 'active_rfid_session_id'
        session_id = cache.get(cache_key)
        
        if not session_id:
            return Response({
                "success": False, 
                "message": "Keine aktive Session gefunden.",
                "device_id": device_id
            }, status=404)
        
        try:
            # UniFi API aufrufen
            headers = {
                "Authorization": f"Bearer {UNIFI_API_TOKEN}",
                "Accept": "application/json",
            }
            
            response = requests.delete(
                f"{UNIFI_API_URL}/credentials/nfc_cards/sessions/{session_id}",
                headers=headers,
                verify=False
            )
            
            # Den Cache-Eintrag für die aktive Session löschen
            cache.delete(cache_key)
            
            if response.status_code == 200:
                return Response({
                    "success": True, 
                    "message": "RFID-Session erfolgreich abgebrochen.",
                    "device_id": device_id
                })
            else:
                return Response({
                    "success": False, 
                    "message": f"Fehler beim Abbrechen der Session. Status: {response.status_code}",
                    "device_id": device_id
                }, status=400)
                
        except Exception as e:
            return Response({
                "success": False, 
                "message": f"Fehler beim Abbrechen der Session: {str(e)}",
                "device_id": device_id
            }, status=500)
        

class UnifiDevicesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Listet alle verfügbaren UniFi Access Devices mit Zuordnungsstatus"""
        service = UnifiAccessService()
        devices = service.get_devices()
        assignments = service.get_device_assignments()
        
        # Formatiere für Frontend mit Zuordnungsstatus
        formatted_devices = []
        for device in devices:
            device_id = device.get("id")
            device_data = {
                "id": device_id,
                "name": device.get("name", "Unbekanntes Gerät"),
                "type": device.get("type", "unknown"),
                "alias": device.get("alias", ""),
                "location_id": device.get("location_id", ""),
                "connected_uah_id": device.get("connected_uah_id", ""),
                "is_assigned": device_id in assignments,
                "assigned_to": assignments.get(device_id) if device_id in assignments else None
            }
            formatted_devices.append(device_data)
        
        return Response({
            "success": True,
            "devices": formatted_devices,
            "count": len(formatted_devices)
        })


# NEU: Erweiterte Device-Management Views
class DeviceStatusView(APIView):
    """Zeigt den aktuellen Status eines spezifischen Geräts"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, device_id):
        service = UnifiAccessService()
        
        try:
            # Device Details abrufen
            headers = {
                "Authorization": f"Bearer {UNIFI_API_TOKEN}",
                "Accept": "application/json",
            }
            
            response = requests.get(
                f"{UNIFI_API_URL}/devices/{device_id}",
                headers=headers,
                verify=False
            )
            
            if response.status_code != 200:
                return Response({
                    "success": False,
                    "message": "Gerät nicht gefunden"
                }, status=404)
            
            device = response.json()
            
            # Aktive Sessions für dieses Gerät prüfen
            from django.core.cache import cache
            session_id = cache.get(f'active_rfid_session_id_{device_id}')
            
            return Response({
                "success": True,
                "device": device,
                "has_active_session": session_id is not None,
                "session_id": session_id
            })
            
        except Exception as e:
            return Response({
                "success": False,
                "message": f"Fehler beim Abrufen des Gerätestatus: {str(e)}"
            }, status=500)


class BulkRfidAssignView(APIView):
    """Ermöglicht das Zuweisen mehrerer RFID-Karten in einem Durchgang"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        assignments = request.data.get('assignments', [])
        
        if not assignments:
            return Response({
                "success": False,
                "message": "Keine Zuweisungen übergeben"
            }, status=400)
        
        results = []
        errors = []
        
        for assignment in assignments:
            token = assignment.get('token')
            member_id = assignment.get('member_id')
            
            if not token or not member_id:
                errors.append({
                    "token": token,
                    "error": "Token oder Member ID fehlt"
                })
                continue
            
            try:
                member = Member.objects.get(id=member_id)
                # Hier würde die eigentliche Zuweisung stattfinden
                results.append({
                    "token": token,
                    "member_id": member_id,
                    "member_name": str(member),
                    "success": True
                })
            except Member.DoesNotExist:
                errors.append({
                    "token": token,
                    "member_id": member_id,
                    "error": "Mitglied nicht gefunden"
                })
        
        return Response({
            "success": len(errors) == 0,
            "results": results,
            "errors": errors,
            "total": len(assignments),
            "successful": len(results),
            "failed": len(errors)
        })


class RfidSessionHistoryView(APIView):
    """Zeigt die Historie aller RFID-Sessions an"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Filtere nach device_id wenn angegeben
        device_id = request.query_params.get('device_id', None)
        
        queryset = NfcDebugLog.objects.all()
        
        if device_id:
            # Filtere Logs die diese device_id enthalten
            queryset = queryset.filter(raw_data__contains=f'"device_id": "{device_id}"')
        
        # Limitiere auf die letzten 50 Einträge
        logs = queryset.order_by('-timestamp')[:50]
        
        serializer = NfcDebugLogSerializer(logs, many=True)
        
        return Response({
            "success": True,
            "count": len(serializer.data),
            "device_id": device_id,
            "history": serializer.data
        })
    
class BindRfidSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # NEU: Device ID aus Query Parameters holen
        device_id = request.query_params.get('device_id', None)
        
        # Debug-Ausgabe
        print(f"🔍 BindRfidSessionView aufgerufen mit device_id: {device_id}")
        
        # Wenn eine device_id übergeben wurde, diese verwenden
        token, user_id, full_name = resolve_and_store_user_from_token(device_id)
        
        if not token:
            return Response(
                {"error": "Kein RFID-Token empfangen. Bitte Karte auflegen."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Erfolgreich - Daten zurückgeben
        return Response({
            "token": token,
            "unifi_user_id": user_id,
            "unifi_name": full_name,
            "message": f"RFID-Karte erkannt für: {full_name}",
            "device_id": device_id  # Optional: Device ID zurückgeben zur Bestätigung
        })