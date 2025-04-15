from .models import Booking
from django.db.models import Sum
from collections import defaultdict

def get_booking_total(booking):
    return sum(sub.betrag for sub in booking.subtransactions.all())

def get_dashboard_summary():
    all_bookings = Booking.objects.all()

    income = 0
    expense = 0
    monthly_data = defaultdict(lambda: {'income': 0, 'expense': 0})

    for b in all_bookings:
        amount = get_booking_total(b)
        month = b.datum.strftime('%b')

        if b.typ in ['EINZEL', 'MITGLIEDSBEITRAG', 'FOERDERKREDIT']:
            income += amount
            monthly_data[month]['income'] += amount
        else:
            expense += amount
            monthly_data[month]['expense'] += amount

    months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
    chart_data = []
    for m in months:
        chart_data.append({
            'month': m,
            'income': monthly_data[m]['income'],
            'expense': monthly_data[m]['expense'],
        })

    return {
        'total_income': income,
        'total_expense': expense,
        'balance': income - expense,
        'monthly_data': chart_data,
    }
