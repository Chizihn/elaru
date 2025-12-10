"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "./ui/button";
import Image from "next/image";

export function Navbar() {
  const pathname = usePathname();
  const { address } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by waiting for client mount
  useEffect(() => {
    setMounted(true);
  }, []);
  const routes = [
    { href: "/agents", label: "Discover" },
    // { href: "/workflow", label: "🔗 Workflow" },
    // { href: "/autonomous", label: "🆕 Autonomous" },
    { href: "/reputation", label: "Reputation" },
    { href: "/register-agent", label: "Register Agent" },
    { href: "/validator", label: "Validator" },
    { href: "/documentation", label: "Docs" },
  ];

  return (
    <div className="sticky top-0 z-50 border-b-3 border-border bg-background/98 backdrop-blur-sm shadow-[0_4px_0px_0px_rgba(0,229,229,0.1)]">
      <div className="mx-auto flex justify-between h-20 items-center px-4 sm:px-6 lg:px-10">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-3 group">
            <Image
              src="/elaru-logo.png"
              width={100}
              height={50}
              alt="Elaru Logo"
              className="rounded-full"
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="ml-10 hidden md:flex items-baseline gap-x-2">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm font-bold uppercase tracking-wide transition-all px-4 py-2 border-2 border-transparent",
                pathname === route.href
                  ? "text-primary border-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary hover:border-primary/50"
              )}
            >
              {route.label}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="ml-auto hidden md:flex items-center gap-3">
          <CustomConnectButton />
          {mounted && address && (
            <Link href="/dashboard">
              <Button variant="gradient" size="default">
                Dashboard
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="ml-auto md:hidden p-2 border-2 border-primary hover:bg-primary/10 transition-colors"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <X className="h-6 w-6" color="white" />
          ) : (
            <Menu className="h-6 w-6" color="white" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t-3 border-border px-4 py-4 bg-card">
          <div className="flex flex-col gap-3">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "text-sm font-bold uppercase tracking-wide transition-all px-4 py-3 border-2",
                  pathname === route.href
                    ? "text-primary border-primary bg-primary/10"
                    : "text-muted-foreground border-border hover:text-primary hover:border-primary/50"
                )}
              >
                {route.label}
              </Link>
            ))}
            <div className="pt-3 border-t-2 border-border flex flex-col gap-3">
              <CustomConnectButton />
              {mounted && address && (
                <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                  <Button className="w-full" variant="gradient">
                    Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
