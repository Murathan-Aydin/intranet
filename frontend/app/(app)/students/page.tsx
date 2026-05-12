"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Student {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
}

export default function StudentsListPage() {
  const { user: me } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api<Student[]>("/api/users/?role=student").then(setStudents).catch(() => setStudents([]));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      `${s.username} ${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(q),
    );
  }, [students, query]);

  if (!me) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Eleves</h1>
        <p className="text-muted-foreground">
          Liste des eleves. Cliquez sur une fiche pour voir le planning et les stats quiz.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recherche</CardTitle>
          <CardDescription>Filtre par nom, prenom, identifiant ou email.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Rechercher..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="md:w-96"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Identifiant</TH>
                <TH>Nom</TH>
                <TH>Email</TH>
                <TH>Statut</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {filtered.length === 0 && (
                <TR>
                  <TD colSpan={5} className="py-6 text-center text-muted-foreground">
                    Aucun eleve.
                  </TD>
                </TR>
              )}
              {filtered.map((s) => (
                <TR key={s.id}>
                  <TD className="font-medium">{s.username}</TD>
                  <TD>{s.first_name} {s.last_name}</TD>
                  <TD>{s.email}</TD>
                  <TD>
                    {s.is_active ? (
                      <Badge variant="success">Actif</Badge>
                    ) : (
                      <Badge variant="warning">Inactif</Badge>
                    )}
                  </TD>
                  <TD className="text-right">
                    <Link href={`/students/${s.id}`}>
                      <Button size="sm" variant="outline">Fiche</Button>
                    </Link>
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
