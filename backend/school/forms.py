"""Form classes (required by the project specs)."""

from django import forms
from django.contrib.auth.forms import UserCreationForm

from .models import Appointment, LessonPack, QuestionSet, User


class UserCreateForm(UserCreationForm):
    """Form used by secretaries/admins to create student or instructor accounts."""

    role = forms.ChoiceField(choices=User.Roles.choices)
    email = forms.EmailField(required=False)
    first_name = forms.CharField(required=False, max_length=150)
    last_name = forms.CharField(required=False, max_length=150)

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "password1",
            "password2",
        )


class AppointmentForm(forms.ModelForm):
    class Meta:
        model = Appointment
        fields = ("student", "instructor", "start_at", "end_at", "location")
        widgets = {
            "start_at": forms.DateTimeInput(attrs={"type": "datetime-local"}),
            "end_at": forms.DateTimeInput(attrs={"type": "datetime-local"}),
        }

    def clean(self):
        cleaned = super().clean()
        student = cleaned.get("student")
        start_at = cleaned.get("start_at")
        end_at = cleaned.get("end_at")

        if student and start_at and end_at:
            duration = int((end_at - start_at).total_seconds() // 60)
            if duration <= 0:
                raise forms.ValidationError("Duree invalide.")
            profile = getattr(student, "student_profile", None)
            if profile is None:
                raise forms.ValidationError("L'etudiant n'a pas de profil.")
            available = profile.remaining_minutes
            # On edition we should not double-count the current appointment minutes.
            if self.instance and self.instance.pk:
                available += self.instance.duration_minutes_cached
            if duration > available:
                raise forms.ValidationError(
                    f"L'etudiant n'a pas assez d'heures (disponible: {available} min, requis: {duration} min)."
                )
        return cleaned


class LessonPackForm(forms.ModelForm):
    class Meta:
        model = LessonPack
        fields = ("student", "minutes", "price_cents", "source")


class QuestionSetForm(forms.ModelForm):
    class Meta:
        model = QuestionSet
        fields = ("title", "description", "is_published")
