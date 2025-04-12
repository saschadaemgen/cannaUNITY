from django.contrib import admin
from .models import AccessEvent

@admin.register(AccessEvent)
class AccessEventAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'actor', 'door', 'event_type')
    list_filter = ('event_type', 'door')
    search_fields = ('actor',)
