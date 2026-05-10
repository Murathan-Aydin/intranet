"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface QuestionSet {
  id: number;
  title: string;
  description: string;
  is_published: boolean;
  questions_count: number;
}

export default function ManageQuizPage() {
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [form, setForm] = useState({ title: "", description: "" });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setSets(await api<QuestionSet[]>("/api/question-sets/"));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api("/api/question-sets/", {
        method: "POST",
        body: JSON.stringify({ ...form, is_published: true }),
      });
      setForm({ title: "", description: "" });
      load();
    } catch (err: any) {
      setError(err?.message || "Erreur");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer cette serie ?")) return;
    await api(`/api/question-sets/${id}/`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion des series de questions</h1>
        <p className="text-muted-foreground">Creez et editez les series de questions pour les eleves.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle serie</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit">Creer</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {sets.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {s.title}
                {!s.is_published && <Badge variant="warning">Brouillon</Badge>}
              </CardTitle>
              <CardDescription>{s.questions_count} questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{s.description}</p>
              <div className="flex gap-2">
                <Link href={`/quiz/manage/${s.id}`}>
                  <Button size="sm" variant="outline">Editer</Button>
                </Link>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(s.id)}>
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
