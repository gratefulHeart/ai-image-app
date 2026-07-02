"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Model, Generation, IMAGE_SIZES } from "@/lib/types";
import { Loader2, Download, RefreshCw, Upload, X, Sparkles } from "lucide-react";

// Short one-line characteristic per model, shown in the model picker.
// Keyed by model_id, with a provider-level fallback for newly added models.
const MODEL_TAGLINES: Record<string, string> = {
  "agnes-image-2.1-flash": "旗舰画质，细节丰富，出图更快",
  "agnes-image-2.0-flash": "均衡稳定，通用场景首选",
  "sensenova-u1-fast": "极速生成，适合快速草稿与灵感尝试",
};
const PROVIDER_TAGLINES: Record<string, string> = {
  agnes: "Agnes 文生图 / 图生图模型",
  sensenova: "商汤日日新图像模型",
};
function modelTagline(model: Model): string {
  return MODEL_TAGLINES[model.model_id] || PROVIDER_TAGLINES[model.provider] || "";
}

export default function GeneratePage() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedSize, setSelectedSize] = useState(IMAGE_SIZES[0]);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null);
  const [thinkingMode, setThinkingMode] = useState(false);
  const [watermark, setWatermark] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<Generation | null>(null);
  const [error, setError] = useState("");
  const [credits, setCredits] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits")
          .eq("user_id", user.id)
          .single();
        if (profile) setCredits(profile.credits);
      }

      const { data: modelsData } = await supabase
        .from("models")
        .select("*")
        .eq("is_active", true)
        .order("created_at");

      if (modelsData) {
        setModels(modelsData);
        if (modelsData.length > 0) {
          setSelectedModel(modelsData[0]);
        }
      }
    };

    fetchData();
  }, [supabase]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setReferenceImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReferenceImage = () => {
    setReferenceImage(null);
    setReferenceImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!selectedModel || !prompt.trim()) return;

    if (credits < selectedModel.credits_per_use) {
      setError("积分不足，请充值后再试");
      return;
    }

    setGenerating(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_id: selectedModel.id,
          prompt: prompt.trim(),
          width: selectedSize.width,
          height: selectedSize.height,
          reference_image_url: referenceImage,
          thinking_mode: thinkingMode,
          watermark: watermark,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "生成失败");
      }

      setResult(data.generation);
      setCredits(data.remaining_credits);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败，请重试");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!result?.image_url) return;
    const link = document.createElement("a");
    link.href = result.image_url;
    link.download = `ai-image-${result.id}.png`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Panel */}
        <div className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r p-4 space-y-6 bg-card">
          {/* Model Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">模型选择</Label>
            <div className="space-y-2">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedModel?.id === model.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  <div className="font-medium text-sm">{model.name}</div>
                  <div className={`text-xs mt-0.5 ${selectedModel?.id === model.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {modelTagline(model)}
                  </div>
                  <div className={`text-xs ${selectedModel?.id === model.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {model.credits_per_use} 积分/次
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Reference Image Upload */}
          <div>
            <Label className="text-sm font-medium mb-3 block">参考图 (图生图)</Label>
            {referenceImage ? (
              <div className="relative">
                <img
                  src={referenceImage}
                  alt="参考图"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={removeReferenceImage}
                  className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Upload className="h-6 w-6 mb-2" />
                <span className="text-sm">点击或拖拽上传</span>
                <span className="text-xs">支持 JPG/PNG</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          <Separator />

          {/* Size Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">尺寸</Label>
            <div className="flex flex-wrap gap-2">
              {IMAGE_SIZES.map((size) => (
                <button
                  key={size.value}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    selectedSize.value === size.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Advanced Options */}
          <div>
            <Label className="text-sm font-medium mb-3 block">高级选项</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="thinking" className="text-sm">思考模式</Label>
                <Switch
                  id="thinking"
                  checked={thinkingMode}
                  onCheckedChange={setThinkingMode}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="watermark" className="text-sm">水印</Label>
                <Switch
                  id="watermark"
                  checked={watermark}
                  onCheckedChange={setWatermark}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col p-4">
          {/* Preview Area */}
          <Card className="flex-1 mb-4">
            <CardContent className="h-full flex items-center justify-center p-6">
              {generating ? (
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">正在生成图片...</p>
                </div>
              ) : result ? (
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={result.image_url}
                    alt="生成的图片"
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>生成结果将显示在这里</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {result && (
            <div className="flex gap-2 mb-4">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                下载
              </Button>
              <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                <RefreshCw className="mr-2 h-4 w-4" />
                重新生成
              </Button>
            </div>
          )}

          {/* Prompt Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Prompt</Label>
              <Badge variant="secondary">
                剩余 {credits} 积分
              </Badge>
            </div>
            <Textarea
              placeholder="输入图片描述，例如：赛博朋克风格的未来城市，霓虹灯，雨夜街道..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim() || !selectedModel}
            className="w-full mt-4 h-12 text-lg"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                生成图片
                {selectedModel && (
                  <span className="ml-2 text-sm opacity-80">
                    -{selectedModel.credits_per_use} 积分
                  </span>
                )}
              </>
            )}
          </Button>

          {error && (
            <div className="mt-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
