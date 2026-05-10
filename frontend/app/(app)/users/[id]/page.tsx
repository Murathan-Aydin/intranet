"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface UserData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

export default function EditUserPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user: me } = useAuth();
  const [data, setData] = useState<UserData | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<UserData>(`/api/users/${params.id}/`).then(setData).catch(() => setData(null));
  }, [params.id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!data) return;
    setError(null);
    setSubmitting(true);
    try {
      await api(`/api/users/${data.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ ...data, password: password || undefined }),
      });
      router.push("/users");
    } catch (err: any) {
      setError(err?.message || "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  if (!data || !me) return <p className="text-muted-foreground">Chargement...</p>;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Editer {data.username}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Identifiant</Label>
                <Input
                  value={data.username}
                  onChange={(e) => setData({ ...data, username: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nouveau mot de passe</Label>
                <Input
                  type="password"
                  placeholder="Laisser vide pour ne pas changer"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Prenom</Label>
                <Input
                  value={data.first_name || ""}
                  onChange={(e) => setData({ ...data, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  value={data.last_name || ""}
                  onChange={(e) => setData({ ...data, last_name: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={data.email || ""}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Role</Label>
                <Select
                  value={data.role}
                  onChange={(e) => setData({ ...data, role: e.target.value })}
                  disabled={me.role !== "admin" && (data.role === "secretary" || data.role === "admin")}
                >
                  <option value="student">Etudiant</option>
                  <option value="instructor">Instructeur</option>
                  {me.role === "admin" && <option value="secretary">Secretaire</option>}
                  {me.role === "admin" && <option value="admin">Admin</option>}
                </Select>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={data.is_active}
                  onChange={(e) => setData({ ...data, is_active: e.target.checked })}
                />
                <Label htmlFor="is_active">Compte actif</Label>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Annuler
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
