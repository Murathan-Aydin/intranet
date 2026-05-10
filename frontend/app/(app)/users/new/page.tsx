"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type Mode = "invite" | "create";

export default function NewUserPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [mode, setMode] = useState<Mode>("invite");
  const [role, setRole] = useState<string>("student");

  const [invite, setInvite] = useState({ email: "", first_name: "", last_name: "" });
  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isStudent = role === "student";

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await api("/api/invitations/", {
        method: "POST",
        body: JSON.stringify(invite),
      });
      setSuccess(
        `Invitation envoyee a ${invite.email}. L'etudiant recevra un email avec un lien de creation de compte.`,
      );
      setInvite({ email: "", first_name: "", last_name: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api("/api/users/", {
        method: "POST",
        body: JSON.stringify({ ...form, role }),
      });
      router.push("/users");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nouveau compte</h1>
        <Button variant="outline" onClick={() => router.push("/users")}>
          Retour
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Type de compte</CardTitle>
          <CardDescription>
            Pour un etudiant, vous pouvez envoyer une invitation par email : il
            recevra un lien pour creer lui-meme son identifiant et son mot de passe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={role}
                onChange={(e) => {
                  const next = e.target.value;
                  setRole(next);
                  if (next !== "student") setMode("create");
                }}
              >
                <option value="student">Etudiant</option>
                <option value="instructor">Instructeur</option>
                {user?.role === "admin" && <option value="secretary">Secretaire</option>}
                {user?.role === "admin" && <option value="admin">Admin</option>}
              </Select>
            </div>
            {isStudent && (
              <div className="space-y-2">
                <Label>Mode de creation</Label>
                <Select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                  <option value="invite">Inviter par email</option>
                  <option value="create">Creer directement</option>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isStudent && mode === "invite" ? (
        <Card>
          <CardHeader>
            <CardTitle>Invitation etudiant</CardTitle>
            <CardDescription>
              Renseignez l&apos;email de l&apos;etudiant. Les prenom et nom sont
              optionnels et seront pre-remplis sur sa page de creation de compte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  required
                  value={invite.email}
                  onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Prenom (optionnel)</Label>
                  <Input
                    value={invite.first_name}
                    onChange={(e) =>
                      setInvite({ ...invite, first_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom (optionnel)</Label>
                  <Input
                    value={invite.last_name}
                    onChange={(e) =>
                      setInvite({ ...invite, last_name: e.target.value })
                    }
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-emerald-600">{success}</p>}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/users")}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Envoi..." : "Envoyer l'invitation"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Informations du compte</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Identifiant</Label>
                  <Input
                    required
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mot de passe</Label>
                  <Input
                    required
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prenom</Label>
                  <Input
                    value={form.first_name}
                    onChange={(e) =>
                      setForm({ ...form, first_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={form.last_name}
                    onChange={(e) =>
                      setForm({ ...form, last_name: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/users")}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creation..." : "Creer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
