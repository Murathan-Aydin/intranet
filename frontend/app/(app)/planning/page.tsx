"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatMinutes } from "@/lib/utils";
import { Calendar } from "@/components/calendar";

type ViewMode = "calendar" | "list";

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface Appointment {
  id: number;
  student: number;
  instructor: number;
  start_at: string;
  end_at: string;
  location: string;
  duration_minutes: number;
  student_full_name: string;
  instructor_full_name: string;
}

export default function PlanningPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filterStudent, setFilterStudent] = useState<string>("");
  const [filterInstructor, setFilterInstructor] = useState<string>("");
  const [view, setView] = useState<ViewMode>("calendar");

  const isStaff = user && (user.role === "secretary" || user.role === "admin");

  useEffect(() => {
    if (isStaff) api<User[]>("/api/users/").then(setUsers).catch(() => {});
  }, [isStaff]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterStudent) params.set("student", filterStudent);
    if (filterInstructor) params.set("instructor", filterInstructor);
    const qs = params.toString();
    api<Appointment[]>(`/api/appointments/${qs ? `?${qs}` : ""}`)
      .then(setAppointments)
      .catch(() => {});
  }, [filterStudent, filterInstructor]);

  if (!user) return null;
  const canEdit = user.role !== "student";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planning</h1>
          <p className="text-muted-foreground">
            {user.role === "student"
              ? "Vos rendez-vous a venir et passes."
              : user.role === "instructor"
                ? "Vos rendez-vous avec vos eleves."
                : "Planning general de l'auto-ecole."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border p-0.5">
            <Button
              size="sm"
              variant={view === "calendar" ? "default" : "ghost"}
              onClick={() => setView("calendar")}
            >
              Calendrier
            </Button>
            <Button
              size="sm"
              variant={view === "list" ? "default" : "ghost"}
              onClick={() => setView("list")}
            >
              Liste
            </Button>
          </div>
          {canEdit && (
            <Link href="/appointments/new">
              <Button>Nouveau rendez-vous</Button>
            </Link>
          )}
        </div>
      </div>

      {isStaff && (
        <Card>
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
            <CardDescription>Filtrer par etudiant ou instructeur.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 md:flex-row">
              <Select value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)}>
                <option value="">Tous les etudiants</option>
                {users
                  .filter((u) => u.role === "student")
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} ({u.username})
                    </option>
                  ))}
              </Select>
              <Select value={filterInstructor} onChange={(e) => setFilterInstructor(e.target.value)}>
                <option value="">Tous les instructeurs</option>
                {users
                  .filter((u) => u.role === "instructor")
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} ({u.username})
                    </option>
                  ))}
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {view === "calendar" && (
        <Calendar
          appointments={appointments}
          canEdit={canEdit}
          onSelectAppointment={(id) => router.push(`/appointments/${id}`)}
        />
      )}

      {view === "list" && (
      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Date</TH>
                <TH>Etudiant</TH>
                <TH>Instructeur</TH>
                <TH>Lieu</TH>
                <TH>Duree</TH>
                {canEdit && <TH></TH>}
              </TR>
            </THead>
            <TBody>
              {appointments.length === 0 && (
                <TR>
                  <TD colSpan={canEdit ? 6 : 5} className="py-6 text-center text-muted-foreground">
                    Aucun rendez-vous.
                  </TD>
                </TR>
              )}
              {appointments.map((a) => {
                const upcoming = new Date(a.end_at) >= new Date();
                return (
                  <TR key={a.id}>
                    <TD>
                      <div className="font-medium">{formatDateTime(a.start_at)}</div>
                      <Badge variant={upcoming ? "default" : "outline"} className="mt-1">
                        {upcoming ? "A venir" : "Termine"}
                      </Badge>
                    </TD>
                    <TD>{a.student_full_name}</TD>
                    <TD>{a.instructor_full_name}</TD>
                    <TD>{a.location}</TD>
                    <TD>{formatMinutes(a.duration_minutes)}</TD>
                    {canEdit && (
                      <TD>
                        <Link href={`/appointments/${a.id}`}>
                          <Button size="sm" variant="outline">Editer</Button>
                        </Link>
                      </TD>
                    )}
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
