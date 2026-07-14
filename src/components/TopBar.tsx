import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function TopBar({ title, back = "/dashboard", right }: { title: string; back?: string; right?: ReactNode }) {
  return (
    <div className="sticky top-0 z-10 bg-background/90 backdrop-blur px-4 pt-6 pb-4 flex items-center gap-3 border-b border-border/50">
      <Link to={back} className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <h1 className="font-display text-xl flex-1 truncate">{title}</h1>
      {right}
    </div>
  );
}
