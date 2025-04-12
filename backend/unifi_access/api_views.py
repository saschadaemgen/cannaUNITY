from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import AccessEvent
from .serializers import AccessEventSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_latest_events(request):
    events = AccessEvent.objects.all().order_by('-timestamp')[:50]
    serializer = AccessEventSerializer(events, many=True)
    return Response(serializer.data)
