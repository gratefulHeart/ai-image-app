"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">系统设置</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            基本设置
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">
            系统设置功能正在开发中...
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
