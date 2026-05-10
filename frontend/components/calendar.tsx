"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatMinutes } from "@/lib/utils";

export interface CalendarAppointment {
  id: number;
  start_at: string;
  end_at: string;
  location: string;
  duration_minutes: number;
  student_full_name: string;
  instructor_full_name: string;
}

interface CalendarProps {
  appointments: CalendarAppointment[];
  onSelectAppointment?: (id: number) => void;
  canEdit?: boolean;
}

const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier",
  "Fevrier",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Aout",
  "Septembre",
  "Octobre",
  "Novembre",
  "Decembre",
];

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonthGrid(year: number, month: number): Date {
  const first = new Date(year, month, 1);
  const weekday = first.getDay();
  const offset = weekday === 0 ? 6 : weekday - 1;
  const start = new Date(year, month, 1 - offset);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function Calendar({ appointments, onSelectAppointment, canEdit }: CalendarProps) {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const [cursor, setCursor] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<string>(() => dayKey(today));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const grid = useMemo(() => {
    const start = startOfMonthGrid(year, month);
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [year, month]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarAppointment[]>();
    for (const a of appointments) {
      const k = dayKey(new Date(a.start_at));
      const arr = map.get(k);
      if (arr) arr.push(a);
      else map.set(k, [a]);
    }
    for (const arr of map.values()) {
      arr.sort((x, y) => new Date(x.start_at).getTime() - new Date(y.start_at).getTime());
    }
    return map;
  }, [appointments]);

  const selectedAppointments = byDay.get(selectedDay) ?? [];
  const selectedDate = useMemo(() => {
    const [y, m, d] = selectedDay.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDay]);

  const goPrev = () => setCursor(new Date(year, month - 1, 1));
  const goNext = () => setCursor(new Date(year, month + 1, 1));
  const goToday = () => {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(dayKey(today));
  };

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-lg font-semibold capitalize">
            {MONTHS[month]} {year}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={goPrev} aria-label="Mois precedent">
              {"<"}
            </Button>
            <Button size="sm" variant="outline" onClick={goToday}>
              Aujourd&apos;hui
            </Button>
            <Button size="sm" variant="outline" onClick={goNext} aria-label="Mois suivant">
              {">"}
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-xs font-medium text-muted-foreground">
          {WEEK_DAYS.map((d) => (
            <div key={d} className="px-2 py-1 text-center">
              {d}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {grid.map((d) => {
            const k = dayKey(d);
            const inMonth = d.getMonth() === month;
            const isToday = k === dayKey(today);
            const isSelected = k === selectedDay;
            const items = byDay.get(k) ?? [];
            const reserved = items.length > 0;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setSelectedDay(k)}
                className={cn(
                  "flex min-h-[80px] flex-col items-start gap-1 rounded-md border p-1.5 text-left text-xs transition-colors",
                  inMonth ? "bg-background" : "bg-muted/40 text-muted-foreground",
                  reserved && inMonth && "border-primary/40 bg-primary/5",
                  !reserved && inMonth && "hover:bg-accent",
                  isSelected && "ring-2 ring-ring",
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                      isToday && "bg-primary text-primary-foreground",
                    )}
                  >
                    {d.getDate()}
                  </span>
                  {reserved ? (
                    <Badge variant="default" className="px-1.5 py-0 text-[10px]">
                      {items.length}
                    </Badge>
                  ) : inMonth ? (
                    <span className="text-[10px] text-muted-foreground">Dispo</span>
                  ) : null}
                </div>
                <div className="flex w-full flex-col gap-0.5">
                  {items.slice(0, 2).map((a) => (
                    <span
                      key={a.id}
                      className="truncate rounded-sm bg-primary/10 px-1 py-0.5 text-[10px] font-medium text-primary"
                      title={`${a.student_full_name} - ${a.instructor_full_name}`}
                    >
                      {new Date(a.start_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      {a.student_full_name}
                    </span>
                  ))}
                  {items.length > 2 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{items.length - 2} autres
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border border-primary/40 bg-primary/5" />
            Reserve
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border bg-background" />
            Dispo
          </span>
        </div>

        <div className="mt-6 border-t pt-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold">
              {selectedDate.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
            <Badge variant={selectedAppointments.length > 0 ? "default" : "outline"}>
              {selectedAppointments.length} rendez-vous
            </Badge>
          </div>
          {selectedAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun rendez-vous ce jour.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {selectedAppointments.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-col gap-1 rounded-md border p-3 text-sm md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="font-medium">
                      {new Date(a.start_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" - "}
                      {new Date(a.end_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      <span className="ml-2 text-muted-foreground">
                        ({formatMinutes(a.duration_minutes)})
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      {a.student_full_name} avec {a.instructor_full_name}
                    </div>
                    <div className="text-xs text-muted-foreground">{a.location}</div>
                  </div>
                  {canEdit && onSelectAppointment && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSelectAppointment(a.id)}
                    >
                      Editer
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
