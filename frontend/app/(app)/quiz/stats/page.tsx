"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

interface QuizAttempt {
  id: number;
  question_set: number;
  question_set_title: string;
  score: number;
  total: number;
  submitted_at: string;
}

interface SetStat {
  setId: number;
  title: string;
  attempts: number;
  bestScore: number;
  bestTotal: number;
  bestPct: number;
}

function pct(score: number, total: number): number {
  if (!total) return 0;
  return Math.round((score / total) * 100);
}

export default function QuizStatsPage() {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<QuizAttempt[]>("/api/quiz-attempts/")
      .then(setAttempts)
      .catch(() => setAttempts([]))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const total = attempts.length;
    const sumPct = attempts.reduce((acc, a) => acc + pct(a.score, a.total), 0);
    const avg = total ? Math.round(sumPct / total) : 0;
    const passed = attempts.filter((a) => pct(a.score, a.total) >= 80).length;

    const perSet = new Map<number, SetStat>();
    for (const a of attempts) {
      const p = pct(a.score, a.total);
      const existing = perSet.get(a.question_set);
      if (!existing || p > existing.bestPct) {
        perSet.set(a.question_set, {
          setId: a.question_set,
          title: a.question_set_title,
          attempts: (existing?.attempts || 0) + 1,
          bestScore: existing && p <= existing.bestPct ? existing.bestScore : a.score,
          bestTotal: existing && p <= existing.bestPct ? existing.bestTotal : a.total,
          bestPct: existing && p <= existing.bestPct ? existing.bestPct : p,
        });
      } else {
        perSet.set(a.question_set, { ...existing, attempts: existing.attempts + 1 });
      }
    }

    const recent = [...attempts]
      .sort(
        (a, b) =>
          new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime(),
      )
      .slice(0, 10)
      .reverse();

    return {
      total,
      avg,
      passed,
      perSet: Array.from(perSet.values()).sort((a, b) => b.bestPct - a.bestPct),
      recent,
    };
  }, [attempts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Statistiques</h1>
          <p className="text-muted-foreground">Votre progression sur le code de la route.</p>
        </div>
        <Link href="/quiz">
          <Button variant="outline">Retour</Button>
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total tentatives</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Score moyen</CardDescription>
            <CardTitle className="text-3xl">{stats.avg}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Quiz reussis (&ge; 80%)</CardDescription>
            <CardTitle className="text-3xl">{stats.passed}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progression - 10 dernieres tentatives</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : stats.recent.length === 0 ? (
            <p className="text-muted-foreground">Pas encore de tentative.</p>
          ) : (
            <div className="space-y-2">
              {stats.recent.map((a) => {
                const p = pct(a.score, a.total);
                const passed = p >= 80;
                return (
                  <div key={a.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate pr-2">{a.question_set_title}</span>
                      <span>{formatDateTime(a.submitted_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 flex-1 overflow-hidden rounded bg-muted">
                        <div
                          className={passed ? "h-full bg-emerald-500" : "h-full bg-orange-400"}
                          style={{ width: `${p}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-sm font-medium">{p}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meilleur score par serie</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Serie</TH>
                <TH>Tentatives</TH>
                <TH>Meilleur score</TH>
                <TH>%</TH>
              </TR>
            </THead>
            <TBody>
              {stats.perSet.length === 0 && (
                <TR>
                  <TD colSpan={4} className="py-6 text-center text-muted-foreground">
                    Aucun resultat.
                  </TD>
                </TR>
              )}
              {stats.perSet.map((s) => (
                <TR key={s.setId}>
                  <TD>{s.title}</TD>
                  <TD>{s.attempts}</TD>
                  <TD>
                    {s.bestScore} / {s.bestTotal}
                  </TD>
                  <TD>
                    <Badge variant={s.bestPct >= 80 ? "default" : "outline"}>{s.bestPct}%</Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
