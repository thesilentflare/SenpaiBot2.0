from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class DiscordAdmin(models.Model):
  user = models.OneToOneField(User, on_delete=models.CASCADE)
  discord_id = models.CharField(max_length=100)
  
  def __str__(self):
    return(f"{self.user.first_name} {self.user.last_name} {self.discord_id}")
  
  class Meta:
    ordering = ['user']
  
class Birthday(models.Model):
  discord_id = models.CharField(max_length=100, unique=True)
  name = models.CharField(max_length=100)
  month = models.IntegerField()
  day = models.IntegerField()
  
  def __str__(self):
    return(f"{self.name} {self.month} {self.day}")
  
  class Meta:
    ordering = ['month']
  
  
class Channel(models.Model):
  channel_name = models.CharField(max_length=100, unique=True)
  channel_id = models.CharField(max_length=100)
  
  def __str__(self):
    return(f"{self.channel_name} {self.channel_id}")
  
  class Meta:
    ordering = ['channel_name']