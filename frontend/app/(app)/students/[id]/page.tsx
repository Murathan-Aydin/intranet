"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatMinutes } from "@/lib/utils";

interface UserData {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  student_profile?: {
    purchased_minutes: number;
    consumed_minutes: number;
    remaining_minutes: number;
    phone: string;
    address: string;
    birth_date: string | null;
    notes: string;
  } | null;
}

interface Appointment {
  id: number;
  start_at: string;
  end_at: string;
  duration_minutes: number;
  location: string;
  instructor_full_name: string;
}

interface QuizAttempt {
  id: number;
  question_set: number;
  question_set_title: string;
  score: number;
  total: number;
  submitted_at: string;
}

function pct(score: number, total: number): number {
  if (!total) return 0;
  return Math.round((score / total) * 100);
}

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const [student, setStudent] = useState<UserData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

  useEffect(() => {
    api<UserData>(`/api/users/${params.id}/`).then(setStudent).catch(() => setStudent(null));
    api<Appointment[]>(`/api/appointments/?student=${params.id}`)
      .then(setAppointments)
      .catch(() => {});
    api<QuizAttempt[]>(`/api/quiz-attempts/?student=${params.id}`)
      .then(setAttempts)
      .catch(() => setAttempts([]));
  }, [params.id]);

  if (!student || !me) return <p className="text-muted-foreground">Chargement...</p>;

  const profile = student.student_profile;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {student.first_name} {student.last_name}{" "}
            <span className="text-muted-foreground">@{student.username}</span>
          </h1>
          <p className="text-muted-foreground">{student.email}</p>
        </div>
        {(me.role === "secretary" || me.role === "admin" || me.role === "instructor") && (
          <Link href={`/appointments/new?student=${student.id}`}>
            <Button>Nouveau rendez-vous</Button>
          </Link>
        )}
      </div>

      {profile && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Heures achetees</CardDescription>
              <CardTitle>{formatMinutes(profile.purchased_minutes)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Heures consommees</CardDescription>
              <CardTitle>{formatMinutes(profile.consumed_minutes)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Heures restantes</CardDescription>
              <CardTitle>{formatMinutes(profile.remaining_minutes)}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>Fiche</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Telephone</span>
              <div>{profile.phone || "-"}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Date de naissance</span>
              <div>{profile.birth_date || "-"}</div>
            </div>
            <div className="md:col-span-2">
              <span className="text-muted-foreground">Adresse</span>
              <div>{profile.address || "-"}</div>
            </div>
            <div className="md:col-span-2">
              <span className="text-muted-foreground">Notes</span>
              <div className="whitespace-pre-line">{profile.notes || "-"}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Stats Code de la route</CardTitle>
          <CardDescription>
            {attempts.length} tentative{attempts.length > 1 ? "s" : ""}
            {attempts.length > 0 && (
              <>
                {" - moyenne "}
                {Math.round(
                  attempts.reduce((acc, a) => acc + pct(a.score, a.total), 0) /
                    attempts.length,
                )}
                {"%"}
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Date</TH>
                <TH>Serie</TH>
                <TH>Score</TH>
                <TH>%</TH>
              </TR>
            </THead>
            <TBody>
              {attempts.length === 0 && (
                <TR>
                  <TD colSpan={4} className="py-6 text-center text-muted-foreground">
                    Aucune tentative.
                  </TD>
                </TR>
              )}
              {[...attempts]
                .sort(
                  (a, b) =>
                    new Date(b.submitted_at).getTime() -
                    new Date(a.submitted_at).getTime(),
                )
                .slice(0, 20)
                .map((a) => {
                  const p = pct(a.score, a.total);
                  return (
                    <TR key={a.id}>
                      <TD>{formatDateTime(a.submitted_at)}</TD>
                      <TD>{a.question_set_title}</TD>
                      <TD>
                        {a.score} / {a.total}
                      </TD>
                      <TD>
                        <Badge variant={p >= 80 ? "success" : p >= 50 ? "default" : "warning"}>
                          {p}%
                        </Badge>
                      </TD>
                    </TR>
                  );
                })}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planning</CardTitle>
          <CardDescription>{appointments.length} rendez-vous</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Date</TH>
                <TH>Instructeur</TH>
                <TH>Lieu</TH>
                <TH>Duree</TH>
                <TH>Statut</TH>
              </TR>
            </THead>
            <TBody>
              {appointments.length === 0 && (
                <TR>
                  <TD colSpan={5} className="py-6 text-center text-muted-foreground">
                    Aucun rendez-vous.
                  </TD>
                </TR>
              )}
              {appointments.map((a) => (
                <TR key={a.id}>
                  <TD>{formatDateTime(a.start_at)}</TD>
                  <TD>{a.instructor_full_name}</TD>
                  <TD>{a.location}</TD>
                  <TD>{formatMinutes(a.duration_minutes)}</TD>
                  <TD>
                    <Badge variant={new Date(a.end_at) >= new Date() ? "default" : "outline"}>
                      {new Date(a.end_at) >= new Date() ? "A venir" : "Termine"}
                    </Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
