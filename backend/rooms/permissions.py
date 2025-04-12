from rest_framework import permissions

class IsTeamLeaderOrReadOnly(permissions.BasePermission):
    """
    Erlaubt Lese-Zugriff für alle, aber nur Teamleiter können bearbeiten.
    """
    def has_permission(self, request, view):
        # Lesezugriff ist immer erlaubt
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Schreibzugriff nur für Teamleiter
        return request.user.groups.filter(name='teamleiter').exists()
    
    def has_object_permission(self, request, view, obj):
        # Lesezugriff ist immer erlaubt
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Schreibzugriff nur für Teamleiter
        return request.user.groups.filter(name='teamleiter').exists()