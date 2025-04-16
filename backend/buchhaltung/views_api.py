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
from django.utils.dateparse import parse_date
from django.db.models import Sum
import datetime

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

class MainBookAPIView(APIView):
    def get(self, request):
        # Parameter für Zeitraum
        start_date_param = request.query_params.get('start_date')
        end_date_param = request.query_params.get('end_date')
        
        # Falls keine Daten angegeben, nehmen wir das aktuelle Jahr
        if not start_date_param:
            # Startdatum: 1. Januar des aktuellen Jahres (als Datum, nicht DateTime)
            start_date = timezone.now().replace(month=1, day=1).date()
        else:
            # String zu Date-Objekt konvertieren
            start_date = parse_date(start_date_param)
        
        if not end_date_param:
            # Enddatum: Heute (als Datum, nicht DateTime)
            end_date = timezone.now().date()
        else:
            # String zu Date-Objekt konvertieren
            end_date = parse_date(end_date_param)
        
        # DateTime-Objekte mit Zeitzone für Vergleiche erstellen
        start_datetime = timezone.make_aware(
            datetime.datetime.combine(start_date, datetime.time.min)
        )
        end_datetime = timezone.make_aware(
            datetime.datetime.combine(end_date, datetime.time.max)
        )
        
        # Alle Konten holen
        accounts = Account.objects.all().order_by('kontonummer')
        
        # Ergebnis vorbereiten
        result = []
        
        for account in accounts:
            # Anfangsbestand berechnen - alle Buchungen VOR dem Startdatum
            opening_debits = SubTransaction.objects.filter(
                soll_konto=account,
                booking__datum__lt=start_datetime
            ).aggregate(Sum('betrag'))['betrag__sum'] or 0
            
            opening_credits = SubTransaction.objects.filter(
                haben_konto=account, 
                booking__datum__lt=start_datetime
            ).aggregate(Sum('betrag'))['betrag__sum'] or 0
            
            # Anfangsbestand je nach Kontotyp berechnen
            if account.konto_typ in ['AKTIV', 'AUFWAND']:
                opening_balance = opening_debits - opening_credits
            else:
                opening_balance = opening_credits - opening_debits
                
            # Alle relevanten Buchungen im Zeitraum
            transactions = []
            
            # SOLL-Buchungen im Zeitraum
            debit_txs = SubTransaction.objects.filter(
                soll_konto=account,
                booking__datum__gte=start_datetime,
                booking__datum__lte=end_datetime
            ).select_related('booking', 'haben_konto')
            
            for tx in debit_txs:
                transactions.append({
                    'date': tx.booking.datum,
                    'booking_no': tx.booking.buchungsnummer,
                    'description': tx.booking.verwendungszweck,
                    'debit': tx.betrag,
                    'credit': 0,
                    'counter_account': tx.haben_konto.kontonummer,
                    'is_storno': tx.booking.is_storno,
                    'is_storniert': tx.booking.storniert_am is not None
                })
                
            # HABEN-Buchungen im Zeitraum
            credit_txs = SubTransaction.objects.filter(
                haben_konto=account,
                booking__datum__gte=start_datetime,
                booking__datum__lte=end_datetime
            ).select_related('booking', 'soll_konto')
            
            for tx in credit_txs:
                transactions.append({
                    'date': tx.booking.datum,
                    'booking_no': tx.booking.buchungsnummer,
                    'description': tx.booking.verwendungszweck,
                    'debit': 0, 
                    'credit': tx.betrag,
                    'counter_account': tx.soll_konto.kontonummer,
                    'is_storno': tx.booking.is_storno,
                    'is_storniert': tx.booking.storniert_am is not None
                })
                
            # Nach Datum sortieren
            transactions.sort(key=lambda x: x['date'])
            
            # Summen für den Zeitraum
            period_debits = sum(float(tx['debit']) for tx in transactions)
            period_credits = sum(float(tx['credit']) for tx in transactions)
            
            # Endbestand berechnen
            if account.konto_typ in ['AKTIV', 'AUFWAND']:
                closing_balance = opening_balance + (period_debits - period_credits)
            else:
                closing_balance = opening_balance + (period_credits - period_debits)
                
            # Ins Ergebnis einfügen
            result.append({
                'account': {
                    'id': account.id,
                    'number': account.kontonummer,
                    'name': account.name,
                    'type': account.konto_typ,
                    'category': account.category
                },
                'opening_balance': opening_balance,
                'transactions': transactions,
                'period_debits': period_debits,
                'period_credits': period_credits,
                'turnover': period_debits + period_credits,  # Umsatz
                'closing_balance': closing_balance
            })
            
        return Response(result)
    
