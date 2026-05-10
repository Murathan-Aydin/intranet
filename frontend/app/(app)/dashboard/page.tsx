"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, formatDateTime, formatMinutes } from "@/lib/utils";

interface Appointment {
  id: number;
  start_at: string;
  end_at: string;
  location: string;
  duration_minutes: number;
  student_full_name: string;
  instructor_full_name: string;
}

interface User {
  id: number;
  username: string;
  role: string;
  first_name: string;
  last_name: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    api<Appointment[]>("/api/appointments/").then(setAppointments).catch(() => {});
    if (user && (user.role === "secretary" || user.role === "admin")) {
      api<User[]>("/api/users/").then(setUsers).catch(() => {});
    }
  }, [user]);

  if (!user) return null;

  const upcoming = appointments
    .filter((a) => new Date(a.end_at) >= new Date())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Bonjour {user.first_name || user.username} <span className="text-muted-foreground">|</span>{" "}
          <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
        </h1>
        <p className="text-muted-foreground">
          Voici un apercu de votre activite sur l'intranet.
        </p>
      </div>

      {user.role === "student" && user.student_profile && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Heures achetees</CardDescription>
              <CardTitle className="text-2xl">
                {formatMinutes(user.student_profile.purchased_minutes)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Heures consommees</CardDescription>
              <CardTitle className="text-2xl">
                {formatMinutes(user.student_profile.consumed_minutes)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Heures restantes</CardDescription>
              <CardTitle className="text-2xl">
                {formatMinutes(user.student_profile.remaining_minutes)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/buy-hours">
                <Button size="sm">Acheter plus d'heures</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {(user.role === "secretary" || user.role === "admin") && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Etudiants inscrits</CardDescription>
              <CardTitle className="text-2xl">
                {users.filter((u) => u.role === "student").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Instructeurs</CardDescription>
              <CardTitle className="text-2xl">
                {users.filter((u) => u.role === "instructor").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Rendez-vous au planning</CardDescription>
              <CardTitle className="text-2xl">{appointments.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Prochains rendez-vous</CardTitle>
          <CardDescription>
            {upcoming.length === 0
              ? "Aucun rendez-vous a venir."
              : `${upcoming.length} prochain(s) rendez-vous`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {upcoming.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{formatDateTime(a.start_at)}</div>
                  <div className="text-sm text-muted-foreground">
                    {a.student_full_name} avec {a.instructor_full_name} - {a.location}
                  </div>
                </div>
                <Badge variant="outline">{formatMinutes(a.duration_minutes)}</Badge>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Link href="/planning">
              <Button variant="outline" size="sm">Voir le planning complet</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
