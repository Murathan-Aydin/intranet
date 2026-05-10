import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import school.models


class Migration(migrations.Migration):

    dependencies = [
        ("school", "0005_quizattemptanswer"),
    ]

    operations = [
        migrations.CreateModel(
            name="StudentInvitation",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("email", models.EmailField(max_length=254)),
                ("first_name", models.CharField(blank=True, max_length=150)),
                ("last_name", models.CharField(blank=True, max_length=150)),
                (
                    "token",
                    models.CharField(
                        default=school.models._default_invitation_token,
                        editable=False,
                        max_length=64,
                        unique=True,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "expires_at",
                    models.DateTimeField(
                        default=school.models._default_invitation_expiry
                    ),
                ),
                ("accepted_at", models.DateTimeField(blank=True, null=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="sent_invitations",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "accepted_user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="accepted_invitation",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
