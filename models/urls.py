from django.contrib import admin
from django.urls import path

from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("logout/", views.logout_user, name="logout"),
    path("birthdays/", views.birthdays, name="birthdays"),
    # path("delete_birthday/<int:pk>", views.delete_birthday, name="delete_birthday"),
    path("add_birthday/", views.add_birthday, name="add_birthday"),
    path("add_birthday_file/", views.add_birthday_file, name="add_birthday_file"),
    # path("update_birthday/<int:pk>", views.update_birthday, name="update_birthday"),
]