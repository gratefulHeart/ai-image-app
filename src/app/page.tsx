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

// 每个分类对应的假数据 prompt 模板
const DEMO_PROMPTS: Record<string, string[]> = {
  "风景": ["壮丽的山脉景观", "宁静的海边日落", "迷雾森林风景", "极光夜空景观", "辽阔草原风景", "瀑布山水风景", "雪山风景", "秋日森林风景", "海岸线风景", "湖泊倒影风景"],
  "人物": ["优雅的少女肖像", "帅气的少年", "老人肖像人物", "舞者女孩", "都市女性人物", "儿童人物写真", "情侣人物", "瑜伽人物", "街头人物", "职业人物肖像"],
  "动物": ["慵懒的猫", "奔跑的狗", "展翅的鸟", "森林里的狐狸", "草原狮子", "海中鲸鱼", "树上松鼠", "花园蝴蝶", "宠物狗", "野生动物"],
  "建筑": ["现代城市建筑", "古老城堡建筑", "东京塔建筑", "摩天大楼建筑", "故宫建筑", "教堂建筑", "桥梁建筑", "图书馆建筑", "剧院建筑", "现代别墅建筑"],
  "动漫": ["动漫风格少女", "机甲战士动漫", "奇幻世界动漫", "动漫风景", "魔法少女动漫", "热血动漫", "治愈系动漫", "校园动漫", "幻想动漫", "蒸汽朋克动漫"],
  "科幻": ["赛博朋克城市科幻", "太空站科幻", "未来都市科幻", "外星世界科幻", "机器人科幻", "星际飞船科幻", "虚拟现实科幻", "时间机器科幻", "反重力城市科幻", "全息影像科幻"],
  "油画": ["油画风景艺术", "抽象油画", "古典人物油画", "印象派油画", "静物油画", "风景油画写生", "花卉油画", "肖像油画", "海景油画", "田园油画"],
  "产品": ["智能手机产品", "高端耳机产品", "笔记本电脑", "时尚手表产品", "运动鞋产品", "相机产品", "蓝牙音箱产品", "智能手表产品", "机械键盘产品", "电竞鼠标产品"],
};

const DEMO_GENERATIONS: Generation[] = Array.from({ length: 100 }, (_, i) => {
  const cats = CATEGORIES.slice(1); // 去掉 "全部"
  const cat = cats[i % cats.length];
  const prompts = DEMO_PROMPTS[cat];
  const prompt = `${prompts[i % prompts.length]} #demo${Math.floor(i / cats.length) + 1}`;
  return {
    id: `demo-${i + 1}`,
    user_id: "demo",
    model_id: "demo",
    model_name: "Agnes 2.1 Flash",
    prompt,
    image_url: `https://picsum.photos/seed/demo${1001 + i}/600/600`,
    width: 1024,
    height: 1024,
    credits_used: 1,
    created_at: new Date(2025, 0, i + 1).toISOString(),
  };
});

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

      // 不足 100 时显示 100，真实数据超过 100 后显示真实值
      setStats({
        totalImages: Math.max(100, imageCount || 0),
        totalUsers: Math.max(100, userCount || 0),
        totalModels: modelCount || 0,
      });
    };

    fetchData();
  }, [supabase]);

  // 真实数据在前，假数据在后
  const allGenerations = [...generations, ...DEMO_GENERATIONS];

  const filteredGenerations = selectedCategory === "全部"
    ? allGenerations
    : allGenerations.filter((g) => {
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
            {filteredGenerations.map((gen) => {
              const isDemo = gen.id.startsWith("demo-");
              const card = (
                <Card className={`break-inside-avoid overflow-hidden transition-shadow cursor-pointer group ${isDemo ? "" : "hover:shadow-lg"}`}>
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
              );
              return isDemo ? (
                <div key={gen.id} className="break-inside-avoid">{card}</div>
              ) : (
                <Link key={gen.id} href={`/gallery/${gen.id}`}>{card}</Link>
              );
            })}
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