"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Generation } from "@/lib/types";
import Link from "next/link";
import { ImageIcon } from "lucide-react";

export default function GalleryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchGenerations = async () => {
      const { data, error } = await supabase
        .from("generations")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) setGenerations(data);
      setLoading(false);
    };

    fetchGenerations();
  }, [supabase]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">作品画廊</h1>
          <p className="text-muted-foreground mt-2">
            浏览所有 AI 生成的精美作品
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground mt-4">加载中...</p>
          </div>
        ) : generations.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              暂无作品
            </h3>
            <p className="text-sm text-muted-foreground">
              成为第一个创作者吧！
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {generations.map((gen) => (
              <Link key={gen.id} href={`/gallery/${gen.id}`}>
                <Card className="break-inside-avoid overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-0">
                    <div className="relative">
                      <img
                        src={gen.image_url}
                        alt={gen.prompt}
                        className="w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-sm line-clamp-2">{gen.prompt}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs bg-white/20 text-white border-0">
                            {gen.model_name || gen.model_id}
                          </Badge>
                          <Badge variant="secondary" className="text-xs bg-white/20 text-white border-0">
                            {gen.width}×{gen.height}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
