from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework import viewsets, status

from .views import get_dashboard_summary
from .serializers import (
    BookingSummarySerializer,
    BookingSerializer,
    AccountSerializer
)
from .models import Account, Booking, SubTransaction, Member
from .utils import STANDARD_KONTORAHMEN
from django.utils.timezone import now
from decimal import Decimal
from django.db import transaction
from django.utils import timezone

# 🔁 1. ViewSet für Buchungen mit Delete-Rollback
class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all().order_by('-datum')
    serializer_class = BookingSerializer

    @action(detail=True, methods=['post'], url_path='delete-with-rollback')
    def delete_with_rollback(self, request, pk=None):
        try:
            booking = self.get_object()
            with transaction.atomic():
                # 1. Alle SubTransactions sammeln
                transactions = booking.subtransactions.all()

                # 2. Beträge je Konto aufsummieren
                konto_saldi = {}

                for tx in transactions:
                    betrag = Decimal(str(tx.betrag or "0.00"))

                    # Soll-Konto zurückbuchen
                    if tx.soll_konto_id not in konto_saldi:
                        konto_saldi[tx.soll_konto_id] = {'obj': tx.soll_konto, 'delta': Decimal('0.00')}
                    konto_saldi[tx.soll_konto_id]['delta'] -= betrag if tx.soll_konto.konto_typ in ['AKTIV', 'AUFWAND'] else -betrag

                    # Haben-Konto zurückbuchen
                    if tx.haben_konto_id not in konto_saldi:
                        konto_saldi[tx.haben_konto_id] = {'obj': tx.haben_konto, 'delta': Decimal('0.00')}
                    konto_saldi[tx.haben_konto_id]['delta'] += betrag if tx.haben_konto.konto_typ in ['AKTIV', 'AUFWAND'] else -betrag

                # 3. Konten aktualisieren
                for eintrag in konto_saldi.values():
                    konto = eintrag['obj']
                    konto.saldo += eintrag['delta']
                    konto.save()

                # 4. Subtransactions & Buchung löschen
                transactions.delete()
                booking.delete()

            return Response({'message': 'Buchung erfolgreich gelöscht und zurückgerechnet.'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=True, methods=['post'], url_path='storno')
    def storno_booking(self, request, pk=None):
        try:
            original = self.get_object()
            if original.is_storno:
                return Response({'error': 'Diese Buchung wurde bereits storniert.'}, status=400)
            if original.storniert_am:
                return Response({'error': 'Diese Buchung wurde bereits storniert.'}, status=400)

            with transaction.atomic():
                # Neue fortlaufende Buchungsnummer für Storno erzeugen
                today_str = timezone.now().strftime("%Y%m%d")
                last = Booking.objects.filter(buchungsnummer__startswith=today_str).order_by('-buchungsnummer').first()
                
                if last and '-' in last.buchungsnummer:
                    try:
                        # Extrahiere den numerischen Teil und ignoriere das "S" für Storno-Buchungen
                        parts = last.buchungsnummer.split('-')
                        if len(parts) > 1:
                            # Entferne alle nicht-numerischen Zeichen
                            numeric_part = ''.join(c for c in parts[1] if c.isdigit())
                            last_number = int(numeric_part)
                            next_number = f"{last_number + 1:03d}"
                        else:
                            next_number = "001"
                    except (ValueError, IndexError):
                        next_number = "001"
                else:
                    next_number = "001"
                
                storno_nr = f"{today_str}-{next_number}"
                
                storno_booking = Booking.objects.create(
                    buchungsnummer=storno_nr,
                    datum=timezone.now(),
                    typ=original.typ,
                    verwendungszweck=f"STORNO zu Buchung {original.buchungsnummer}: {original.verwendungszweck}",
                    is_storno=True,
                    mitglied=original.mitglied,
                    mitgliedsname=original.mitgliedsname,
                    kontostand_snapshot=original.kontostand_snapshot,
                    foerderkredit_stand=original.foerderkredit_stand,
                    original_buchung=original  # Link zur Original-Buchung setzen
                )

                for tx in original.subtransactions.all():
                    storno_tx = SubTransaction.objects.create(
                        booking=storno_booking,
                        betrag=tx.betrag,
                        soll_konto=tx.haben_konto,  # Umgekehrte Buchung: Soll wird zu Haben
                        haben_konto=tx.soll_konto,  # Umgekehrte Buchung: Haben wird zu Soll
                        laufende_nummer=tx.laufende_nummer,
                        buchungsnummer_sub=f"{storno_nr}-{tx.laufende_nummer}" if tx.laufende_nummer else storno_nr,
                        verwendungszweck=f"STORNO zu {tx.buchungsnummer_sub or original.buchungsnummer}: {tx.verwendungszweck or original.verwendungszweck}"
                    )

                    # Rückbuchung der Salden
                    betrag = Decimal(str(tx.betrag))
                    if tx.soll_konto.konto_typ in ['AKTIV', 'AUFWAND']:
                        tx.soll_konto.saldo -= betrag
                    else:
                        tx.soll_konto.saldo += betrag

                    if tx.haben_konto.konto_typ in ['AKTIV', 'AUFWAND']:
                        tx.haben_konto.saldo += betrag
                    else:
                        tx.haben_konto.saldo -= betrag

                    tx.soll_konto.save()
                    tx.haben_konto.save()

                # Originalbuchtung als storniert markieren
                original.storniert_am = timezone.now()
                original.save()

                return Response({
                    'message': 'Buchung erfolgreich storniert.', 
                    'storno_id': storno_booking.id, 
                    'storno_nr': storno_booking.buchungsnummer
                })

        except Exception as e:
            import traceback
            error_msg = f"Fehler beim Stornieren: {str(e)}\n{traceback.format_exc()}"
            return Response({'error': error_msg}, status=500)
    
# 🔍 2. Einzelansicht für Detail
class BookingDetailAPIView(RetrieveAPIView):
    queryset = Booking.objects.prefetch_related('subtransactions')
    serializer_class = BookingSerializer


# ➕ 3. Manuelle Buchungserstellung (optional)
class BookingCreateAPIView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = BookingSerializer(data=request.data)
        if serializer.is_valid():
            booking = serializer.save()
            return Response({'status': 'ok', 'buchungsnummer': booking.buchungsnummer}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 📄 4. Journalansicht mit Filter
class BookingPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 500


class BookingJournalAPIView(ListAPIView):
    serializer_class = BookingSerializer
    pagination_class = BookingPagination

    def get_queryset(self):
        queryset = Booking.objects.prefetch_related('subtransactions').order_by('-datum')

        suche = self.request.query_params.get('suche')
        typ = self.request.query_params.get('buchungstyp')
        jahr = self.request.query_params.get('jahr')
        monat = self.request.query_params.get('monat')

        if suche:
            queryset = queryset.filter(verwendungszweck__icontains=suche)

        if typ:
            queryset = queryset.filter(typ__iexact=typ.upper())

        if jahr:
            queryset = queryset.filter(datum__year=jahr)

        if monat:
            queryset = queryset.filter(datum__month=monat)

        return queryset


# 📥 5. Kontenimport-API
class AccountImportAPIView(APIView):
    def post(self, request):
        created = 0
        skipped = 0

        for nummer, name, typ, category, saldo in STANDARD_KONTORAHMEN:
            if "Förderkredit" in name:
                continue

            account, created_obj = Account.objects.get_or_create(
                kontonummer=nummer,
                defaults={
                    "name": name,
                    "konto_typ": typ,
                    "category": category,
                    "saldo": saldo
                }
            )
            if created_obj:
                created += 1
            else:
                skipped += 1

        return Response({
            "message": "Kontenimport abgeschlossen.",
            "erstellt": created,
            "übersprungen": skipped
        }, status=status.HTTP_201_CREATED)


# 📊 6. Dashboard-Daten
class BookingDashboardAPIView(APIView):
    def get(self, request):
        summary = get_dashboard_summary()
        return Response(BookingSummarySerializer(summary).data)


# 📂 7. Kontenliste für ViewSet
class KontoPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 1000


class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    pagination_class = None