"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AppointmentForm } from "@/components/appointment-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewAppointmentPage() {
  const router = useRouter();
  const params = useSearchParams();
  const studentId = params.get("student");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Nouveau rendez-vous</h1>
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <AppointmentForm
            initial={{ student: studentId ? Number(studentId) : null }}
            onSaved={() => router.push("/planning")}
            onCancel={() => router.back()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