class ProfitLossAPIView(APIView):
    def get(self, request):
        # Parameter für Zeitraum
        start_date_param = request.query_params.get('start_date')
        end_date_param = request.query_params.get('end_date')
        
        # Falls keine Daten angegeben, nehmen wir das aktuelle Jahr
        if not start_date_param:
            start_date = timezone.now().replace(month=1, day=1).date()
        else:
            start_date = parse_date(start_date_param)
            
        if not end_date_param:
            end_date = timezone.now().date()
        else:
            end_date = parse_date(end_date_param)
            
        # DateTime-Objekte mit Zeitzone für Vergleiche erstellen
        start_datetime = timezone.make_aware(
            datetime.datetime.combine(start_date, datetime.time.min)
        )
        end_datetime = timezone.make_aware(
            datetime.datetime.combine(end_date, datetime.time.max)
        )
        
        # Ertragskonten holen
        income_accounts = Account.objects.filter(konto_typ='ERTRAG')
        expense_accounts = Account.objects.filter(konto_typ='AUFWAND')
        
        result = {
            'period': {
                'start': start_date,
                'end': end_date,
            },
            'income': [],
            'expenses': [],
            'summary': {
                'total_income': 0,
                'total_expenses': 0,
                'profit': 0
            }
        }
        
        # Erträge berechnen
        total_income = 0
        for account in income_accounts:
            # Salden für den Zeitraum berechnen - KORRIGIERT:
            # 1. Nur Buchungen, die NICHT storniert wurden
            # 2. Storno-Buchungen werden berücksichtigt, um die ursprünglichen zu neutralisieren
            
            # Normale Buchungen (nicht storniert)
            debit_sum = SubTransaction.objects.filter(
                soll_konto=account,
                booking__datum__gte=start_datetime,
                booking__datum__lte=end_datetime,
                booking__storniert_am__isnull=True,  # Nicht storniert
                booking__is_storno=False  # Keine Storno-Buchungen
            ).aggregate(Sum('betrag'))['betrag__sum'] or 0
            
            credit_sum = SubTransaction.objects.filter(
                haben_konto=account,
                booking__datum__gte=start_datetime,
                booking__datum__lte=end_datetime,
                booking__storniert_am__isnull=True,  # Nicht storniert
                booking__is_storno=False  # Keine Storno-Buchungen
            ).aggregate(Sum('betrag'))['betrag__sum'] or 0
            
            # Bei Ertragskonten ist der Saldo: Haben - Soll
            balance = credit_sum - debit_sum
            total_income += balance
        
        # Aufwendungen berechnen
        total_expenses = 0
        for account in expense_accounts:
            # Gleiche Filterlogik wie oben
            debit_sum = SubTransaction.objects.filter(
                soll_konto=account,
                booking__datum__gte=start_datetime,
                booking__datum__lte=end_datetime,
                booking__storniert_am__isnull=True,  # Nicht storniert
                booking__is_storno=False  # Keine Storno-Buchungen
            ).aggregate(Sum('betrag'))['betrag__sum'] or 0
            
            credit_sum = SubTransaction.objects.filter(
                haben_konto=account,
                booking__datum__gte=start_datetime,
                booking__datum__lte=end_datetime,
                booking__storniert_am__isnull=True,  # Nicht storniert
                booking__is_storno=False  # Keine Storno-Buchungen
            ).aggregate(Sum('betrag'))['betrag__sum'] or 0
            
            # Bei Aufwandskonten ist der Saldo: Soll - Haben
            balance = debit_sum - credit_sum
            total_expenses += balance
        
        # Nach Kategorien gruppieren
        result['income'] = self._group_by_category(result['income'])
        result['expenses'] = self._group_by_category(result['expenses'])
        
        # Zusammenfassung - KORRIGIERT
        result['summary'] = {
            'total_income': total_income,
            'total_expenses': total_expenses,  # Positive Werte für Aufwendungen
            'profit': total_income - total_expenses  # KORRIGIERT: Subtrahieren statt Addieren
        }
        
        return Response(result)
    
    def _group_by_category(self, accounts):
        """Konten nach Kategorien gruppieren"""
        categories = {}
        
        for acc in accounts:
            category = acc['category'] or 'Sonstige'
            
            if category not in categories:
                categories[category] = {
                    'name': category,
                    'accounts': [],
                    'total': 0
                }
                
            categories[category]['accounts'].append(acc)
            categories[category]['total'] += acc['balance']
        
        # Als Liste zurückgeben und nach Kategoriename sortieren
        return sorted(categories.values(), key=lambda x: x['name'])
    
