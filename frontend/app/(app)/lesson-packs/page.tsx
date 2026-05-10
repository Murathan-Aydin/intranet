"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatMinutes } from "@/lib/utils";

interface Student {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  student_profile?: { remaining_minutes: number; purchased_minutes: number };
}

interface LessonPack {
  id: number;
  student: number;
  student_username: string;
  minutes: number;
  price_cents: number;
  source: string;
  created_at: string;
  payment_reference: string;
  created_by_username: string | null;
}

export default function LessonPacksPage() {
  const [packs, setPacks] = useState<LessonPack[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState({ student: "", minutes: "60", price_cents: "6000" });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [p, s] = await Promise.all([
      api<LessonPack[]>("/api/lesson-packs/"),
      api<Student[]>("/api/users/?role=student"),
    ]);
    setPacks(p);
    setStudents(s);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api("/api/lesson-packs/", {
        method: "POST",
        body: JSON.stringify({
          student: Number(form.student),
          minutes: Number(form.minutes),
          price_cents: Number(form.price_cents),
          source: "secretary",
        }),
      });
      setForm({ student: "", minutes: "60", price_cents: "6000" });
      load();
    } catch (err: any) {
      setError(err?.message || "Erreur");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Forfaits d'heures</h1>
        <p className="text-muted-foreground">
          Ajoutez des heures a un eleve apres un paiement physique ou consultez l'historique des achats en ligne.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter un forfait</CardTitle>
          <CardDescription>Cree un nouveau forfait pour l'etudiant choisi.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-4 md:items-end">
            <div className="space-y-2 md:col-span-2">
              <Label>Etudiant</Label>
              <Select value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })} required>
                <option value="">-- choisir --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} ({s.username})
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Minutes</Label>
              <Input
                type="number"
                min={30}
                step={30}
                value={form.minutes}
                onChange={(e) => setForm({ ...form, minutes: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Prix (centimes)</Label>
              <Input
                type="number"
                min={0}
                value={form.price_cents}
                onChange={(e) => setForm({ ...form, price_cents: e.target.value })}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive md:col-span-4">{error}</p>}
            <div className="md:col-span-4">
              <Button type="submit">Ajouter</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Date</TH>
                <TH>Etudiant</TH>
                <TH>Minutes</TH>
                <TH>Prix</TH>
                <TH>Source</TH>
                <TH>Reference</TH>
                <TH>Cree par</TH>
              </TR>
            </THead>
            <TBody>
              {packs.length === 0 && (
                <TR>
                  <TD colSpan={7} className="py-6 text-center text-muted-foreground">
                    Aucun forfait.
                  </TD>
                </TR>
              )}
              {packs.map((p) => (
                <TR key={p.id}>
                  <TD>{formatDateTime(p.created_at)}</TD>
                  <TD>{p.student_username}</TD>
                  <TD>{formatMinutes(p.minutes)}</TD>
                  <TD>{(p.price_cents / 100).toFixed(2)} EUR</TD>
                  <TD>
                    <Badge variant={p.source === "online" ? "success" : "secondary"}>
                      {p.source === "online" ? "En ligne" : "Secretaire"}
                    </Badge>
                  </TD>
                  <TD>{p.payment_reference || "-"}</TD>
                  <TD>{p.created_by_username || "-"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
