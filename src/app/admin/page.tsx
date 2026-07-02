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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Model } from "@/lib/types";
import { Plus, Pencil, Trash2, Database, Users, Image, CreditCard } from "lucide-react";

export default function AdminModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [stats, setStats] = useState({ models: 0, users: 0, generations: 0, pendingRecharges: 0 });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    model_id: "",
    provider: "agnes" as "agnes" | "sensenova",
    api_key: "",
    api_endpoint: "",
    credits_per_use: 2,
    is_active: true,
    supports_img2img: true,
  });
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: modelsData } = await supabase
      .from("models")
      .select("*")
      .order("created_at");

    if (modelsData) setModels(modelsData);

    const { count: modelCount } = await supabase
      .from("models")
      .select("*", { count: "exact", head: true });

    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: genCount } = await supabase
      .from("generations")
      .select("*", { count: "exact", head: true });

    const { count: pendingCount } = await supabase
      .from("credit_recharges")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    setStats({
      models: modelCount || 0,
      users: userCount || 0,
      generations: genCount || 0,
      pendingRecharges: pendingCount || 0,
    });

    setLoading(false);
  };

  const openDialog = (model?: Model) => {
    if (model) {
      setEditingModel(model);
      setFormData({
        name: model.name,
        model_id: model.model_id,
        provider: model.provider,
        api_key: model.api_key || "",
        api_endpoint: model.api_endpoint,
        credits_per_use: model.credits_per_use,
        is_active: model.is_active,
        supports_img2img: model.supports_img2img,
      });
    } else {
      setEditingModel(null);
      setFormData({
        name: "",
        model_id: "",
        provider: "agnes",
        api_key: "",
        api_endpoint: "https://apihub.agnes-ai.com/v1/images/generations",
        credits_per_use: 2,
        is_active: true,
        supports_img2img: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingModel) {
      await supabase
        .from("models")
        .update(formData)
        .eq("id", editingModel.id);
    } else {
      await supabase.from("models").insert(formData);
    }
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个模型吗？")) return;
    await supabase.from("models").delete().eq("id", id);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">模型管理</h1>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          添加模型
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.models}</div>
                <div className="text-sm text-muted-foreground">模型总数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.users}</div>
                <div className="text-sm text-muted-foreground">用户总数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Image className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.generations}</div>
                <div className="text-sm text-muted-foreground">生成次数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <CreditCard className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.pendingRecharges}</div>
                <div className="text-sm text-muted-foreground">待审核充值</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Models Table */}
      <Card>
        <CardHeader>
          <CardTitle>模型列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">名称</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">模型 ID</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">供应商</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">积分/次</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">状态</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model) => (
                  <tr key={model.id} className="border-b">
                    <td className="py-3 px-4 font-medium">{model.name}</td>
                    <td className="py-3 px-4 text-muted-foreground font-mono text-sm">
                      {model.model_id}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground capitalize">
                      {model.provider}
                    </td>
                    <td className="py-3 px-4">{model.credits_per_use}</td>
                    <td className="py-3 px-4">
                      <Badge variant={model.is_active ? "default" : "secondary"}>
                        {model.is_active ? "启用" : "禁用"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openDialog(model)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(model.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingModel ? "编辑模型" : "添加模型"}</DialogTitle>
            <DialogDescription>
              {editingModel ? "修改模型配置" : "配置新的 AI 模型"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>名称</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如: Agnes Image 2.1 Flash"
              />
            </div>
            <div className="space-y-2">
              <Label>模型 ID</Label>
              <Input
                value={formData.model_id}
                onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
                placeholder="例如: agnes-image-2.1-flash"
              />
            </div>
            <div className="space-y-2">
              <Label>供应商</Label>
              <Select
                value={formData.provider}
                onValueChange={(v) => setFormData({ ...formData, provider: v as "agnes" | "sensenova" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agnes">Agnes AI</SelectItem>
                  <SelectItem value="sensenova">Sensenova</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                placeholder="输入 API Key"
              />
            </div>
            <div className="space-y-2">
              <Label>API 端点</Label>
              <Input
                value={formData.api_endpoint}
                onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>每次消耗积分</Label>
              <Input
                type="number"
                value={formData.credits_per_use}
                onChange={(e) => setFormData({ ...formData, credits_per_use: parseInt(e.target.value) || 1 })}
                min={1}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>启用状态</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>支持图生图</Label>
              <Switch
                checked={formData.supports_img2img}
                onCheckedChange={(v) => setFormData({ ...formData, supports_img2img: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
