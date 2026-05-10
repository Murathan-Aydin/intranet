"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined" ? "http://localhost:8000" : "http://backend:8000");

interface Invitation {
  email: string;
  first_name: string;
  last_name: string;
  expires_at: string;
}

type Status = "loading" | "ready" | "invalid" | "submitting" | "done";

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();

  const [status, setStatus] = useState<Status>("loading");
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    password: "",
    password_confirm: "",
  });

  useEffect(() => {
    if (!params.token) return;
    fetch(`${API_BASE}/api/invitations/token/${params.token}/`)
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as Invitation;
          setInvitation(data);
          setForm((prev) => ({
            ...prev,
            first_name: data.first_name,
            last_name: data.last_name,
          }));
          setStatus("ready");
        } else {
          const data = await res.json().catch(() => ({}));
          setErrorMessage(
            data?.detail ||
              "Cette invitation est invalide, expiree ou deja utilisee.",
          );
          setStatus("invalid");
        }
      })
      .catch(() => {
        setErrorMessage("Impossible de joindre le serveur.");
        setStatus("invalid");
      });
  }, [params.token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    if (form.password !== form.password_confirm) {
      setErrorMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setStatus("submitting");
    try {
      const res = await fetch(
        `${API_BASE}/api/invitations/token/${params.token}/accept/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: form.username,
            password: form.password,
            first_name: form.first_name,
            last_name: form.last_name,
          }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          data?.detail ||
          (typeof data === "object" ? JSON.stringify(data) : String(data));
        setErrorMessage(msg || "Erreur lors de la creation du compte.");
        setStatus("ready");
        return;
      }
      setStatus("done");
      setTimeout(() => router.replace("/login"), 2500);
    } catch {
      setErrorMessage("Erreur reseau.");
      setStatus("ready");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">My Driving School</CardTitle>
          <CardDescription>Creation de votre compte etudiant</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <p className="text-sm text-muted-foreground">Verification du lien...</p>
          )}

          {status === "invalid" && (
            <div className="space-y-3">
              <p className="text-sm text-destructive">
                {errorMessage ||
                  "Cette invitation n'est plus valide. Demandez un nouveau lien."}
              </p>
              <Link href="/login">
                <Button variant="outline">Retour a la connexion</Button>
              </Link>
            </div>
          )}

          {status === "done" && (
            <div className="space-y-3">
              <p className="text-sm text-emerald-600">
                Compte cree. Vous allez etre redirige vers la page de connexion...
              </p>
              <Link href="/login">
                <Button>Aller a la connexion</Button>
              </Link>
            </div>
          )}

          {(status === "ready" || status === "submitting") && invitation && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-md border bg-muted/40 p-3 text-sm">
                <p>
                  Invitation pour : <strong>{invitation.email}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Valable jusqu&apos;au{" "}
                  {new Date(invitation.expires_at).toLocaleString("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
              </div>

              <div className="space-y-2">
                <Label>Identifiant</Label>
                <Input
                  required
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>Mot de passe</Label>
                <Input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Confirmer le mot de passe</Label>
                <Input
                  required
                  type="password"
                  value={form.password_confirm}
                  onChange={(e) =>
                    setForm({ ...form, password_confirm: e.target.value })
                  }
                />
              </div>

              {errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? "Creation..." : "Creer mon compte"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
