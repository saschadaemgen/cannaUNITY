from django.contrib import admin
from .models import RFIDSession

@admin.register(RFIDSession)
class RFIDSessionAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'target_app', 'created_at', 'expires_at', 'used', 'member_id')
    list_filter = ('target_app', 'used')
    search_fields = ('session_id', 'target_app', 'member_id')
    readonly_fields = ('session_id', 'created_at')
    
    def has_delete_permission(self, request, obj=None):
        # Sessions sollten nicht gelöscht werden für Audit-Zwecke
        return False