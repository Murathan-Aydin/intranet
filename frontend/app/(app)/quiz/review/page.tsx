"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ReviewChoice {
  id: number;
  text: string;
}

interface ReviewQuestion {
  id: number;
  text: string;
  explanation: string;
  order: number;
  choices: ReviewChoice[];
  correct_choice_id: number | null;
}

interface ReviewGroup {
  question_set_id: number;
  question_set_title: string;
  questions: ReviewQuestion[];
}

export default function QuizReviewPage() {
  const [groups, setGroups] = useState<ReviewGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    api<ReviewGroup[]>("/api/quiz-attempts/wrong-questions/")
      .then(setGroups)
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  function selectAnswer(questionId: number, choiceId: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
    setRevealed((prev) => ({ ...prev, [questionId]: true }));
  }

  const totalQuestions = groups.reduce((acc, g) => acc + g.questions.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mode revision</h1>
          <p className="text-muted-foreground">
            Refaites les questions ratees lors de vos tentatives passees.
          </p>
        </div>
        <Link href="/quiz">
          <Button variant="outline">Retour</Button>
        </Link>
      </div>

      {loading && <p className="text-muted-foreground">Chargement...</p>}

      {!loading && totalQuestions === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aucune question a reviser</CardTitle>
            <CardDescription>
              Vous n&apos;avez pas encore rate de question, ou vous n&apos;avez pas encore fait de
              tentative.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {groups.map((group) => (
        <Card key={group.question_set_id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{group.question_set_title}</CardTitle>
              <Badge variant="outline">
                {group.questions.length} a revoir
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.questions.map((q, i) => {
              const chosenId = answers[q.id];
              const isRevealed = revealed[q.id];
              return (
                <div key={q.id} className="rounded-md border p-3">
                  <p className="mb-2 font-medium">
                    Question {i + 1} - {q.text}
                  </p>
                  <div className="space-y-1">
                    {q.choices.map((c) => {
                      const isChosen = chosenId === c.id;
                      const isCorrect = q.correct_choice_id === c.id;
                      let cls = "border";
                      if (isRevealed && isCorrect) cls = "border-emerald-500 bg-emerald-50";
                      else if (isRevealed && isChosen && !isCorrect)
                        cls = "border-destructive bg-destructive/10";
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => selectAnswer(q.id, c.id)}
                          disabled={isRevealed}
                          className={`flex w-full items-center gap-2 rounded-md p-2 text-left text-sm transition-colors ${cls} ${
                            !isRevealed ? "hover:bg-muted/40" : ""
                          }`}
                        >
                          <span>{c.text}</span>
                        </button>
                      );
                    })}
                  </div>
                  {isRevealed && q.explanation && (
                    <p className="mt-2 text-sm text-muted-foreground">{q.explanation}</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
