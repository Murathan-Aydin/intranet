"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Choice { id?: number; text: string; is_correct: boolean }
interface Question { id?: number; text: string; explanation: string; order: number; choices: Choice[] }
interface QuestionSet {
  id: number;
  title: string;
  description: string;
  is_published: boolean;
  questions: Question[];
}

const EMPTY_Q: Question = { text: "", explanation: "", order: 0, choices: [
  { text: "", is_correct: true },
  { text: "", is_correct: false },
  { text: "", is_correct: false },
]};

export default function EditQuestionSetPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [set, setSet] = useState<QuestionSet | null>(null);
  const [newQ, setNewQ] = useState<Question>(structuredClone(EMPTY_Q));
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const s = await api<QuestionSet>(`/api/question-sets/${params.id}/`);
    setSet(s);
  }

  useEffect(() => {
    load();
  }, [params.id]);

  async function saveSet(e: FormEvent) {
    e.preventDefault();
    if (!set) return;
    await api(`/api/question-sets/${set.id}/`, {
      method: "PATCH",
      body: JSON.stringify({
        title: set.title,
        description: set.description,
        is_published: set.is_published,
      }),
    });
    load();
  }

  async function addQuestion(e: FormEvent) {
    e.preventDefault();
    if (!set) return;
    setError(null);
    if (!newQ.choices.some((c) => c.is_correct)) {
      setError("Veuillez marquer la bonne reponse.");
      return;
    }
    try {
      await api("/api/questions/", {
        method: "POST",
        body: JSON.stringify({
          ...newQ,
          question_set: set.id,
        }),
      });
      setNewQ(structuredClone(EMPTY_Q));
      load();
    } catch (err: any) {
      setError(err?.message || "Erreur");
    }
  }

  async function deleteQuestion(id?: number) {
    if (!id) return;
    if (!confirm("Supprimer cette question ?")) return;
    await api(`/api/questions/${id}/`, { method: "DELETE" });
    load();
  }

  if (!set) return <p className="text-muted-foreground">Chargement...</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="outline" size="sm" onClick={() => router.push("/quiz/manage")}>
        Retour
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Serie</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveSet} className="space-y-3">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input value={set.title} onChange={(e) => setSet({ ...set, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={set.description}
                onChange={(e) => setSet({ ...set, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="is_published"
                type="checkbox"
                checked={set.is_published}
                onChange={(e) => setSet({ ...set, is_published: e.target.checked })}
              />
              <Label htmlFor="is_published">Visible par les etudiants</Label>
            </div>
            <Button type="submit">Enregistrer</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Questions ({set.questions.length})</CardTitle>
          <CardDescription>Liste des questions de cette serie.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {set.questions.map((q, i) => (
            <div key={q.id} className="rounded-md border p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{i + 1}. {q.text}</p>
                  <ul className="mt-1 list-disc pl-5 text-sm">
                    {q.choices.map((c, idx) => (
                      <li key={idx} className={c.is_correct ? "text-emerald-700" : ""}>
                        {c.text} {c.is_correct && "(bonne reponse)"}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button size="sm" variant="destructive" onClick={() => deleteQuestion(q.id)}>
                  Supprimer
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter une question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addQuestion} className="space-y-3">
            <div className="space-y-2">
              <Label>Question</Label>
              <Textarea
                value={newQ.text}
                onChange={(e) => setNewQ({ ...newQ, text: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Explication (optionnel)</Label>
              <Input
                value={newQ.explanation}
                onChange={(e) => setNewQ({ ...newQ, explanation: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Choix</Label>
              {newQ.choices.map((c, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct"
                    checked={c.is_correct}
                    onChange={() => {
                      const choices = newQ.choices.map((x, i) => ({ ...x, is_correct: i === idx }));
                      setNewQ({ ...newQ, choices });
                    }}
                  />
                  <Input
                    value={c.text}
                    onChange={(e) => {
                      const choices = [...newQ.choices];
                      choices[idx] = { ...c, text: e.target.value };
                      setNewQ({ ...newQ, choices });
                    }}
                    required
                  />
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setNewQ({ ...newQ, choices: [...newQ.choices, { text: "", is_correct: false }] })}
              >
                Ajouter un choix
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit">Ajouter la question</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
