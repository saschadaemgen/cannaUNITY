from django.contrib import admin
from .models import Room

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    # 'created_by' aus list_display entfernen
    list_display = ('name', 'capacity', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')