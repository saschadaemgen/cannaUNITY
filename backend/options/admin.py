# options/admin.py
from django.contrib import admin
from .models import Option

@admin.register(Option)
class OptionAdmin(admin.ModelAdmin):
    list_display = ("key", "value", "description")
    search_fields = ("key", "description")
