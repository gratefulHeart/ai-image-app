"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, LogOut, CreditCard, Image, Settings } from "lucide-react";
import { useTheme } from "next-themes";

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        setProfile(data);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", session.user.id)
            .single();
          setProfile(data);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="text-primary">✨</span>
            <span>AI 生图</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/gallery"
              className={`text-sm transition-colors hover:text-primary ${
                pathname === "/gallery" ? "text-primary font-medium" : "text-muted-foreground"
              }`}
            >
              画廊
            </Link>
            {profile?.is_admin && (
              <Link
                href="/admin"
                className={`text-sm transition-colors hover:text-primary ${
                  pathname.startsWith("/admin") ? "text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                管理后台
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">切换主题</span>
          </Button>

          {user ? (
            <>
              <Link href="/generate">
                <Button size="sm">开始创作</Button>
              </Link>
              {profile && (
                <Badge variant="secondary" className="hidden sm:flex">
                  <CreditCard className="mr-1 h-3 w-3" />
                  {profile.credits} 积分
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger className="relative h-8 w-8 rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm">{user.email}</p>
                      {profile && (
                        <p className="text-xs text-muted-foreground">
                          {profile.credits} 积分可用
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.location.href = "/gallery"}>
                    <Image className="mr-2 h-4 w-4" />
                    我的作品
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = "/credits"}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    积分充值
                  </DropdownMenuItem>
                  {profile?.is_admin && (
                    <DropdownMenuItem onClick={() => window.location.href = "/admin"}>
                      <Settings className="mr-2 h-4 w-4" />
                      管理后台
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">登录</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">注册</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
