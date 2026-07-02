"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Generation } from "@/lib/types";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, ArrowRight, Image as ImageIcon } from "lucide-react";

const CATEGORIES = ["全部", "风景", "人物", "动物", "建筑", "动漫", "科幻", "油画", "产品"];

export default function HomePage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [stats, setStats] = useState({ totalImages: 0, totalUsers: 0, totalModels: 0 });
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: gens } = await supabase
        .from("generations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (gens) setGenerations(gens);

      const { count: imageCount } = await supabase
        .from("generations")
        .select("*", { count: "exact", head: true });

      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: modelCount } = await supabase
        .from("models")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      setStats({
        totalImages: imageCount || 0,
        totalUsers: userCount || 0,
        totalModels: modelCount || 0,
      });
    };

    fetchData();
  }, [supabase]);

  const filteredGenerations = selectedCategory === "全部"
    ? generations
    : generations.filter((g) => {
        // Simple keyword matching for demo
        const prompt = g.prompt.toLowerCase();
        const categoryKeywords: Record<string, string[]> = {
          "风景": ["landscape", "mountain", "sea", "sunset", "sunrise", "nature", "sky", "风景", "山", "海"],
          "人物": ["person", "girl", "boy", "woman", "man", "portrait", "人物", "女", "男"],
          "动物": ["animal", "cat", "dog", "bird", "lion", "tiger", "动物", "猫", "狗"],
          "建筑": ["building", "house", "city", "architecture", "建筑", "城市", "楼"],
          "动漫": ["anime", "manga", "cartoon", "动漫", "二次元"],
          "科幻": ["sci-fi", "cyberpunk", "futuristic", "space", "科幻", "未来", "太空"],
          "油画": ["oil painting", "painting", "art", "油画", "画"],
          "产品": ["product", "phone", "laptop", "headphone", "产品", "耳机"],
        };
        const keywords = categoryKeywords[selectedCategory] || [];
        return keywords.some((kw) => prompt.includes(kw));
      });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              用 AI 创造无限可能
            </h1>
            <p className="text-lg text-indigo-200 mb-8">
              输入文字，让 AI 为你生成精美图片
            </p>
            <Link href="/generate">
              <Button size="lg" className="bg-white text-indigo-900 hover:bg-indigo-50">
                开始创作
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <div className="flex justify-center gap-12 mt-10 text-indigo-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.totalImages.toLocaleString()}</div>
                <div className="text-sm">张作品</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</div>
                <div className="text-sm">位创作者</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.totalModels}</div>
                <div className="text-sm">个 AI 模型</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 py-4 overflow-x-auto">
            {CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {filteredGenerations.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              暂无作品
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              成为第一个创作者吧！
            </p>
            <Link href="/generate">
              <Button>
                <Sparkles className="mr-2 h-4 w-4" />
                开始创作
              </Button>
            </Link>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {filteredGenerations.map((gen) => (
              <Link key={gen.id} href={`/gallery/${gen.id}`}>
                <Card className="break-inside-avoid overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-0">
                    <div className="relative aspect-square">
                      <img
                        src={gen.image_url}
                        alt={gen.prompt}
                        className="w-full h-full object-cover"
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

      {/* Footer */}
      <footer className="border-t bg-background py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 AI 生图 · 用 AI 创造无限可能
        </div>
      </footer>
    </div>
  );
}
