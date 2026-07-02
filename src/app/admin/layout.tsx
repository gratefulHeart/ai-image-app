"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { cn } from "@/lib/utils";
import { Settings, Users, CreditCard, Database } from "lucide-react";

const sidebarItems = [
  { href: "/admin", label: "模型管理", icon: Database },
  { href: "/admin/users", label: "用户管理", icon: Users },
  { href: "/admin/recharges", label: "充值审核", icon: CreditCard },
  { href: "/admin/settings", label: "系统设置", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r hidden md:block">
          <nav className="p-4 space-y-2">
            <h2 className="font-bold text-lg mb-4 px-2">管理后台</h2>
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
