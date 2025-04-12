from django.contrib.auth.decorators import login_required, user_passes_test
from django.shortcuts import render, get_object_or_404, redirect
from .models import Member
from .forms import MemberForm

def is_worker(user):
    return user.groups.filter(name__in=["arbeiter", "teamleiter"]).exists()

def is_teamleiter(user):
    return user.groups.filter(name="teamleiter").exists()

@login_required
@user_passes_test(is_worker)
def member_list(request):
    members = Member.objects.all()
    return render(request, "members/member_list.html", {"members": members})

@login_required
@user_passes_test(is_worker)
def member_create(request):
    form = MemberForm(request.POST or None)
    if form.is_valid():
        form.save()
        return redirect("member_list")
    return render(request, "members/member_form.html", {"form": form})

@login_required
@user_passes_test(is_worker)
def member_update(request, pk):
    member = get_object_or_404(Member, pk=pk)
    form = MemberForm(request.POST or None, instance=member)
    if form.is_valid():
        form.save()
        return redirect("member_list")
    return render(request, "members/member_form.html", {"form": form})

@login_required
@user_passes_test(is_teamleiter)
def member_delete(request, pk):
    member = get_object_or_404(Member, pk=pk)
    if request.method == "POST":
        member.delete()
        return redirect("member_list")
    return render(request, "members/member_confirm_delete.html", {"member": member})

def is_behoerde(user):
    return user.groups.filter(name="behoerden").exists()

@login_required
@user_passes_test(is_worker)
def member_list(request):
    members = Member.objects.all()
    is_teamleiter_user = is_teamleiter(request.user)
    is_behoerden_user = is_behoerde(request.user)

    return render(request, "members/member_list.html", {
        "members": members,
        "is_teamleiter": is_teamleiter_user,
        "is_behoerde": is_behoerden_user,
    })

