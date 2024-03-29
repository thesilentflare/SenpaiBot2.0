from .models import Birthday, CsvBirthdays
from django import forms

class AddBirthdayForm(forms.ModelForm):
  name = forms.CharField(label="", max_length="100", widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Name'}))
  discord_id = forms.CharField(label="", max_length="100", widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Discord ID'}))
  month = forms.IntegerField(label="", widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Month'}))
  day = forms.IntegerField(label="", widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Day'}))
  
  class Meta:
    model = Birthday
    fields = ('name', 'discord_id', 'month', 'day')
    
  def __init__(self, *args, **kwargs):
    super(AddBirthdayForm, self).__init__(*args, **kwargs)
    

class AddCsvBirthdaysForm(forms.ModelForm):
  class Meta:
    model = CsvBirthdays
    fields = ('file_name',)