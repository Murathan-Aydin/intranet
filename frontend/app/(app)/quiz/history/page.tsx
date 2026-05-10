"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

interface QuizAttempt {
  id: number;
  question_set: number;
  question_set_title: string;
  score: number;
  total: number;
  submitted_at: string;
}

function percent(score: number, total: number): number {
  if (!total) return 0;
  return Math.round((score / total) * 100);
}

export default function QuizHistoryPage() {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<QuizAttempt[]>("/api/quiz-attempts/")
      .then(setAttempts)
      .catch(() => setAttempts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Historique des tentatives</h1>
          <p className="text-muted-foreground">
            Toutes vos tentatives de quiz, du plus recent au plus ancien.
          </p>
        </div>
        <Link href="/quiz">
          <Button variant="outline">Retour</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{attempts.length} tentative{attempts.length > 1 ? "s" : ""}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Date</TH>
                <TH>Serie</TH>
                <TH>Score</TH>
                <TH>%</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {loading && (
                <TR>
                  <TD colSpan={5} className="py-6 text-center text-muted-foreground">
                    Chargement...
                  </TD>
                </TR>
              )}
              {!loading && attempts.length === 0 && (
                <TR>
                  <TD colSpan={5} className="py-6 text-center text-muted-foreground">
                    Aucune tentative pour le moment.
                  </TD>
                </TR>
              )}
              {attempts.map((a) => {
                const pct = percent(a.score, a.total);
                const passed = pct >= 80;
                return (
                  <TR key={a.id}>
                    <TD>{formatDateTime(a.submitted_at)}</TD>
                    <TD>{a.question_set_title}</TD>
                    <TD>
                      {a.score} / {a.total}
                    </TD>
                    <TD>
                      <Badge variant={passed ? "default" : "outline"}>{pct}%</Badge>
                    </TD>
                    <TD>
                      <Link href={`/quiz/${a.question_set}`}>
                        <Button size="sm" variant="outline">
                          Refaire
                        </Button>
                      </Link>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
