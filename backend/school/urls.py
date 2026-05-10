from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AppointmentViewSet,
    HomeView,
    LessonPackViewSet,
    MeView,
    QuestionSetViewSet,
    QuestionViewSet,
    UserViewSet,
)

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="users")
router.register(r"appointments", AppointmentViewSet, basename="appointments")
router.register(r"lesson-packs", LessonPackViewSet, basename="lesson-packs")
router.register(r"question-sets", QuestionSetViewSet, basename="question-sets")
router.register(r"questions", QuestionViewSet, basename="questions")

api_urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]

urlpatterns = [
    path("", HomeView.as_view(), name="home"),
    path("api/", include((api_urlpatterns, "api"))),
]