class BalanceSheetAPIView(APIView):
    def get(self, request):
        # Parameter für Zeitraum
        balance_date_param = request.query_params.get('balance_date')
        
        # Falls kein Datum angegeben, nehmen wir das aktuelle Datum
        if not balance_date_param:
            balance_date = timezone.now().date()
        else:
            balance_date = parse_date(balance_date_param)
        
        # DateTime-Objekt mit Zeitzone für Vergleiche erstellen
        balance_datetime = timezone.make_aware(
            datetime.datetime.combine(balance_date, datetime.time.max)
        )
        
        # Konten nach Typen holen
        aktiva_accounts = Account.objects.filter(konto_typ='AKTIV').order_by('kontonummer')
        passiva_accounts = Account.objects.filter(konto_typ='PASSIV').order_by('kontonummer')
        
        result = {
            'balance_date': balance_date,
            'assets': self._get_account_balances(aktiva_accounts, balance_datetime),
            'liabilities': self._get_account_balances(passiva_accounts, balance_datetime),
            'summary': {
                'total_assets': 0,
                'total_liabilities': 0,
                'is_balanced': False
            }
        }
        
        # Summen berechnen
        total_assets = sum(account['balance'] for account in result['assets'])
        total_liabilities = sum(account['balance'] for account in result['liabilities'])
        
        # GuV-Ergebnis berechnen (Jahresüberschuss/-fehlbetrag)
        income_accounts = Account.objects.filter(konto_typ='ERTRAG')
        expense_accounts = Account.objects.filter(konto_typ='AUFWAND')
        
        # Erträge und Aufwendungen berechnen (nur für nicht stornierte Buchungen)
        income_total = 0
        for account in income_accounts:
            debit_sum = SubTransaction.objects.filter(
                soll_konto=account,
                booking__datum__lte=balance_datetime,
                booking__storniert_am__isnull=True,
                booking__is_storno=False
            ).aggregate(Sum('betrag'))['betrag__sum'] or 0
            
            credit_sum = SubTransaction.objects.filter(
                haben_konto=account,
                booking__datum__lte=balance_datetime,
                booking__storniert_am__isnull=True,
                booking__is_storno=False
            ).aggregate(Sum('betrag'))['betrag__sum'] or 0
            
            income_total += credit_sum - debit_sum
        
        expense_total = 0
        for account in expense_accounts:
            debit_sum = SubTransaction.objects.filter(
                soll_konto=account,
                booking__datum__lte=balance_datetime,
                booking__storniert_am__isnull=True,
                booking__is_storno=False
            ).aggregate(Sum('betrag'))['betrag__sum'] or 0
            
            credit_sum = SubTransaction.objects.filter(
                haben_konto=account,
                booking__datum__lte=balance_datetime,
                booking__storniert_am__isnull=True,
                booking__is_storno=False
            ).aggregate(Sum('betrag'))['betrag__sum'] or 0
            
            expense_total += debit_sum - credit_sum
            
        # GuV-Ergebnis
        profit_loss = income_total - expense_total
        
        # Das Ergebnis gehört zu den Passiva als Eigenkapital
        # (Jahresüberschuss bei Gewinn, Jahresfehlbetrag bei Verlust)
        if profit_loss != 0:
            result['liabilities'].append({
                'number': 'GuV',
                'name': 'Jahresergebnis (vorläufig)',
                'category': 'Eigenkapital',
                'balance': profit_loss
            })
            total_liabilities += profit_loss
            
        # Zusammenfassung aktualisieren
        result['summary'] = {
            'total_assets': total_assets,
            'total_liabilities': total_liabilities,
            'is_balanced': abs(total_assets - total_liabilities) < 0.01
        }
        
        return Response(result)
    
    def _get_account_balances(self, accounts, balance_date):
        """Konten mit Salden zum Stichtag berechnen"""
        result = []
        
        for account in accounts:
            # Buchungen bis zum Stichtag berücksichtigen, 
            # aber nur aktive (nicht stornierte)
            debit_sum = SubTransaction.objects.filter(
                soll_konto=account,
                booking__datum__lte=balance_date,
                booking__storniert_am__isnull=True,
                booking__is_storno=False
            ).aggregate(Sum('betrag'))['betrag__sum'] or 0
            
            credit_sum = SubTransaction.objects.filter(
                haben_konto=account,
                booking__datum__lte=balance_date,
                booking__storniert_am__isnull=True,
                booking__is_storno=False
            ).aggregate(Sum('betrag'))['betrag__sum'] or 0
            
            # Saldo berechnen je nach Kontotyp
            if account.konto_typ == 'AKTIV':
                balance = debit_sum - credit_sum
            else:  # PASSIV
                balance = credit_sum - debit_sum
                
            # Nur Konten mit Saldo ≠ 0 anzeigen
            if balance != 0:
                result.append({
                    'id': account.id,
                    'number': account.kontonummer,
                    'name': account.name,
                    'category': account.category or 'Sonstiges',
                    'balance': balance
                })
                
        # Nach Kategorie gruppieren
        return sorted(result, key=lambda x: x['category'] + x['number'])
    
