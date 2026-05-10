from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.views.generic import TemplateView
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Appointment,
    Choice,
    LessonPack,
    Question,
    QuestionSet,
    QuizAttempt,
    QuizAttemptAnswer,
    StudentProfile,
    User,
)
from .permissions import IsSecretaryOrAdmin, IsStaffRole
from .serializers import (
    AppointmentSerializer,
    LessonPackSerializer,
    OnlinePurchaseSerializer,
    QuestionSerializer,
    QuestionSetDetailSerializer,
    QuestionSetPublicSerializer,
    QuestionSetSerializer,
    QuizAttemptSerializer,
    QuizSubmissionSerializer,
    UserCreateSerializer,
    UserSerializer,
    UserUpdateSerializer,
)


# ---------------------------------------------------------------------------
# Django generic view (required by the project: "Vues generiques" + template engine)
# ---------------------------------------------------------------------------


class HomeView(TemplateView):
    """Public landing page served by the Django template engine."""

    template_name = "school/home.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["roles"] = User.Roles.choices
        return ctx


# ---------------------------------------------------------------------------
# Auth / current user
# ---------------------------------------------------------------------------


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


# ---------------------------------------------------------------------------
# Users management
# ---------------------------------------------------------------------------


class UserViewSet(viewsets.ModelViewSet):
    """
    Secretaries can manage Student & Instructor accounts.
    Admins can manage everyone (including Secretaries).
    """

    queryset = User.objects.all().order_by("username")

    def get_permissions(self):
        return [IsSecretaryOrAdmin()]

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        if self.action in {"update", "partial_update"}:
            return UserUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        role = self.request.query_params.get("role")
        if role:
            qs = qs.filter(role=role)
        if self.request.user.role == User.Roles.SECRETARY:
            # A secretary can only manage students and instructors
            qs = qs.filter(role__in=[User.Roles.STUDENT, User.Roles.INSTRUCTOR])
        return qs

    def perform_create(self, serializer):
        target_role = serializer.validated_data.get("role")
        user = self.request.user
        if user.role == User.Roles.SECRETARY and target_role not in {
            User.Roles.STUDENT,
            User.Roles.INSTRUCTOR,
        }:
            raise PermissionDenied(
                "Une secretaire ne peut creer que des comptes Student ou Instructor."
            )
        if target_role == User.Roles.ADMIN and user.role != User.Roles.ADMIN:
            raise PermissionDenied("Seul un admin peut creer un autre admin.")
        serializer.save()

    def perform_update(self, serializer):
        instance = self.get_object()
        user = self.request.user
        if user.role == User.Roles.SECRETARY and instance.role in {
            User.Roles.SECRETARY,
            User.Roles.ADMIN,
        }:
            raise PermissionDenied("Action interdite.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role == User.Roles.SECRETARY and instance.role in {
            User.Roles.SECRETARY,
            User.Roles.ADMIN,
        }:
            raise PermissionDenied("Action interdite.")
        instance.delete()

    @action(detail=True, methods=["get"], url_path="planning")
    def planning(self, request, pk=None):
        user = self.get_object()
        if user.role == User.Roles.STUDENT:
            qs = Appointment.objects.filter(student=user)
        elif user.role == User.Roles.INSTRUCTOR:
            qs = Appointment.objects.filter(instructor=user)
        else:
            qs = Appointment.objects.none()
        return Response(AppointmentSerializer(qs, many=True).data)


