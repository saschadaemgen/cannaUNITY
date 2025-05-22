from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from interface.views import index_view

# REST-Framework-Router für ViewSets
from rooms.api_views import RoomViewSet
from options.api_views import OptionListAPIView
from buchhaltung.views_api import BookingJournalAPIView
from members.views_auth import login_view, logout_view

# Router für die importierten ViewSets
router = DefaultRouter()
router.register(r'rooms', RoomViewSet)

urlpatterns = [
    # 🔐 Adminbereich
    path('admin/', admin.site.urls),

    # 🌐 API-Routen für ViewSets
    path('api/', include(router.urls)),

    # 🔑 Authentifizierung & Benutzerinfos
    path('api/login/', login_view),
    path('api/logout/', logout_view),
    path('api/token/', obtain_auth_token, name='api_token'),

    # Members API-Routen einbinden (inkl. user_info und Integration)
    path('', include('members.api_urls')),

    # 🏡 Startseite (SPA wird hier geladen)
    path('', index_view, name='index'),

    # 🔐 UniFi-Zugriffs-API - mit eindeutigen Namespaces
    path('unifi_access/', include('unifi_access.urls', namespace='unifi_access_web')),      # Für Port 8000
    path('api/unifi_access/', include('unifi_access.urls', namespace='unifi_access_api')),  # Für Vite

    # 🛡️ UniFi Protect-API – NEU HINZUGEFÜGT
    path('unifi_protect/', include('unifi_protect.api_urls')),          # Für Port 8000 (REACT BUILD)
    path('api/unifi_protect/', include('unifi_protect.api_urls')),      # Für Dev-Server

    # ⚙️ Optionen-API
    path('api/options/', include('options.api_urls')),

    # 💰 Buchhaltungs-API
    path('api/buchhaltung/', include('buchhaltung.urls')),
    path('api/buchhaltung/journal/', BookingJournalAPIView.as_view(), name="api-booking-journal"),
    path('buchhaltung/journal/', BookingJournalAPIView.as_view(), name='booking-journal'),

    # 🌱 Track and Trace
    path('api/trackandtrace/', include('trackandtrace.urls')),
    path('api/', include('rooms.api_urls')),

    # 🔑 WaWi
    path('wawi/', include('wawi.api_urls')),
    path('api/wawi/', include('wawi.api_urls')),

    # 🌱 Grow Controller
    path('controller/', include('controller.urls')),           # Für Port 8000 (Build Mode)
    path('api/controller/', include('controller.api_urls')),   # Für Vite (Dev Mode)
    
    # 🔖 RFID-Bridge für nahtlose RFID-Authentifizierung
    path('rfid-bridge/', include('rfid_bridge.api_urls')),     # Für Port 8000 (Build Mode)
    path('api/rfid-bridge/', include('rfid_bridge.api_urls')), # Für Vite (Dev Mode)

    # ⚙️ Labor Berichte
    path('laborreports/', include('laborreports.api_urls')),      # für Port 8000 (Build-Modus)
    path('api/laborreports/', include('laborreports.api_urls')),  # für Port 5173 (Dev-Modus)

    path("api/unifi_api_debug/", include("unifi_api_debug.api_urls")),
    path("unifi_api_debug/", include("unifi_api_debug.api_urls")),  # für Build-Modus

    # TaskManager API-Routen
    path('taskmanager/', include('taskmanager.api_urls')),           # für Port 8000 (Build-Modus)
    path('api/taskmanager/', include('taskmanager.api_urls')),       # für Port 5173

]

# 🔁 Fallback für alle nicht-API-URLs → React SPA laden
urlpatterns += [
    re_path(r'^(?!api|admin|static|media).*', index_view),
]

# Medien-URLs einbinden
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # Auch in Produktion Medien-URLs bereitstellen (optional, wenn kein Webserver konfiguriert ist)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)