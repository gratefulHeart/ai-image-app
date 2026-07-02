"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditRecharge } from "@/lib/types";
import { CreditCard, Clock, CheckCircle, XCircle } from "lucide-react";

export default function CreditsPage() {
  const [credits, setCredits] = useState(0);
  const [rechargeAmount, setRechargeAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [recharges, setRecharges] = useState<CreditRecharge[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("user_id", user.id)
        .single();
      if (profile) setCredits(profile.credits);

      const { data: rechargesData } = await supabase
        .from("credit_recharges")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (rechargesData) setRecharges(rechargesData);
    }
  };

  const handleSubmit = async () => {
    if (rechargeAmount < 10) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("credit_recharges").insert({
      user_id: user.id,
      amount: rechargeAmount,
    });

    setLoading(false);
    fetchData();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">积分充值</h1>

        {/* Current Balance */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">当前积分</div>
                <div className="text-4xl font-bold">{credits}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recharge Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>申请充值</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>充值金额</Label>
              <div className="flex gap-2">
                {[100, 200, 500, 1000].map((amount) => (
                  <Button
                    key={amount}
                    variant={rechargeAmount === amount ? "default" : "outline"}
                    onClick={() => setRechargeAmount(amount)}
                  >
                    {amount}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(parseInt(e.target.value) || 0)}
                min={10}
                className="mt-2"
              />
            </div>
            <Button onClick={handleSubmit} disabled={loading || rechargeAmount < 10} className="w-full">
              {loading ? "提交中..." : "提交充值申请"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              提交后等待管理员审核，审核通过后积分将自动到账
            </p>
          </CardContent>
        </Card>

        {/* Recharge History */}
        <Card>
          <CardHeader>
            <CardTitle>充值记录</CardTitle>
          </CardHeader>
          <CardContent>
            {recharges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无充值记录
              </div>
            ) : (
              <div className="space-y-3">
                {recharges.map((recharge) => (
                  <div
                    key={recharge.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {recharge.status === "pending" && (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      )}
                      {recharge.status === "approved" && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {recharge.status === "rejected" && (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <div className="font-medium">+{recharge.amount} 积分</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(recharge.created_at).toLocaleString("zh-CN")}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={
                        recharge.status === "approved"
                          ? "default"
                          : recharge.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {recharge.status === "pending" && "待审核"}
                      {recharge.status === "approved" && "已通过"}
                      {recharge.status === "rejected" && "已拒绝"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
