"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  student_profile?: { remaining_minutes: number } | null;
}

export interface AppointmentInitial {
  id?: number;
  student?: number | null;
  instructor?: number | null;
  start_at?: string;
  end_at?: string;
  location?: string;
}

function toDatetimeLocal(value: string | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

export function AppointmentForm({
  initial,
  onSaved,
  onCancel,
  showDelete,
}: {
  initial: AppointmentInitial;
  onSaved: () => void;
  onCancel?: () => void;
  showDelete?: boolean;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [form, setForm] = useState({
    student: initial.student ? String(initial.student) : "",
    instructor: initial.instructor
      ? String(initial.instructor)
      : user?.role === "instructor"
        ? String(user.id)
        : "",
    start_at: toDatetimeLocal(initial.start_at),
    end_at: toDatetimeLocal(initial.end_at),
    location: initial.location || "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<User[]>("/api/users/?role=student").then(setStudents).catch(() => {});
    if (user?.role !== "instructor") {
      api<User[]>("/api/users/?role=instructor").then(setInstructors).catch(() => {});
    } else {
      setInstructors([
        { id: user.id, username: user.username, first_name: user.first_name, last_name: user.last_name, role: "instructor" },
      ]);
    }
  }, [user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        student: Number(form.student),
        instructor: Number(form.instructor),
        start_at: new Date(form.start_at).toISOString(),
        end_at: new Date(form.end_at).toISOString(),
        location: form.location,
      };
      if (initial.id) {
        await api(`/api/appointments/${initial.id}/`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/api/appointments/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onSaved();
    } catch (err: any) {
      setError(err?.message || "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!initial.id) return;
    if (!confirm("Supprimer ce rendez-vous ?")) return;
    await api(`/api/appointments/${initial.id}/`, { method: "DELETE" });
    router.push("/planning");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Etudiant</Label>
          <Select required value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })}>
            <option value="">-- choisir --</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.first_name} {s.last_name} ({s.username})
                {s.student_profile ? ` - ${s.student_profile.remaining_minutes} min restantes` : ""}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Instructeur</Label>
          <Select
            required
            value={form.instructor}
            disabled={user?.role === "instructor"}
            onChange={(e) => setForm({ ...form, instructor: e.target.value })}
          >
            <option value="">-- choisir --</option>
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.first_name} {i.last_name} ({i.username})
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Debut</Label>
          <Input
            type="datetime-local"
            required
            value={form.start_at}
            onChange={(e) => setForm({ ...form, start_at: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Fin</Label>
          <Input
            type="datetime-local"
            required
            value={form.end_at}
            onChange={(e) => setForm({ ...form, end_at: e.target.value })}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Lieu</Label>
          <Input
            required
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive whitespace-pre-line">{error}</p>}
      <div className="flex justify-between">
        <div>
          {showDelete && initial.id && (
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          )}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Enregistrement..." : initial.id ? "Mettre a jour" : "Creer"}
          </Button>
        </div>
      </div>
    </form>
  );
}
