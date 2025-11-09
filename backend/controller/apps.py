# backend/controller/apps.py

from django.apps import AppConfig
import atexit
import logging

logger = logging.getLogger(__name__)


class ControllerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'controller'
    verbose_name = 'Grow Controller'
    
    def ready(self):
        """Wird aufgerufen wenn Django startet"""
        # Registriere Cleanup-Funktion für Server-Shutdown
        from .plc_interface import cleanup_keepalive_threads
        atexit.register(cleanup_keepalive_threads)
        logger.info("Controller App bereit, Cleanup registriert")