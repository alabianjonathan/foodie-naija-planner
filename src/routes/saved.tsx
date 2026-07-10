import { createFileRoute } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { MealCard } from "@/components/MealCard";
import { meals } from "@/data/meals";
import { useState } from "react";

export const Route = createFileRoute("/saved")({ component: Saved });

function Saved() {
  const [tab, setTab] = useState<"meals" | "plans">("meals");
  const saved = meals.slice(0, 4);

  return (
    <PhoneShell>
      <TopBar title="Saved" back="/home" />
      <div className="px-6 pt-4">
        <div className="flex gap-2 rounded-full bg-secondary p-1">
          {(["meals", "plans"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 rounded-full py-2 text-sm font-medium capitalize transition-all ${tab === t ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
              {t === "meals" ? "Meals" : "Meal plans"}
            </button>
          ))}
        </div>

        {tab === "meals" ? (
          <div className="mt-5 grid grid-cols-2 gap-4">
            {saved.map(m => <MealCard key={m.id} meal={m} />)}
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {[
              { name: "Family week — ₦5k/day", days: 7, kcal: "~2,100/day" },
              { name: "Weight loss plan", days: 7, kcal: "~1,600/day" },
              { name: "Bachelor budget plan", days: 5, kcal: "~1,900/day" },
            ].map(p => (
              <div key={p.name} className="card-soft !p-4">
                <h3 className="font-display text-base">{p.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{p.days} days · {p.kcal}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="h-6" />
    </PhoneShell>
  );
}
