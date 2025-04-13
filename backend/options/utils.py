# options/utils.py
from .models import Option

def get_option(key, default=None):
    try:
        return Option.objects.get(key=key).value
    except Option.DoesNotExist:
        return default
