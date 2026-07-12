import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Store, UtensilsCrossed, Tags, Wheat,
  HeartPulse, MapPin, CalendarRange, Inbox, Settings, LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type NavItem = { to: string; label: string; icon: React.ElementType; exact?: boolean; superOnly?: boolean };

const items: NavItem[] = [
  { to: "/jb12bz", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/jb12bz/users", label: "Users", icon: Users },
  { to: "/jb12bz/restaurants", label: "Restaurants", icon: Store },
  { to: "/jb12bz/meals", label: "Meals", icon: UtensilsCrossed },
  { to: "/jb12bz/categories", label: "Categories", icon: Tags },
  { to: "/jb12bz/ingredients", label: "Ingredients", icon: Wheat },
  { to: "/jb12bz/nutrition", label: "Nutrition", icon: HeartPulse },
  { to: "/jb12bz/cities", label: "Cities & Areas", icon: MapPin },
  { to: "/jb12bz/meal-plans", label: "Meal Plans", icon: CalendarRange },
  { to: "/jb12bz/leads", label: "Leads", icon: Inbox },
  { to: "/jb12bz/settings", label: "Settings", icon: Settings, superOnly: true },
];

export function AdminSidebar({ role, email }: { role: string; email?: string }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/jb12bz-login" });
  };

  return (
    <aside className="w-64 shrink-0 bg-charcoal text-white flex flex-col min-h-screen">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand grid place-items-center text-brand-foreground font-bold">M</div>
          <div>
            <div className="font-semibold text-sm">MealBeta</div>
            <div className="text-xs text-white/60">Admin console</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          if (item.superOnly && role !== "super_admin") return null;
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                active ? "bg-brand text-brand-foreground" : "text-white/80 hover:bg-white/10"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10 space-y-2">
        <div className="px-3 py-2 rounded-lg bg-white/5">
          <div className="text-xs text-white/60">Signed in as</div>
          <div className="text-sm truncate">{email ?? "—"}</div>
          <div className="text-xs mt-1 inline-block px-2 py-0.5 rounded-full bg-warm/20 text-warm capitalize">{role.replace("_", " ")}</div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/80 hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </aside>
  );
}
