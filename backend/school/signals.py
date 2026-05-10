from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import StudentProfile, User


@receiver(post_save, sender=User)
def ensure_student_profile(sender, instance, created, **kwargs):
    """Make sure every Student has a profile."""
    if instance.role == User.Roles.STUDENT:
        StudentProfile.objects.get_or_create(user=instance)
