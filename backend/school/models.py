from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Sum


class User(AbstractUser):
    class Roles(models.TextChoices):
        STUDENT = "student", "Student"
        INSTRUCTOR = "instructor", "Instructor"
        SECRETARY = "secretary", "Secretary"
        ADMIN = "admin", "Admin"

    role = models.CharField(
        max_length=20,
        choices=Roles.choices,
        default=Roles.STUDENT,
    )

    # Helpers
    @property
    def is_student(self):
        return self.role == self.Roles.STUDENT

    @property
    def is_instructor(self):
        return self.role == self.Roles.INSTRUCTOR

    @property
    def is_secretary(self):
        return self.role == self.Roles.SECRETARY

    @property
    def is_admin_role(self):
        return self.role == self.Roles.ADMIN

    @property
    def is_staff_role(self):
        """Secretary or Admin."""
        return self.role in {self.Roles.SECRETARY, self.Roles.ADMIN}

    def __str__(self):
        return f"{self.username} ({self.role})"


class StudentProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="student_profile",
        limit_choices_to={"role": User.Roles.STUDENT},
    )
    purchased_minutes = models.PositiveIntegerField(default=0)
    phone = models.CharField(max_length=30, blank=True)
    address = models.CharField(max_length=255, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    @property
    def consumed_minutes(self):
        agg = self.user.student_appointments.aggregate(
            total=Sum("duration_minutes_cached")
        )
        return agg["total"] or 0

    @property
    def remaining_minutes(self):
        return max(self.purchased_minutes - self.consumed_minutes, 0)

    def __str__(self):
        return f"Student Profile for {self.user.username}"


class Appointment(models.Model):
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="student_appointments",
        limit_choices_to={"role": User.Roles.STUDENT},
    )
    instructor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="instructor_appointments",
        limit_choices_to={"role": User.Roles.INSTRUCTOR},
    )
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    location = models.CharField(max_length=255)
    # Cached duration in minutes for cheap aggregations.
    duration_minutes_cached = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["start_at"]

    def clean(self):
        errors = {}

        if self.start_at and self.end_at and self.end_at <= self.start_at:
            errors["end_at"] = "La date de fin doit etre apres la date de debut."

        if self.student_id and self.student.role != User.Roles.STUDENT:
            errors["student"] = "L'utilisateur doit etre un etudiant."

        if self.instructor_id and self.instructor.role != User.Roles.INSTRUCTOR:
            errors["instructor"] = "L'utilisateur doit etre un instructeur."

        if errors:
            raise ValidationError(errors)

    @property
    def duration_minutes(self):
        if not self.start_at or not self.end_at:
            return 0
        delta = self.end_at - self.start_at
        return int(delta.total_seconds() // 60)

    def save(self, *args, **kwargs):
        self.duration_minutes_cached = self.duration_minutes
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.student.username} avec {self.instructor.username} "
            f"le {self.start_at:%d/%m/%Y %H:%M}"
        )


class LessonPack(models.Model):
    """Forfait d'heures achete (ou ajoute par une secretaire)."""

    class Source(models.TextChoices):
        SECRETARY = "secretary", "Ajout secretaire"
        ONLINE = "online", "Achat en ligne"

    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="lesson_packs",
        limit_choices_to={"role": User.Roles.STUDENT},
    )
    minutes = models.PositiveIntegerField()
    price_cents = models.PositiveIntegerField(default=0)
    source = models.CharField(max_length=20, choices=Source.choices, default=Source.SECRETARY)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_lesson_packs",
    )
    payment_reference = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.minutes} min for {self.student.username} ({self.source})"


# ---------------------------------------------------------------------------
# Bonus: code training (quiz)
# ---------------------------------------------------------------------------


class QuestionSet(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="question_sets",
        limit_choices_to={"role__in": [User.Roles.INSTRUCTOR, User.Roles.ADMIN]},
    )
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Question(models.Model):
    question_set = models.ForeignKey(
        QuestionSet, on_delete=models.CASCADE, related_name="questions"
    )
    text = models.TextField()
    explanation = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.text[:60]


class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="choices")
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.text} ({'OK' if self.is_correct else 'KO'})"


class QuizAttempt(models.Model):
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="quiz_attempts",
        limit_choices_to={"role": User.Roles.STUDENT},
    )
    question_set = models.ForeignKey(
        QuestionSet, on_delete=models.CASCADE, related_name="attempts"
    )
    score = models.PositiveIntegerField(default=0)
    total = models.PositiveIntegerField(default=0)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.student.username}: {self.score}/{self.total}"
