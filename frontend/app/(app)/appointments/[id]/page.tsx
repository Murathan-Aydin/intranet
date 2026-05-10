"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AppointmentForm, AppointmentInitial } from "@/components/appointment-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditAppointmentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<AppointmentInitial | null>(null);

  useEffect(() => {
    api<AppointmentInitial & { id: number }>(`/api/appointments/${params.id}/`)
      .then(setData)
      .catch(() => setData(null));
  }, [params.id]);

  if (!data) return <p className="text-muted-foreground">Chargement...</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Editer le rendez-vous</h1>
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <AppointmentForm
            initial={data}
            showDelete
            onSaved={() => router.push("/planning")}
            onCancel={() => router.back()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
