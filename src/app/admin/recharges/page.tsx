"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreditRecharge } from "@/lib/types";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface RechargeWithUser extends CreditRecharge {
  user_email?: string;
}

export default function AdminRechargesPage() {
  const [recharges, setRecharges] = useState<RechargeWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRecharge, setSelectedRecharge] = useState<RechargeWithUser | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchRecharges();
  }, []);

  const fetchRecharges = async () => {
    const { data } = await supabase
      .from("credit_recharges")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      const emailMap = new Map<string, string>();
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const { users } = await res.json();
        for (const u of users) emailMap.set(u.user_id, u.email);
      }
      setRecharges(data.map((r) => ({
        ...r,
        user_email: emailMap.get(r.user_id) ?? "(未知邮箱)",
      })));
    }
    setLoading(false);
  };

  const openDialog = (recharge: RechargeWithUser, action: "approved" | "rejected") => {
    setSelectedRecharge({ ...recharge, status: action });
    setAdminNote("");
    setDialogOpen(true);
  };

  const handleProcess = async () => {
    if (!selectedRecharge) return;

    const { error } = await supabase
      .from("credit_recharges")
      .update({
        status: selectedRecharge.status,
        admin_note: adminNote,
        processed_at: new Date().toISOString(),
      })
      .eq("id", selectedRecharge.id);

    if (!error && selectedRecharge.status === "approved") {
      // Add credits to user
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("user_id", selectedRecharge.user_id)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({ credits: profile.credits + selectedRecharge.amount })
          .eq("user_id", selectedRecharge.user_id);
      }
    }

    setDialogOpen(false);
    fetchRecharges();
  };

  const filteredRecharges = recharges.filter(
    (r) => filter === "all" || r.status === filter
  );

  const statusCounts = {
    all: recharges.length,
    pending: recharges.filter((r) => r.status === "pending").length,
    approved: recharges.filter((r) => r.status === "approved").length,
    rejected: recharges.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">充值审核</h1>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            onClick={() => setFilter(status)}
          >
            {status === "all" && "全部"}
            {status === "pending" && "待审核"}
            {status === "approved" && "已批准"}
            {status === "rejected" && "已拒绝"}
            <Badge variant="secondary" className="ml-2">
              {statusCounts[status]}
            </Badge>
          </Button>
        ))}
      </div>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">用户</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">充值金额</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">状态</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">申请时间</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">处理时间</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">备注</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecharges.map((recharge) => (
                  <tr key={recharge.id} className="border-b">
                    <td className="py-3 px-4">
                      <div className="font-medium text-sm">{recharge.user_email}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {recharge.user_id.slice(0, 12)}...
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="text-lg">
                        +{recharge.amount}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {recharge.status === "pending" && (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          <Clock className="mr-1 h-3 w-3" />
                          待审核
                        </Badge>
                      )}
                      {recharge.status === "approved" && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          已批准
                        </Badge>
                      )}
                      {recharge.status === "rejected" && (
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          <XCircle className="mr-1 h-3 w-3" />
                          已拒绝
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(recharge.created_at).toLocaleString("zh-CN")}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {recharge.processed_at
                        ? new Date(recharge.processed_at).toLocaleString("zh-CN")
                        : "-"}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground max-w-[200px] truncate">
                      {recharge.admin_note || "-"}
                    </td>
                    <td className="py-3 px-4">
                      {recharge.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => openDialog(recharge, "approved")}
                          >
                            批准
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDialog(recharge, "rejected")}
                          >
                            拒绝
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Process Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRecharge?.status === "approved" ? "批准充值" : "拒绝充值"}
            </DialogTitle>
            <DialogDescription>
              用户: {selectedRecharge?.user_email}
              <br />
              金额: +{selectedRecharge?.amount} 积分
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>管理员备注 (可选)</Label>
              <Input
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="输入备注信息..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant={selectedRecharge?.status === "approved" ? "default" : "destructive"}
              onClick={handleProcess}
            >
              {selectedRecharge?.status === "approved" ? "确认批准" : "确认拒绝"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
