from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import (
    Appointment,
    Choice,
    LessonPack,
    Question,
    QuestionSet,
    QuizAttempt,
    StudentInvitation,
    StudentProfile,
    User,
)


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


class StudentProfileSerializer(serializers.ModelSerializer):
    consumed_minutes = serializers.IntegerField(read_only=True)
    remaining_minutes = serializers.IntegerField(read_only=True)

    class Meta:
        model = StudentProfile
        fields = (
            "id",
            "purchased_minutes",
            "consumed_minutes",
            "remaining_minutes",
            "phone",
            "address",
            "birth_date",
            "notes",
        )


class UserSerializer(serializers.ModelSerializer):
    student_profile = StudentProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "student_profile",
        )
        read_only_fields = ("id", "is_active")


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "password",
        )

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        if user.role == User.Roles.STUDENT:
            StudentProfile.objects.get_or_create(user=user)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "password",
        )

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        if instance.role == User.Roles.STUDENT:
            StudentProfile.objects.get_or_create(user=instance)
        return instance


# ---------------------------------------------------------------------------
# Appointments
# ---------------------------------------------------------------------------


class AppointmentSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source="student.username", read_only=True)
    instructor_username = serializers.CharField(source="instructor.username", read_only=True)
    student_full_name = serializers.SerializerMethodField()
    instructor_full_name = serializers.SerializerMethodField()
    duration_minutes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Appointment
        fields = (
            "id",
            "student",
            "instructor",
            "student_username",
            "instructor_username",
            "student_full_name",
            "instructor_full_name",
            "start_at",
            "end_at",
            "location",
            "duration_minutes",
        )

    def _full_name(self, user):
        return f"{user.first_name} {user.last_name}".strip() or user.username

    def get_student_full_name(self, obj):
        return self._full_name(obj.student)

    def get_instructor_full_name(self, obj):
        return self._full_name(obj.instructor)

    def validate(self, data):
        start_at = data.get("start_at", getattr(self.instance, "start_at", None))
        end_at = data.get("end_at", getattr(self.instance, "end_at", None))
        student = data.get("student", getattr(self.instance, "student", None))
        instructor = data.get("instructor", getattr(self.instance, "instructor", None))

        if start_at and end_at and end_at <= start_at:
            raise serializers.ValidationError(
                {"end_at": "La date de fin doit etre apres la date de debut."}
            )

        if student and student.role != User.Roles.STUDENT:
            raise serializers.ValidationError(
                {"student": "L'utilisateur doit etre un etudiant."}
            )
        if instructor and instructor.role != User.Roles.INSTRUCTOR:
            raise serializers.ValidationError(
                {"instructor": "L'utilisateur doit etre un instructeur."}
            )

        # Hours availability check
        if student and start_at and end_at:
            duration = int((end_at - start_at).total_seconds() // 60)
            if duration <= 0:
                raise serializers.ValidationError({"end_at": "Duree invalide."})
            profile = getattr(student, "student_profile", None)
            if profile is None:
                profile = StudentProfile.objects.create(user=student)
            available = profile.remaining_minutes
            if self.instance and self.instance.pk:
                available += self.instance.duration_minutes_cached
            if duration > available:
                raise serializers.ValidationError(
                    {
                        "non_field_errors": [
                            f"Heures insuffisantes: l'etudiant dispose de {available} min mais {duration} min sont demandees."
                        ]
                    }
                )
        return data


# ---------------------------------------------------------------------------
# Lesson packs
# ---------------------------------------------------------------------------


class LessonPackSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source="student.username", read_only=True)
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = LessonPack
        fields = (
            "id",
            "student",
            "student_username",
            "minutes",
            "price_cents",
            "source",
            "created_by",
            "created_by_username",
            "payment_reference",
            "created_at",
        )
        read_only_fields = ("id", "created_at", "created_by")


class OnlinePurchaseSerializer(serializers.Serializer):
    """Used by students to "buy" a pack online (mocked, no real payment)."""

    minutes = serializers.IntegerField(min_value=30, max_value=6000)
    card_holder = serializers.CharField(max_length=120)
    card_last4 = serializers.CharField(max_length=4, min_length=4)


# ---------------------------------------------------------------------------
# Quiz / code training
# ---------------------------------------------------------------------------


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ("id", "text", "is_correct")


class ChoicePublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ("id", "text")


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True)

    class Meta:
        model = Question
        fields = ("id", "text", "explanation", "order", "choices")

    def create(self, validated_data):
        choices = validated_data.pop("choices", [])
        question = Question.objects.create(**validated_data)
        for choice in choices:
            Choice.objects.create(question=question, **choice)
        return question

    def update(self, instance, validated_data):
        choices = validated_data.pop("choices", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if choices is not None:
            instance.choices.all().delete()
            for choice in choices:
                Choice.objects.create(question=instance, **choice)
        return instance


class QuestionPublicSerializer(serializers.ModelSerializer):
    """Serializer used when sending a quiz to a student (without is_correct)."""

    choices = ChoicePublicSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ("id", "text", "order", "choices")


class QuestionSetSerializer(serializers.ModelSerializer):
    questions_count = serializers.IntegerField(source="questions.count", read_only=True)

    class Meta:
        model = QuestionSet
        fields = (
            "id",
            "title",
            "description",
            "is_published",
            "created_by",
            "created_at",
            "questions_count",
        )
        read_only_fields = ("id", "created_at", "created_by")


class QuestionSetDetailSerializer(QuestionSetSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta(QuestionSetSerializer.Meta):
        fields = QuestionSetSerializer.Meta.fields + ("questions",)


class QuestionSetPublicSerializer(serializers.ModelSerializer):
    questions = QuestionPublicSerializer(many=True, read_only=True)

    class Meta:
        model = QuestionSet
        fields = ("id", "title", "description", "questions")


class QuizSubmissionSerializer(serializers.Serializer):
    answers = serializers.DictField(
        child=serializers.IntegerField(), help_text="{question_id: choice_id}"
    )


class QuizAttemptSerializer(serializers.ModelSerializer):
    question_set_title = serializers.CharField(source="question_set.title", read_only=True)

    class Meta:
        model = QuizAttempt
        fields = (
            "id",
            "student",
            "question_set",
            "question_set_title",
            "score",
            "total",
            "submitted_at",
        )


# ---------------------------------------------------------------------------
# Student invitations
# ---------------------------------------------------------------------------


class StudentInvitationSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(
        source="created_by.username", read_only=True
    )

    class Meta:
        model = StudentInvitation
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "created_by_username",
            "created_at",
            "expires_at",
            "accepted_at",
            "status",
        )
        read_only_fields = (
            "id",
            "created_by_username",
            "created_at",
            "expires_at",
            "accepted_at",
            "status",
        )

    def get_status(self, obj):
        if obj.is_accepted:
            return "accepted"
        if obj.is_expired:
            return "expired"
        return "pending"


class StudentInvitationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentInvitation
        fields = ("email", "first_name", "last_name")

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "Un compte avec cet email existe deja."
            )
        return value


class StudentInvitationPublicSerializer(serializers.ModelSerializer):
    """Read-only view exposed publicly via the token URL."""

    class Meta:
        model = StudentInvitation
        fields = ("email", "first_name", "last_name", "expires_at")


class StudentInvitationAcceptSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate_username(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Identifiant requis.")
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Identifiant deja utilise.")
        return value
