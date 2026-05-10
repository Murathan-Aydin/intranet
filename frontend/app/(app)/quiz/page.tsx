"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, History, Repeat, Timer } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QuestionSet {
  id: number;
  title: string;
  description: string;
  questions_count: number;
  is_published: boolean;
}

const STUDENT_TOOLS = [
  {
    href: "/quiz/history",
    title: "Historique",
    description: "Vos tentatives passees et leurs scores.",
    icon: History,
  },
  {
    href: "/quiz/stats",
    title: "Statistiques",
    description: "Score moyen, progression, meilleurs resultats.",
    icon: BarChart3,
  },
  {
    href: "/quiz/review",
    title: "Revision",
    description: "Refaire les questions ratees.",
    icon: Repeat,
  },
  {
    href: "/quiz/exam",
    title: "Examen blanc",
    description: "40 questions, 30 minutes, seuil 35/40.",
    icon: Timer,
  },
];

export default function QuizListPage() {
  const { user } = useAuth();
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const isStudent = user?.role === "student";

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

      {isStudent && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {STUDENT_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.href} href={tool.href}>
                <Card className="h-full transition-colors hover:bg-muted/40">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">{tool.title}</CardTitle>
                    </div>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

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
