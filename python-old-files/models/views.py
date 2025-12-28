from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from .models import Birthday, CsvBirthdays
from .forms import AddBirthdayForm, AddCsvBirthdaysForm
import csv

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

def add_birthday_file(request):
    form = AddCsvBirthdaysForm(request.POST or None, request.FILES or None)
    if request.user.is_authenticated:
        if form.is_valid():
            form.save()
            form = AddCsvBirthdaysForm()
            obj = CsvBirthdays.objects.get(activated=False)
            total_rows = success_rows = 0
            with open(obj.file_name.path, 'r') as f:
                reader = csv.reader(f)
                for i, row in enumerate(reader):
                    if i==0:
                        success_rows += 1
                        pass
                    else:
                        try:
                            Birthday.objects.create(id = row[0], name = row[1], month = int(row[2]), day = int(row[3]), discord_id = row[4],)
                            success_rows += 1
                        except:
                            messages.warning(request, "Row {} has issues and was not imported.".format(i))
                    total_rows += 1
                obj.activated = True
                obj.save()
                if (success_rows != total_rows):
                    messages.warning(request, "Birthdays Imported with errors")
                elif (success_rows == 1):
                    messages.error(request, "No birthdays imported")
                else:
                    messages.success(request, "Birthdays Imported")
                return redirect('birthdays')
        return render(request, "add_birthday_file.html", {'form': form})
    else:
            messages.success(request, "You must be logged in to do that")
            return redirect('home')