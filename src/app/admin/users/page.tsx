"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Profile } from "@/lib/types";
import { User, Search } from "lucide-react";

interface ProfileWithEmail extends Profile {
  email?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ProfileWithEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProfileWithEmail | null>(null);
  const [creditAmount, setCreditAmount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const { users } = await res.json();
      setUsers(users);
    }
    setLoading(false);
  };

  const openCreditDialog = (user: ProfileWithEmail) => {
    setSelectedUser(user);
    setCreditAmount(0);
    setDialogOpen(true);
  };

  const handleAdjustCredits = async () => {
    if (!selectedUser || creditAmount === 0) return;

    const newCredits = Math.max(0, selectedUser.credits + creditAmount);
    await supabase
      .from("profiles")
      .update({ credits: newCredits })
      .eq("user_id", selectedUser.user_id);

    setDialogOpen(false);
    fetchUsers();
  };

  const filteredUsers = users.filter(
    (u) =>
      u.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索用户..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>用户列表 ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">用户</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">积分</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">角色</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">注册时间</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.user_id} className="border-b">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-full">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{user.email}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {user.user_id.slice(0, 12)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary">{user.credits}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      {user.is_admin ? (
                        <Badge>管理员</Badge>
                      ) : (
                        <Badge variant="outline">用户</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openCreditDialog(user)}
                      >
                        调整积分
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Adjust Credits Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>调整积分</DialogTitle>
            <DialogDescription>
              为用户 {selectedUser?.email} 调整积分
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">当前积分</div>
              <div className="text-2xl font-bold">{selectedUser?.credits}</div>
            </div>
            <div className="space-y-2">
              <Label>调整数量 (正数增加，负数减少)</Label>
              <Input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                placeholder="例如: 100 或 -50"
              />
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <div className="text-sm text-muted-foreground">调整后积分</div>
              <div className="text-2xl font-bold text-primary">
                {Math.max(0, (selectedUser?.credits || 0) + creditAmount)}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAdjustCredits} disabled={creditAmount === 0}>
              确认调整
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
