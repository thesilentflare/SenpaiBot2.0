from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.apps import apps
from models.models import DiscordAdmin, Birthday, Channel


# Register your custom models here.
class DiscordAdminInline(admin.StackedInline):
    model = DiscordAdmin
    can_delete = False
    verbose_name_plural = "discord_admin"

# Define a new User admin
class UserAdmin(BaseUserAdmin):
    inlines = [DiscordAdminInline]

class DiscordDisplayAdmin(admin.ModelAdmin):
    list_display = ["user","discord_id"]


class BirthdayAdmin(admin.ModelAdmin):
    list_display = ["name","month","day"]
    
class ChannelAdmin(admin.ModelAdmin):
    list_display = ["channel_name","channel_id"]

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)
admin.site.register(DiscordAdmin, DiscordDisplayAdmin)
admin.site.register(Birthday, BirthdayAdmin)
admin.site.register(Channel, ChannelAdmin)



# Auto-Registers rest of your models here.
models = apps.get_app_config('models').get_models()

for model in models:
    try:
        admin.site.register(model)
    except admin.sites.AlreadyRegistered:
        pass