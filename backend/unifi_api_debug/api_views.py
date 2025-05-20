# Datei: backend/unifi_api_debug/api_views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.generics import ListAPIView
from django.conf import settings
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
        token = get_token_from_reader()
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
                "member_name": member_name
            })
        )

        return Response({
            "success": True,
            "token": token,
            "unifi_id": unifi_user_id,
            "unifi_name": full_name,
            "member_name": member_name or "Nicht gefunden"
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
        token, user_id, full_name = resolve_and_store_user_from_token()

        if not token:
            return Response({"success": False, "message": "Keine Karte erkannt."}, status=400)

        if not user_id:
            return Response({"success": False, "token": token, "message": "Kein zugehöriger UniFi-Nutzer gefunden."}, status=404)

        return Response({
            "success": True,
            "token": token,
            "unifi_user_id": user_id,
            "unifi_name": full_name,  # ✅ Jetzt enthalten
            "message": "RFID erfolgreich mit UniFi-Benutzer verknüpft."
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

        return Response({
            "success": True,
            "member_id": member.id,
            "member_name": str(member),
            "timestamp": now()
        })
