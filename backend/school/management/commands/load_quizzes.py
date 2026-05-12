"""Import question sets / questions / choices from a JSON dump.

Usage:
    python manage.py load_quizzes
    python manage.py load_quizzes --file school/fixtures/quizzes_seed.json
"""

import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from school.models import Choice, Question, QuestionSet, User


DEFAULT_PATH = Path(settings.BASE_DIR) / "school" / "fixtures" / "quizzes_seed.json"


class Command(BaseCommand):
    help = "Import quiz question sets from a JSON dump (remaps created_by FK)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            default=str(DEFAULT_PATH),
            help="Path to the JSON dump (default: school/fixtures/quizzes_seed.json)",
        )
        parser.add_argument(
            "--owner",
            default=None,
            help="Username to assign as created_by (default: first admin/instructor/secretary).",
        )
        parser.add_argument(
            "--wipe",
            action="store_true",
            help="Delete existing QuestionSet/Question/Choice before importing.",
        )

    def handle(self, *args, **opts):
        path = Path(opts["file"])
        if not path.is_absolute():
            path = Path(settings.BASE_DIR) / path
        if not path.exists():
            raise CommandError(f"File not found: {path}")

        if opts["owner"]:
            try:
                owner = User.objects.get(username=opts["owner"])
            except User.DoesNotExist as exc:
                raise CommandError(f"User '{opts['owner']}' not found") from exc
        else:
            owner = User.objects.filter(
                role__in=[
                    User.Roles.ADMIN,
                    User.Roles.INSTRUCTOR,
                    User.Roles.SECRETARY,
                ]
            ).first()
            if not owner:
                raise CommandError(
                    "No admin/instructor/secretary user found. Pass --owner USERNAME."
                )

        self.stdout.write(f"Using owner: {owner.username} ({owner.role})")

        with path.open() as fh:
            data = json.load(fh)

        with transaction.atomic():
            if opts["wipe"]:
                Choice.objects.all().delete()
                Question.objects.all().delete()
                QuestionSet.objects.all().delete()
                self.stdout.write(self.style.WARNING("Wiped existing quiz data."))

            qs_map = {}
            for entry in data:
                if entry["model"] != "school.questionset":
                    continue
                f = entry["fields"]
                qs, created = QuestionSet.objects.update_or_create(
                    title=f["title"],
                    defaults={
                        "description": f.get("description", ""),
                        "is_published": f.get("is_published", True),
                        "created_by": owner,
                    },
                )
                qs_map[entry["pk"]] = qs.id

            q_map = {}
            for entry in data:
                if entry["model"] != "school.question":
                    continue
                f = entry["fields"]
                new_qs_id = qs_map.get(f["question_set"])
                if not new_qs_id:
                    continue
                q = Question.objects.create(
                    question_set_id=new_qs_id,
                    text=f["text"],
                )
                q_map[entry["pk"]] = q.id

            for entry in data:
                if entry["model"] != "school.choice":
                    continue
                f = entry["fields"]
                new_q_id = q_map.get(f["question"])
                if not new_q_id:
                    continue
                Choice.objects.create(
                    question_id=new_q_id,
                    text=f["text"],
                    is_correct=f["is_correct"],
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. QuestionSets={QuestionSet.objects.count()} "
                f"Questions={Question.objects.count()} "
                f"Choices={Choice.objects.count()}"
            )
        )
