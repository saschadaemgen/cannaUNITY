from django import forms
from django.utils.timezone import now
from .models import Account, Booking, SubTransaction
from .utils import CATEGORY_CHOICES
from members.models import Member
from decimal import Decimal

# -----------------------------------------------------------------------------
# Formular für Hauptbuchungen (Booking) – Einzel- und Mehrfachbuchungen
# -----------------------------------------------------------------------------
class BookingForm(forms.ModelForm):
    """
    Dieses Formular ermöglicht das Erstellen von Hauptbuchungen.
    Es unterstützt sowohl Einzelbuchungen als auch Mehrfachbuchungen.
    """

    transactions = forms.JSONField(widget=forms.HiddenInput(), required=False)

    class Meta:
        model = Booking
        fields = ["typ", "datum", "mitglied", "verwendungszweck"]

    def save(self, commit=True):
        """
        Speichert die Hauptbuchung und zugehörige SubTransactions.
        """
        booking = super().save(commit=False)
        if commit:
            booking.save()
            transactions_data = self.cleaned_data.get("transactions", [])

            for txn_data in transactions_data:
                soll_konto = Account.objects.get(id=txn_data.get("soll_konto"))
                haben_konto = Account.objects.get(id=txn_data.get("haben_konto"))
                betrag = Decimal(txn_data.get("betrag"))

                # Unterbuchung (SubTransaction) speichern
                sub_transaction = SubTransaction.objects.create(
                    booking=booking,
                    betrag=betrag,
                    soll_konto=soll_konto,
                    haben_konto=haben_konto,
                )

                # Aktualisierung der Kontostände
                soll_konto.saldo += betrag  
                haben_konto.saldo -= betrag  

                soll_konto.save(update_fields=["saldo"])
                haben_konto.save(update_fields=["saldo"])

        return booking

# -----------------------------------------------------------------------------
# Formular für Unterbuchungen (SubTransaction) – Teil einer Hauptbuchung
# -----------------------------------------------------------------------------
class SubTransactionForm(forms.ModelForm):
    """
    Dieses Formular wird für einzelne Buchungssätze innerhalb einer Hauptbuchung verwendet.
    """

    datum = forms.DateField(
        widget=forms.DateInput(attrs={"type": "date", "class": "form-control"}),
        required=True,
        initial=now().date()
    )

    betrag = forms.DecimalField(
        widget=forms.NumberInput(attrs={"class": "form-control", "step": "0.01"})
    )

    verwendungszweck = forms.CharField(
        widget=forms.TextInput(attrs={"class": "form-control"})
    )

    # Hier direkt das Queryset setzen
    soll_konto = forms.ModelChoiceField(
        queryset=Account.objects.all(),  # Direkt alle Konten setzen
        widget=forms.Select(attrs={"class": "form-select"}),
        label="Soll-Konto",
        required=True
    )

    haben_konto = forms.ModelChoiceField(
        queryset=Account.objects.all(),  # Direkt alle Konten setzen
        widget=forms.Select(attrs={"class": "form-select"}),
        label="Haben-Konto",
        required=True
    )

    mitglied = forms.ModelChoiceField(
        queryset=Member.objects.all(),
        widget=forms.Select(attrs={"class": "form-select"}),  
        required=False,
        label="Mitglied"
    )

    class Meta:
        model = SubTransaction
        fields = ["datum", "betrag", "verwendungszweck", "soll_konto", "haben_konto", "mitglied"]

    def clean(self):
        """
        Validiert, dass Soll- und Haben-Konto nicht identisch sind.
        """
        cleaned_data = super().clean()
        soll_konto = cleaned_data.get("soll_konto")
        haben_konto = cleaned_data.get("haben_konto")

        if soll_konto and haben_konto and soll_konto == haben_konto:
            raise forms.ValidationError("❌ Soll- und Haben-Konto dürfen nicht identisch sein!")

        return cleaned_data

# -----------------------------------------------------------------------------
# Formular für Kontenverwaltung (AccountForm)
# -----------------------------------------------------------------------------
class AccountForm(forms.ModelForm):
    """
    Formular zur Erstellung und Bearbeitung von Konten.
    """

    konto_typ = forms.ChoiceField(
        choices=Account.KONTO_TYPEN,
        widget=forms.Select(attrs={'class': 'form-select'}),
        label="Konto-Typ"
    )

    category = forms.ChoiceField(
        choices=CATEGORY_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'}),
        required=False,
        label="Kategorie"
    )

    class Meta:
        model = Account
        fields = ['kontonummer', 'name', 'saldo', 'konto_typ', 'category']
        widgets = {
            'kontonummer': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Kontonummer eingeben'}),
            'name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Kontoname eingeben'}),
            'saldo': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Saldo in EUR'}),
        }
