import json, os
from django import template
from django.conf import settings

register = template.Library()

@register.simple_tag
def vite_asset(path):
    """
    Gibt den Pfad zur gebauten Vite-Datei anhand des Manifest zurück.
    Beispiel: {% vite_asset 'src/main.jsx' %}
    """
    manifest_path = os.path.join(
        settings.BASE_DIR,
        'static', 'frontend', '.vite', 'manifest.json'
    )
    try:
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
        return '/static/frontend/' + manifest[path]['file']
    except Exception as e:
        return f'<!-- Vite asset not found: {e} -->'
