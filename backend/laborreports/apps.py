# laborreports/apps.py
from django.apps import AppConfig

class LaborReportsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'laborreports'

    def ready(self):
        # Keine Modellimporte hier!
        pass
