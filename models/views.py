from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from .models import Birthday
from .forms import AddBirthdayForm

# Create your views here.
def home(request):
    # check to see if logging in
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        # auth
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            messages.success(request, "Logged In")
            return redirect("home")
        else:
            messages.error(request, "Error logging in")
            return redirect("home")
    else:
        return render(request, "home.html", {})
      
def logout_user(request):
    logout(request)
    messages.success(request, "Logged Out")
    return redirect("home")
  
def birthdays(request):
    birthdays = Birthday.objects.all()
    
    
    # check to see if logging in
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        # auth
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            messages.success(request, "Logged In")
            return redirect("birthdays")
        else:
            messages.error(request, "Error logging in")
            return redirect("home")
    else:
        return render(request, "birthdays.html", {'birthdays': birthdays})
      
def add_birthday(request):
    form = AddBirthdayForm(request.POST or None)
    if request.user.is_authenticated:
        if request.method == "POST":
            if form.is_valid():
                add_birthday = form.save()
                messages.success(request, "Birthday Added")
                return redirect('birthdays')
        
        return render(request, "add_birthday.html", {'form': form})
    else:
        messages.success(request, "You must be logged in to do that")
        return redirect('home')