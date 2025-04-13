# backend/options/api_views.py
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListAPIView
from .models import Option
from .serializers import OptionSerializer

class OptionListAPIView(ListAPIView):
    queryset = Option.objects.all()
    serializer_class = OptionSerializer
    permission_classes = [IsAuthenticated]
