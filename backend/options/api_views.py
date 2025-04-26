from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListAPIView
from .models import Option
from .serializers import OptionSerializer

class OptionListAPIView(ListAPIView):
    queryset = Option.objects.all()
    serializer_class = OptionSerializer
    permission_classes = [IsAuthenticated]

class TopbarTitleAPIView(APIView):
    def get(self, request):
        title_option = Option.objects.filter(key='topbar_title').first()
        if title_option:
            return Response({'title': title_option.value})
        return Response({'title': 'cannaUNITY'})  # Fallback-Titel
    
class UpdateTopbarTitleAPIView(APIView):
    def post(self, request):
        new_title = request.data.get('title')
        if new_title:
            option, created = Option.objects.get_or_create(key='topbar_title')
            option.value = new_title
            option.save()
            return Response({'success': True})
        return Response({'success': False}, status=400)

class TopbarTitleStyleAPIView(APIView):
    def get(self, request):
        style_option = Option.objects.filter(key='topbar_title_style').first()
        if style_option:
            return Response({'style': style_option.value})
        return Response({'style': '{}'})  # Leeres JSON-Objekt als Fallback
    
class UpdateTopbarTitleStyleAPIView(APIView):
    def post(self, request):
        new_style = request.data.get('style')
        if new_style:
            option, created = Option.objects.get_or_create(key='topbar_title_style')
            option.value = new_style
            option.save()
            return Response({'success': True})
        return Response({'success': False}, status=400)

# Neue API-Views für erweiterte Design-Optionen
class DesignOptionsAPIView(APIView):
    def get(self, request):
        design_option = Option.objects.filter(key='design_options').first()
        if design_option:
            return Response({'options': design_option.value})
        return Response({'options': '{}'})  # Leeres JSON-Objekt als Fallback
    
class UpdateDesignOptionsAPIView(APIView):
    def post(self, request):
        new_options = request.data.get('options')
        if new_options:
            option, created = Option.objects.get_or_create(key='design_options')
            option.value = new_options
            option.save()
            return Response({'success': True})
        return Response({'success': False}, status=400)