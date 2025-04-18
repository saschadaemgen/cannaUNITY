from django.views.generic import ListView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from .models import MembershipModel
from .forms import MembershipModelForm

class MembershipModelListView(ListView):
    model = MembershipModel
    template_name = "members/membership_model_list.html"
    context_object_name = "modelle"

class MembershipModelCreateView(CreateView):
    model = MembershipModel
    form_class = MembershipModelForm
    template_name = "members/membership_model_form.html"
    success_url = reverse_lazy("members:membership_model_list")

class MembershipModelUpdateView(UpdateView):
    model = MembershipModel
    form_class = MembershipModelForm
    template_name = "members/membership_model_form.html"
    success_url = reverse_lazy("members:membership_model_list")

class MembershipModelDeleteView(DeleteView):
    model = MembershipModel
    template_name = "members/membership_model_confirm_delete.html"
    success_url = reverse_lazy("members:membership_model_list")
