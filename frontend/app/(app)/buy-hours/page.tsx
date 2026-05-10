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

const PACKS = [
  { value: 60, price: 60, label: "1 heure - 60 EUR" },
  { value: 300, price: 290, label: "5 heures - 290 EUR" },
  { value: 600, price: 540, label: "10 heures - 540 EUR" },
  { value: 1200, price: 1000, label: "20 heures - 1000 EUR" },
];

export default function BuyHoursPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [minutes, setMinutes] = useState("60");
  const [holder, setHolder] = useState("");
  const [card, setCard] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const last4 = card.replace(/\s+/g, "").slice(-4);
      if (last4.length !== 4) throw new Error("Numero de carte invalide.");
      await api("/api/lesson-packs/buy/", {
        method: "POST",
        body: JSON.stringify({
          minutes: Number(minutes),
          card_holder: holder,
          card_last4: last4,
        }),
      });
      await refresh();
      setSuccess(`Achat de ${minutes} minutes effectue (paiement simule).`);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: any) {
      setError(err?.message || "Erreur lors du paiement");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Acheter des heures de conduite</h1>
        <p className="text-muted-foreground">
          Paiement simule (mode demonstration) - aucun debit reel n'est effectue.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Paiement par carte</CardTitle>
          <CardDescription>Choisissez un forfait et entrez les informations de carte.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Forfait</Label>
              <Select value={minutes} onChange={(e) => setMinutes(e.target.value)}>
                {PACKS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Titulaire de la carte</Label>
              <Input
                required
                placeholder="JEAN DUPONT"
                value={holder}
                onChange={(e) => setHolder(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Numero de carte</Label>
              <Input
                required
                placeholder="4242 4242 4242 4242"
                value={card}
                onChange={(e) => setCard(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-emerald-600">{success}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Paiement en cours..." : "Payer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
