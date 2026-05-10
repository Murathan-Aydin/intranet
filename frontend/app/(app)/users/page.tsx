"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/utils";

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("");

  async function load() {
    const qs = roleFilter ? `?role=${roleFilter}` : "";
    const data = await api<User[]>(`/api/users/${qs}`);
    setUsers(data);
  }

  useEffect(() => {
    load();
  }, [roleFilter]);

  async function deleteUser(id: number) {
    if (!confirm("Supprimer ce compte ?")) return;
    await api(`/api/users/${id}/`, { method: "DELETE" });
    load();
  }

  if (!me) return null;
  const canManageStaff = me.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Utilisateurs</h1>
          <p className="text-muted-foreground">
            Gerer les comptes Student, Instructor{canManageStaff ? " et Secretary" : ""}.
          </p>
        </div>
        <Link href="/users/new">
          <Button>Nouveau compte</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtre</CardTitle>
          <CardDescription>Filtrer par role.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="md:w-72">
            <option value="">Tous</option>
            <option value="student">Etudiants</option>
            <option value="instructor">Instructeurs</option>
            {canManageStaff && <option value="secretary">Secretaires</option>}
            {canManageStaff && <option value="admin">Admins</option>}
          </Select>
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
                <TH>Role</TH>
                <TH>Statut</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {users.length === 0 && (
                <TR>
                  <TD colSpan={6} className="py-6 text-center text-muted-foreground">
                    Aucun utilisateur.
                  </TD>
                </TR>
              )}
              {users.map((u) => (
                <TR key={u.id}>
                  <TD className="font-medium">{u.username}</TD>
                  <TD>{u.first_name} {u.last_name}</TD>
                  <TD>{u.email}</TD>
                  <TD>
                    <Badge variant="secondary">{ROLE_LABELS[u.role]}</Badge>
                  </TD>
                  <TD>
                    {u.is_active ? (
                      <Badge variant="success">Actif</Badge>
                    ) : (
                      <Badge variant="warning">Inactif</Badge>
                    )}
                  </TD>
                  <TD className="space-x-2 text-right">
                    {u.role === "student" && (
                      <Link href={`/students/${u.id}`}>
                        <Button size="sm" variant="outline">Fiche</Button>
                      </Link>
                    )}
                    <Link href={`/users/${u.id}`}>
                      <Button size="sm" variant="outline">Editer</Button>
                    </Link>
                    {(canManageStaff || (u.role === "student" || u.role === "instructor")) && (
                      <Button size="sm" variant="destructive" onClick={() => deleteUser(u.id)}>
                        Supprimer
                      </Button>
                    )}
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
