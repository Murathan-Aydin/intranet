"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  CalendarDays,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  ShoppingCart,
  Users,
  PencilRuler,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, roles: ["student", "instructor", "secretary", "admin"] },
  { href: "/planning", label: "Planning", icon: CalendarDays, roles: ["student", "instructor", "secretary", "admin"] },
  { href: "/users", label: "Utilisateurs", icon: Users, roles: ["secretary", "admin"] },
  { href: "/lesson-packs", label: "Forfaits", icon: CreditCard, roles: ["secretary", "admin"] },
  { href: "/buy-hours", label: "Acheter des heures", icon: ShoppingCart, roles: ["student"] },
  { href: "/quiz", label: "Code de la route", icon: GraduationCap, roles: ["student"] },
  { href: "/quiz/manage", label: "Gerer les series", icon: PencilRuler, roles: ["instructor", "admin"] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Chargement...
      </div>
    );
  }

  const items = NAV.filter((item) => item.roles.includes(user.role));

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 border-r bg-white p-4 md:block">
        <div className="mb-6">
          <p className="text-lg font-bold">My Driving School</p>
          <p className="text-xs text-muted-foreground">Intranet auto-ecole</p>
        </div>
        <nav className="space-y-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground/80",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-white px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
            <span className="text-sm font-medium">
              {user.first_name} {user.last_name}{" "}
              <span className="text-muted-foreground">({user.username})</span>
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Deconnexion
          </Button>
        </header>
        <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
