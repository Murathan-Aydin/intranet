"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QuestionSet {
  id: number;
  title: string;
  description: string;
  questions_count: number;
  is_published: boolean;
}

interface QuizAttempt {
  id: number;
  question_set: number;
  question_set_title: string;
  score: number;
  total: number;
  submitted_at: string;
}

export default function QuizListPage() {
  const [sets, setSets] = useState<QuestionSet[]>([]);

  useEffect(() => {
    api<QuestionSet[]>("/api/question-sets/").then(setSets).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Code de la route</h1>
        <p className="text-muted-foreground">
          Entrainez-vous avec les series de questions preparees par les instructeurs.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {sets.length === 0 && (
          <p className="text-muted-foreground">Aucune serie disponible pour le moment.</p>
        )}
        {sets.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle>{s.title}</CardTitle>
              <CardDescription>
                {s.questions_count} question{s.questions_count > 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{s.description}</p>
              <Link href={`/quiz/${s.id}`}>
                <Button>Commencer</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
