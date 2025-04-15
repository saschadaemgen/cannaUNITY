from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.generics import ListAPIView
from django.db.models import Q
from .models import Member
from .serializers import MemberSerializer
from rest_framework.pagination import PageNumberPagination

class MemberPagination(PageNumberPagination):
    page_size = 25

class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.all().order_by("id")
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = MemberPagination  # ✅ das fehlte!

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        is_teamleiter = request.user.groups.filter(name="teamleiter").exists()
        response.data["extra"] = {"is_teamleiter": is_teamleiter}
        return response


# Neue Klasse für die verbesserte Mitgliedersuche
class MemberSearchAPIView(ListAPIView):
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
    
    def get_queryset(self):
        queryset = Member.objects.all().order_by('last_name', 'first_name')
        search = self.request.query_params.get('search', '')
        limit = int(self.request.query_params.get('limit', 10))
        exact = self.request.query_params.get('exact', 'false').lower() == 'true'
        
        if search and len(search) >= 2:
            if exact:
                # Exakte Suche (für Anfangsbuchstaben)
                queryset = queryset.filter(
                    Q(first_name__istartswith=search) | 
                    Q(last_name__istartswith=search)
                )
            else:
                # Allgemeine Suche (enthält)
                queryset = queryset.filter(
                    Q(first_name__icontains=search) | 
                    Q(last_name__icontains=search)
                )
        
        return queryset[:limit]  # Begrenze die Ergebnisse


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_info(request):
    user = request.user
    groups = list(user.groups.values_list('name', flat=True))
    return Response({
        "username": user.username,
        "groups": groups
    })


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return Response({"message": "Login erfolgreich."})
    return Response({"error": "Login fehlgeschlagen."}, status=401)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({"message": "Erfolgreich ausgeloggt."})