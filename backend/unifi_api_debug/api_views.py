# Datei: backend/unifi_api_debug/api_views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ReadOnlyModelViewSet
from django.conf import settings
from .unifi_rfid_listener import get_token_from_reader
from members.models import Member
from .models import NfcDebugLog
import requests
from .serializers import NfcDebugLogSerializer
from rest_framework.generics import ListAPIView


UNIFI_API_URL = f"{settings.UNIFI_ACCESS_HOST}/api/v1/developer"
UNIFI_API_TOKEN = settings.UNIFI_ACCESS_TOKEN


class TestNfcSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        token = get_token_from_reader()
        if not token:
            return Response({"success": False, "message": "Keine Karte erkannt."})

        headers = {
            "Authorization": f"Bearer {UNIFI_API_TOKEN}",
            "Accept": "application/json",
        }

        full_name = None
        unifi_user_id = None

        # 📡 UniFi-Nutzerliste durchsuchen
        try:
            response = requests.get(f"{UNIFI_API_URL}/users", headers=headers, verify=False)
            if response.status_code == 200:
                for user in response.json().get("data", []):
                    for card in user.get("nfc_cards", []):
                        if card.get("token") == token:
                            full_name = user.get("full_name")
                            unifi_user_id = user.get("id")  # 🧩 Hier wird die UniFi-ID zugewiesen
                            break
        except Exception as e:
            print(f"❌ Fehler beim UniFi-API-Call: {e}")

        member_name = None

        # 🧠 Namensbasierter Abgleich
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
                "member_name": member_name
            })
        )

        return Response({
            "success": True,
            "token": token,
            "unifi_id": unifi_user_id,            # ✅ Rückgabe ergänzt
            "unifi_name": full_name,
            "member_name": member_name or "Nicht gefunden"
        })
    
    
class DebugLogListView(ListAPIView):
    queryset = NfcDebugLog.objects.all().order_by("-timestamp")
    serializer_class = NfcDebugLogSerializer

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return Response({ "logs": response.data })  # 💡 Genau das erwartet das Frontend