# Zusätzliche Imports hinzufügen
from .models import BusinessYear, YearClosingStep, ClosingAdjustment
from .serializers import (
    BusinessYearSerializer, BusinessYearCreateSerializer,
    YearClosingStepSerializer, ClosingAdjustmentSerializer
)
from django.db.models import Q

class BusinessYearViewSet(viewsets.ModelViewSet):
    """API für Geschäftsjahre"""
    queryset = BusinessYear.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return BusinessYearCreateSerializer
        return BusinessYearSerializer
    
    @action(detail=True, methods=['post'], url_path='start-closing')
    def start_closing(self, request, pk=None):
        """Startet den Jahresabschluss-Workflow für ein Geschäftsjahr"""
        business_year = self.get_object()
        
        # Prüfen, ob das Geschäftsjahr bereits abgeschlossen ist
        if business_year.status == 'CLOSED':
            return Response(
                {'error': 'Das Geschäftsjahr ist bereits abgeschlossen.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Status auf "In Bearbeitung" setzen
        business_year.status = 'IN_PROGRESS'
        business_year.save()
        
        # Schritte erstellen, falls noch nicht vorhanden
        steps = [
            ('PREPARATION', 'Vorbereitung des Jahresabschlusses'),
            ('ADJUSTMENTS', 'Erfassung von Abschlussbuchungen'),
            ('CLOSING', 'Durchführung des Jahresabschlusses'),
            ('OPENING', 'Eröffnung des neuen Geschäftsjahres')
        ]
        
        for step_code, step_notes in steps:
            step, created = YearClosingStep.objects.get_or_create(
                business_year=business_year,
                step=step_code,
                defaults={'notes': step_notes}
            )
            
            # Ersten Schritt als "In Bearbeitung" markieren, falls neu
            if created and step_code == 'PREPARATION':
                step.status = 'IN_PROGRESS'
                step.save()
        
        return Response(BusinessYearSerializer(business_year).data)
    
    @action(detail=True, methods=['post'], url_path='complete-closing')
    def complete_closing(self, request, pk=None):
        """Schließt den Jahresabschluss-Workflow ab"""
        business_year = self.get_object()
        closing_notes = request.data.get('closing_notes', '')
        
        # Prüfen, ob alle Schritte abgeschlossen sind
        incomplete_steps = business_year.closing_steps.exclude(
            Q(status='COMPLETED') | Q(status='SKIPPED')
        )
        
        if incomplete_steps.exists():
            return Response(
                {'error': 'Es gibt noch nicht abgeschlossene Schritte im Jahresabschluss.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Geschäftsjahr als abgeschlossen markieren
        business_year.status = 'CLOSED'
        business_year.closed_at = timezone.now()
        business_year.closing_notes = closing_notes
        business_year.save()
        
        # TODO: Hier könnte man den Jahresabschluss-Bericht generieren
        
        return Response(BusinessYearSerializer(business_year).data)


class YearClosingStepViewSet(viewsets.ModelViewSet):
    """API für Jahresabschluss-Schritte"""
    queryset = YearClosingStep.objects.all()
    serializer_class = YearClosingStepSerializer
    
    @action(detail=True, methods=['post'], url_path='start')
    def start_step(self, request, pk=None):
        """Markiert einen Schritt als begonnen"""
        step = self.get_object()
        
        # Prüfen, ob das Geschäftsjahr noch bearbeitet werden kann
        if not step.business_year.can_be_modified():
            return Response(
                {'error': 'Das Geschäftsjahr kann nicht mehr bearbeitet werden.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        step.start()
        return Response(YearClosingStepSerializer(step).data)
    
    @action(detail=True, methods=['post'], url_path='complete')
    def complete_step(self, request, pk=None):
        """Markiert einen Schritt als abgeschlossen"""
        step = self.get_object()
        notes = request.data.get('notes', '')
        
        # Prüfen, ob das Geschäftsjahr noch bearbeitet werden kann
        if not step.business_year.can_be_modified():
            return Response(
                {'error': 'Das Geschäftsjahr kann nicht mehr bearbeitet werden.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Notizen aktualisieren
        step.notes = notes
        step.complete()
        
        # Wenn es Folgephasen gibt und dies nicht die letzte ist, 
        # die nächste Phase automatisch starten
        next_steps = {
            'PREPARATION': 'ADJUSTMENTS',
            'ADJUSTMENTS': 'CLOSING',
            'CLOSING': 'OPENING'
        }
        
        if step.step in next_steps:
            next_step_code = next_steps[step.step]
            try:
                next_step = YearClosingStep.objects.get(
                    business_year=step.business_year,
                    step=next_step_code
                )
                next_step.start()
            except YearClosingStep.DoesNotExist:
                pass
        
        return Response(YearClosingStepSerializer(step).data)
    
    @action(detail=True, methods=['post'], url_path='skip')
    def skip_step(self, request, pk=None):
        """Überspringt einen Schritt"""
        step = self.get_object()
        reason = request.data.get('reason', '')
        
        # Prüfen, ob das Geschäftsjahr noch bearbeitet werden kann
        if not step.business_year.can_be_modified():
            return Response(
                {'error': 'Das Geschäftsjahr kann nicht mehr bearbeitet werden.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        step.status = 'SKIPPED'
        step.notes = f"Übersprungen: {reason}"
        step.save()
        
        return Response(YearClosingStepSerializer(step).data)


class ClosingAdjustmentViewSet(viewsets.ModelViewSet):
    """API für Abschlussbuchungen"""
    queryset = ClosingAdjustment.objects.all()
    serializer_class = ClosingAdjustmentSerializer
    
    @action(detail=True, methods=['post'], url_path='complete')
    def complete_adjustment(self, request, pk=None):
        """Markiert eine Abschlussbuchung als durchgeführt"""
        adjustment = self.get_object()
        booking_id = request.data.get('booking_id')
        
        # Prüfen, ob die Buchung existiert
        try:
            booking = Booking.objects.get(pk=booking_id)
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Die angegebene Buchung existiert nicht.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verknüpfen und als abgeschlossen markieren
        adjustment.booking = booking
        adjustment.is_completed = True
        adjustment.completed_at = timezone.now()
        adjustment.save()
        
        return Response(ClosingAdjustmentSerializer(adjustment).data)