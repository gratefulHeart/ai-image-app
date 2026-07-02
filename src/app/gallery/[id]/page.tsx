"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Generation } from "@/lib/types";
import { Download, Trash2, ArrowLeft, Clock, Cpu, Maximize } from "lucide-react";

export default function GalleryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchGeneration = async () => {
      const { data, error } = await supabase
        .from("generations")
        .select("*")
        .eq("id", params.id)
        .single();

      if (data) setGeneration(data);
      setLoading(false);
    };

    fetchGeneration();
  }, [supabase, params.id]);

  const handleDownload = () => {
    if (!generation?.image_url) return;
    const link = document.createElement("a");
    link.href = generation.image_url;
    link.download = `ai-image-${generation.id}.png`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async () => {
    if (!generation) return;
    if (!confirm("确定要删除这张图片吗？")) return;

    setDeleting(true);
    const { error } = await supabase
      .from("generations")
      .delete()
      .eq("id", generation.id);

    if (!error) {
      router.push("/gallery");
    }
    setDeleting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!generation) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">作品不存在</h2>
            <p className="text-muted-foreground mb-4">该作品可能已被删除</p>
            <Button onClick={() => router.push("/gallery")}>返回画廊</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.push("/gallery")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回画廊
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Image Preview */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <img
                  src={generation.image_url}
                  alt={generation.prompt}
                  className="w-full rounded-lg"
                />
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">作品详情</h1>
            </div>

            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Prompt</Label>
                  <p className="mt-1">{generation.prompt}</p>
                </div>

                <Separator />

                <div className="flex items-center gap-2 text-sm">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">模型:</span>
                  <Badge variant="secondary">
                    {generation.model_name || generation.model_id}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Maximize className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">尺寸:</span>
                  <span>{generation.width} × {generation.height}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">创建时间:</span>
                  <span>{new Date(generation.created_at).toLocaleString("zh-CN")}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">消耗积分:</span>
                  <Badge variant="outline">{generation.credits_used}</Badge>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={handleDownload} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                下载图片
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`text-sm font-medium ${className || ""}`}>
      {children}
    </div>
  );
}
