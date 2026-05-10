"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Choice {
  id: number;
  text: string;
}
interface Question {
  id: number;
  text: string;
  choices: Choice[];
}
interface QuestionSet {
  id: number;
  title: string;
  description: string;
  questions: Question[];
}

interface SubmitResult {
  attempt: { score: number; total: number };
  details: {
    question_id: number;
    correct_choice_id: number | null;
    chosen_choice_id: number | null;
    is_correct: boolean;
  }[];
}

export default function QuizPlayPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [set, setSet] = useState<QuestionSet | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<QuestionSet>(`/api/question-sets/${params.id}/play/`)
      .then(setSet)
      .catch(() => setSet(null));
  }, [params.id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!set) return;
    setSubmitting(true);
    try {
      const res = await api<SubmitResult>(`/api/question-sets/${set.id}/submit/`, {
        method: "POST",
        body: JSON.stringify({ answers }),
      });
      setResult(res);
    } finally {
      setSubmitting(false);
    }
  }

  if (!set) return <p className="text-muted-foreground">Chargement...</p>;

  if (result) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resultats - {set.title}</CardTitle>
            <CardDescription>
              Score : {result.attempt.score} / {result.attempt.total}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {set.questions.map((q) => {
              const detail = result.details.find((d) => d.question_id === q.id);
              const chosen = q.choices.find((c) => c.id === detail?.chosen_choice_id);
              const correct = q.choices.find((c) => c.id === detail?.correct_choice_id);
              return (
                <div key={q.id} className="rounded-md border p-3">
                  <p className="font-medium">{q.text}</p>
                  <p className={detail?.is_correct ? "text-emerald-600" : "text-destructive"}>
                    Votre reponse : {chosen?.text || "non repondu"}
                  </p>
                  {!detail?.is_correct && correct && (
                    <p className="text-sm text-muted-foreground">Bonne reponse : {correct.text}</p>
                  )}
                </div>
              );
            })}
            <div className="flex justify-end gap-2">
              <Button onClick={() => router.push("/quiz")}>Retour</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{set.title}</h1>
        <p className="text-muted-foreground">{set.description}</p>
      </div>
      {set.questions.map((q, i) => (
        <Card key={q.id}>
          <CardHeader>
            <CardTitle className="text-base">
              Question {i + 1} - {q.text}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {q.choices.map((c) => (
              <label key={c.id} className="flex items-center gap-2 rounded-md border p-2 hover:bg-muted/40">
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  required
                  checked={answers[q.id] === c.id}
                  onChange={() => setAnswers({ ...answers, [q.id]: c.id })}
                />
                <span>{c.text}</span>
              </label>
            ))}
          </CardContent>
        </Card>
      ))}
      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Envoi..." : "Soumettre"}
        </Button>
      </div>
    </form>
  );
}
