"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Timer } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const EXAM_DURATION_SECONDS = 30 * 60;
const EXAM_QUESTION_COUNT = 40;

interface ExamChoice {
  id: number;
  text: string;
}

interface ExamQuestion {
  id: number;
  text: string;
  order: number;
  choices: ExamChoice[];
}

interface ExamStartResponse {
  questions: ExamQuestion[];
  total: number;
}

interface ExamDetail {
  question_id: number;
  chosen_choice_id: number | null;
  correct_choice_id: number | null;
  is_correct: boolean;
}

interface ExamResult {
  score: number;
  total: number;
  passed: boolean;
  pass_threshold: number;
  details: ExamDetail[];
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ExamPage() {
  const [questions, setQuestions] = useState<ExamQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [remaining, setRemaining] = useState(EXAM_DURATION_SECONDS);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(false);
  const submittedRef = useRef(false);

  const answersRef = useRef<Record<number, number>>({});
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const submit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const res = await api<ExamResult>("/api/exam/submit/", {
        method: "POST",
        body: JSON.stringify({ answers: answersRef.current }),
      });
      setResult(res);
    } catch {
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  async function startExam() {
    setStarted(true);
    setRemaining(EXAM_DURATION_SECONDS);
    submittedRef.current = false;
    try {
      const res = await api<ExamStartResponse>(
        `/api/exam/start/?count=${EXAM_QUESTION_COUNT}`,
      );
      setQuestions(res.questions);
    } catch {
      setQuestions([]);
    }
  }

  useEffect(() => {
    if (!started || result || !questions || questions.length === 0) return;
    const interval = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          submit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [started, result, questions, submit]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submit();
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Examen blanc</h1>
          <p className="text-muted-foreground">Simulation de l&apos;examen du code de la route.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Conditions de l&apos;examen</CardTitle>
            <CardDescription>Lisez avant de commencer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>- {EXAM_QUESTION_COUNT} questions tirees au hasard parmi toutes les series publiees.</p>
            <p>- Duree limitee a 30 minutes (timer visible en haut).</p>
            <p>- Seuil de reussite : 35 / 40.</p>
            <p>- Le formulaire est soumis automatiquement a la fin du temps.</p>
            <div className="flex gap-2 pt-2">
              <Button onClick={startExam}>Commencer l&apos;examen</Button>
              <Link href="/quiz">
                <Button variant="outline">Annuler</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!questions) {
    return <p className="text-muted-foreground">Preparation de l&apos;examen...</p>;
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pas assez de questions</CardTitle>
          <CardDescription>
            Aucune serie publiee n&apos;est disponible pour generer un examen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/quiz">
            <Button variant="outline">Retour</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (result) {
    const passedClass = result.passed ? "bg-emerald-500" : "bg-destructive";
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resultat de l&apos;examen</CardTitle>
            <CardDescription>
              Score : {result.score} / {result.total} (seuil : {result.pass_threshold})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white ${passedClass}`}
              >
                {result.passed ? "Reussi" : "Echec"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {result.details.filter((d) => !d.is_correct).length} reponse(s) incorrecte(s).
              Consultez le mode revision pour les retravailler.
            </p>
            <div className="flex gap-2">
              <Link href="/quiz">
                <Button>Retour au quiz</Button>
              </Link>
              <Link href="/quiz/review">
                <Button variant="outline">Mode revision</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const lowTime = remaining <= 60;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <div className="sticky top-0 z-10 -mx-4 border-b bg-white/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Examen blanc</h1>
            <p className="text-xs text-muted-foreground">
              {answeredCount} / {questions.length} question{questions.length > 1 ? "s" : ""} repondue{answeredCount > 1 ? "s" : ""}
            </p>
          </div>
          <Badge variant={lowTime ? "danger" : "default"} className="flex items-center gap-1 px-3 py-1 text-base">
            <Timer className="h-4 w-4" />
            {formatTime(remaining)}
          </Badge>
        </div>
      </div>

      {questions.map((q, i) => (
        <Card key={q.id}>
          <CardHeader>
            <CardTitle className="text-base">
              Question {i + 1} - {q.text}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {q.choices.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-2 rounded-md border p-2 hover:bg-muted/40"
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
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
          {submitting ? "Envoi..." : "Soumettre l'examen"}
        </Button>
      </div>
    </form>
  );
}
