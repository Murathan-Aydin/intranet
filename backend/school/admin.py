from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import (
    Appointment,
    Choice,
    LessonPack,
    Question,
    QuestionSet,
    QuizAttempt,
    StudentProfile,
    User,
)


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("username", "email", "first_name", "last_name", "role", "is_staff")
    list_filter = ("role", "is_staff", "is_superuser", "is_active")

    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Role information", {"fields": ("role",)}),
    )

    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ("Role information", {"fields": ("role",)}),
    )


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "purchased_minutes", "phone")
    search_fields = ("user__username", "user__email")


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("student", "instructor", "start_at", "end_at", "location")
    list_filter = ("start_at", "instructor")
    search_fields = ("student__username", "instructor__username", "location")


@admin.register(LessonPack)
class LessonPackAdmin(admin.ModelAdmin):
    list_display = ("student", "minutes", "price_cents", "source", "created_at")
    list_filter = ("source",)
    search_fields = ("student__username",)


class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 4


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("text", "question_set", "order")
    inlines = [ChoiceInline]


@admin.register(QuestionSet)
class QuestionSetAdmin(admin.ModelAdmin):
    list_display = ("title", "created_by", "is_published", "created_at")
    list_filter = ("is_published",)
    search_fields = ("title",)


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ("student", "question_set", "score", "total", "submitted_at")
    list_filter = ("question_set",)