# ---------------------------------------------------------------------------
# Appointments
# ---------------------------------------------------------------------------


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Appointment.objects.select_related("student", "instructor")

        if user.role == User.Roles.STUDENT:
            qs = qs.filter(student=user)
        elif user.role == User.Roles.INSTRUCTOR:
            qs = qs.filter(instructor=user)
        # Secretary / Admin -> see everything

        student_id = self.request.query_params.get("student")
        instructor_id = self.request.query_params.get("instructor")
        if student_id:
            qs = qs.filter(student_id=student_id)
        if instructor_id:
            qs = qs.filter(instructor_id=instructor_id)
        return qs

    def _check_can_write(self, request, instance=None, target_student=None, target_instructor=None):
        user = request.user
        if user.role == User.Roles.STUDENT:
            raise PermissionDenied("Les etudiants ne peuvent pas modifier leur planning directement.")
        if user.role == User.Roles.INSTRUCTOR:
            instructor = target_instructor or (instance.instructor if instance else None)
            if instructor and instructor.id != user.id:
                raise PermissionDenied("Vous ne pouvez modifier que vos propres rendez-vous.")
        # secretary / admin: ok

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == User.Roles.STUDENT:
            raise PermissionDenied("Les etudiants ne peuvent pas creer de rendez-vous.")
        if user.role == User.Roles.INSTRUCTOR:
            instructor = serializer.validated_data.get("instructor")
            if not instructor or instructor.id != user.id:
                raise PermissionDenied(
                    "Un instructeur ne peut creer un rendez-vous que pour lui-meme."
                )
        serializer.save()

    def perform_update(self, serializer):
        instance = self.get_object()
        self._check_can_write(self.request, instance=instance)
        serializer.save()

    def perform_destroy(self, instance):
        self._check_can_write(self.request, instance=instance)
        instance.delete()


# ---------------------------------------------------------------------------
# Lesson packs (forfaits)
# ---------------------------------------------------------------------------


