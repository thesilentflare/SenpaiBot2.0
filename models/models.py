from django.db import models

# Create your models here.
class Birthday(models.Model):
  discord_id = models.CharField(max_length=100)
  name = models.CharField(max_length=100)
  month = models.IntegerField()
  day = models.IntegerField()
  
  def __str__(self):
    return(f"{self.name} {self.month} {self.day}")