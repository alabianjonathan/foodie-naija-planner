import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import logoAsset from "@/assets/mealbeta-logo.png.asset.json";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoAsset.url} alt="MealBeta" className="h-8 w-auto" />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground">About</Link>
          <Link to="/private-chefs" className="text-sm font-medium text-muted-foreground hover:text-foreground">Private Chefs</Link>
          <Link to="/help" className="text-sm font-medium text-muted-foreground hover:text-foreground">Help</Link>
          <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="hidden rounded-full px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary md:inline-flex">
            Sign in
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-soft hover:opacity-95"
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <img src={logoAsset.url} alt="MealBeta" className="h-6 w-auto" />
          <span>© {new Date().getFullYear()} MealBeta. Made in Nigeria.</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link to="/about" className="hover:text-foreground">About</Link>
          <Link to="/chefs" className="hover:text-foreground">Chefs</Link>
          <Link to="/help" className="hover:text-foreground">Help</Link>
          <Link to="/contact" className="hover:text-foreground">Contact</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/auth" className="hover:text-foreground">Sign in</Link>
        </div>
      </div>
    </footer>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteNav />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