class LessonPackViewSet(viewsets.ModelViewSet):
    serializer_class = LessonPackSerializer

    def get_queryset(self):
        user = self.request.user
        qs = LessonPack.objects.select_related("student", "created_by").all()
        if user.role == User.Roles.STUDENT:
            qs = qs.filter(student=user)
        student_id = self.request.query_params.get("student")
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs

    def get_permissions(self):
        if self.action in {"list", "retrieve", "buy_online"}:
            return [IsAuthenticated()]
        return [IsSecretaryOrAdmin()]

    def perform_create(self, serializer):
        pack = serializer.save(created_by=self.request.user, source=LessonPack.Source.SECRETARY)
        # Update the student's purchased_minutes
        profile, _ = StudentProfile.objects.get_or_create(user=pack.student)
        profile.purchased_minutes = (profile.purchased_minutes or 0) + pack.minutes
        profile.save()

    @action(detail=False, methods=["post"], url_path="buy", permission_classes=[IsAuthenticated])
    def buy_online(self, request):
        """Mocked online purchase by a student (no real payment provider)."""
        if request.user.role != User.Roles.STUDENT:
            raise PermissionDenied("Seuls les etudiants peuvent acheter des heures en ligne.")
        serializer = OnlinePurchaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        minutes = serializer.validated_data["minutes"]
        last4 = serializer.validated_data["card_last4"]
        # Pricing: 1 EUR per minute (just an example)
        price_cents = minutes * 100
        pack = LessonPack.objects.create(
            student=request.user,
            minutes=minutes,
            price_cents=price_cents,
            source=LessonPack.Source.ONLINE,
            payment_reference=f"MOCK-****{last4}",
        )
        profile, _ = StudentProfile.objects.get_or_create(user=request.user)
        profile.purchased_minutes = (profile.purchased_minutes or 0) + minutes
        profile.save()
        return Response(LessonPackSerializer(pack).data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Quiz
# ---------------------------------------------------------------------------


class QuestionSetViewSet(viewsets.ModelViewSet):
    queryset = QuestionSet.objects.all()

    def get_serializer_class(self):
        if self.action == "retrieve":
            return QuestionSetDetailSerializer
        if self.action == "play":
            return QuestionSetPublicSerializer
        return QuestionSetSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve", "play", "submit"}:
            return [IsAuthenticated()]
        # Instructors can manage their own; admins can manage all
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset().select_related("created_by").prefetch_related("questions__choices")
        user = self.request.user
        if user.role == User.Roles.STUDENT:
            qs = qs.filter(is_published=True)
        return qs

    def perform_create(self, serializer):
        if self.request.user.role not in {User.Roles.INSTRUCTOR, User.Roles.ADMIN}:
            raise PermissionDenied("Seuls les instructeurs/admin peuvent creer des series.")
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        instance = self.get_object()
        user = self.request.user
        if user.role == User.Roles.INSTRUCTOR and instance.created_by_id != user.id:
            raise PermissionDenied("Vous ne pouvez modifier que vos propres series.")
        if user.role == User.Roles.STUDENT:
            raise PermissionDenied("Action interdite.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role == User.Roles.INSTRUCTOR and instance.created_by_id != user.id:
            raise PermissionDenied("Vous ne pouvez supprimer que vos propres series.")
        if user.role == User.Roles.STUDENT:
            raise PermissionDenied("Action interdite.")
        instance.delete()

    @action(detail=True, methods=["get"], url_path="play")
    def play(self, request, pk=None):
        """Return the quiz without 'is_correct' so a student can answer it."""
        question_set = self.get_object()
        return Response(QuestionSetPublicSerializer(question_set).data)

    @action(detail=True, methods=["post"], url_path="submit")
    def submit(self, request, pk=None):
        question_set = self.get_object()
        if request.user.role != User.Roles.STUDENT:
            raise PermissionDenied("Seuls les etudiants peuvent soumettre une tentative.")
        serializer = QuizSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        answers = serializer.validated_data["answers"]
        questions = question_set.questions.prefetch_related("choices").all()

        score = 0
        details = []
        for question in questions:
            chosen_id = answers.get(str(question.id)) or answers.get(question.id)
            correct_choice = next((c for c in question.choices.all() if c.is_correct), None)
            is_correct = bool(chosen_id) and correct_choice and chosen_id == correct_choice.id
            if is_correct:
                score += 1
            details.append(
                {
                    "question_id": question.id,
                    "correct_choice_id": correct_choice.id if correct_choice else None,
                    "chosen_choice_id": chosen_id,
                    "is_correct": is_correct,
                }
            )

        attempt = QuizAttempt.objects.create(
            student=request.user,
            question_set=question_set,
            score=score,
            total=questions.count(),
        )
        QuizAttemptAnswer.objects.bulk_create(
            [
                QuizAttemptAnswer(
                    attempt=attempt,
                    question_id=detail["question_id"],
                    chosen_choice_id=detail["chosen_choice_id"],
                    is_correct=detail["is_correct"],
                )
                for detail in details
            ]
        )
        return Response(
            {
                "attempt": QuizAttemptSerializer(attempt).data,
                "details": details,
            },
            status=status.HTTP_201_CREATED,
        )


class QuestionViewSet(viewsets.ModelViewSet):
    """Manage individual questions inside a question set."""

    serializer_class = QuestionSerializer

    def get_permissions(self):
        return [IsStaffRole()]

    def get_queryset(self):
        qs = Question.objects.prefetch_related("choices")
        question_set_id = self.request.query_params.get("question_set")
        if question_set_id:
            qs = qs.filter(question_set_id=question_set_id)
        return qs

    def perform_create(self, serializer):
        question_set_id = self.request.data.get("question_set")
        if not question_set_id:
            raise ValidationError({"question_set": "Champ requis."})
        question_set = get_object_or_404(QuestionSet, pk=question_set_id)
        user = self.request.user
        if user.role == User.Roles.INSTRUCTOR and question_set.created_by_id != user.id:
            raise PermissionDenied("Vous ne pouvez ajouter de question qu'a vos propres series.")
        serializer.save(question_set=question_set)

    def perform_update(self, serializer):
        instance = self.get_object()
        user = self.request.user
        if user.role == User.Roles.INSTRUCTOR and instance.question_set.created_by_id != user.id:
            raise PermissionDenied("Action interdite.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role == User.Roles.INSTRUCTOR and instance.question_set.created_by_id != user.id:
            raise PermissionDenied("Action interdite.")
        instance.delete()


# ---------------------------------------------------------------------------
# Quiz attempts (history / stats / review)
# ---------------------------------------------------------------------------


class QuizAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = QuizAttemptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = QuizAttempt.objects.select_related("question_set", "student")
        if user.role == User.Roles.STUDENT:
            qs = qs.filter(student=user)
        else:
            student_id = self.request.query_params.get("student")
            if student_id:
                qs = qs.filter(student_id=student_id)
        return qs

    @action(detail=False, methods=["get"], url_path="wrong-questions")
    def wrong_questions(self, request):
        if request.user.role != User.Roles.STUDENT:
            raise PermissionDenied("Reserve aux etudiants.")
        wrong = (
            QuizAttemptAnswer.objects.filter(
                attempt__student=request.user, is_correct=False
            )
            .values_list("question_id", flat=True)
            .distinct()
        )
        questions = (
            Question.objects.filter(id__in=list(wrong))
            .select_related("question_set")
            .prefetch_related("choices")
        )
        groups: dict[int, dict] = {}
        for question in questions:
            qs_id = question.question_set_id
            if qs_id not in groups:
                groups[qs_id] = {
                    "question_set_id": qs_id,
                    "question_set_title": question.question_set.title,
                    "questions": [],
                }
            groups[qs_id]["questions"].append(
                {
                    "id": question.id,
                    "text": question.text,
                    "explanation": question.explanation,
                    "order": question.order,
                    "choices": [
                        {"id": c.id, "text": c.text} for c in question.choices.all()
                    ],
                    "correct_choice_id": next(
                        (c.id for c in question.choices.all() if c.is_correct), None
                    ),
                }
            )
        return Response(list(groups.values()))


# ---------------------------------------------------------------------------
# Exam (mock "code de la route" simulation)
# ---------------------------------------------------------------------------


class ExamStartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            count = int(request.query_params.get("count", 40))
        except (TypeError, ValueError):
            count = 40
        count = max(1, min(count, 100))

        questions = list(
            Question.objects.filter(question_set__is_published=True)
            .prefetch_related("choices")
            .order_by("?")[:count]
        )
        payload = [
            {
                "id": q.id,
                "text": q.text,
                "order": index + 1,
                "choices": [{"id": c.id, "text": c.text} for c in q.choices.all()],
            }
            for index, q in enumerate(questions)
        ]
        return Response({"questions": payload, "total": len(payload)})


class ExamSubmitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        answers = request.data.get("answers") or {}
        if not isinstance(answers, dict):
            raise ValidationError({"answers": "Doit etre un objet {question_id: choice_id}."})

        question_ids = []
        for raw_id in answers.keys():
            try:
                question_ids.append(int(raw_id))
            except (TypeError, ValueError):
                continue

        questions = Question.objects.filter(id__in=question_ids).prefetch_related("choices")
        score = 0
        details = []
        for question in questions:
            chosen_raw = answers.get(str(question.id)) or answers.get(question.id)
            try:
                chosen_id = int(chosen_raw) if chosen_raw is not None else None
            except (TypeError, ValueError):
                chosen_id = None
            correct_choice = next((c for c in question.choices.all() if c.is_correct), None)
            is_correct = bool(
                chosen_id and correct_choice and chosen_id == correct_choice.id
            )
            if is_correct:
                score += 1
            details.append(
                {
                    "question_id": question.id,
                    "chosen_choice_id": chosen_id,
                    "correct_choice_id": correct_choice.id if correct_choice else None,
                    "is_correct": is_correct,
                }
            )

        total = len(details)
        pass_threshold = 35 if total >= 40 else max(1, int(total * 0.875))
        return Response(
            {
                "score": score,
                "total": total,
                "passed": score >= pass_threshold,
                "pass_threshold": pass_threshold,
                "details": details,
            }
        )
