from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AppointmentViewSet,
    ExamStartView,
    ExamSubmitView,
    HomeView,
    InvitationAcceptView,
    InvitationDetailView,
    LessonPackViewSet,
    MeView,
    QuestionSetViewSet,
    QuestionViewSet,
    QuizAttemptViewSet,
    StudentInvitationViewSet,
    UserViewSet,
)

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="users")
router.register(r"appointments", AppointmentViewSet, basename="appointments")
router.register(r"lesson-packs", LessonPackViewSet, basename="lesson-packs")
router.register(r"question-sets", QuestionSetViewSet, basename="question-sets")
router.register(r"questions", QuestionViewSet, basename="questions")
router.register(r"quiz-attempts", QuizAttemptViewSet, basename="quiz-attempts")
router.register(r"invitations", StudentInvitationViewSet, basename="invitations")

api_urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
    path("exam/start/", ExamStartView.as_view(), name="exam-start"),
    path("exam/submit/", ExamSubmitView.as_view(), name="exam-submit"),
    path(
        "invitations/token/<str:token>/",
        InvitationDetailView.as_view(),
        name="invitation-detail",
    ),
    path(
        "invitations/token/<str:token>/accept/",
        InvitationAcceptView.as_view(),
        name="invitation-accept",
    ),
    path("", include(router.urls)),
]

urlpatterns = [
    path("", HomeView.as_view(), name="home"),
    path("api/", include((api_urlpatterns, "api"))),
]
