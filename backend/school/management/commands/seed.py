"""Seed the database with the initial fixture and reset demo passwords.

Usage:
    python manage.py seed
"""

from django.core.management import call_command
from django.core.management.base import BaseCommand

from school.models import StudentProfile, User


DEMO_PASSWORD = "Password123!"


class Command(BaseCommand):
    help = "Load fixtures and reset demo passwords."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("> Loading fixture initial_data.json"))
        call_command("loaddata", "initial_data.json")

        self.stdout.write(self.style.NOTICE("> Resetting demo passwords"))
        for user in User.objects.all():
            user.set_password(DEMO_PASSWORD)
            user.save()
            if user.role == User.Roles.STUDENT:
                StudentProfile.objects.get_or_create(user=user)

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. All demo accounts use the password: {DEMO_PASSWORD}\n"
                "Accounts: admin, secretary, instructor, instructor2, student, student2"
            )
        )
