import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { generateImage, uploadImageToStorage } from "@/lib/ai-providers";
import { Model } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { model_id, prompt, width, height, reference_image_url } = body;

    if (!model_id || !prompt) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // Get model details
    const { data: model, error: modelError } = await supabase
      .from("models")
      .select("*")
      .eq("id", model_id)
      .single();

    if (modelError || !model) {
      return NextResponse.json({ error: "模型不存在" }, { status: 404 });
    }

    // Get user profile and check credits
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    if (profile.credits < model.credits_per_use) {
      return NextResponse.json({ error: "积分不足，请充值后再试" }, { status: 400 });
    }

    // Generate image
    const result = await generateImage({
      model: model as Model,
      prompt,
      width,
      height,
      reference_image_url,
    });

    let imageUrl = result.url;

    // If we got base64, upload to storage
    if (!imageUrl && result.b64_json) {
      const fileName = `${user.id}/${Date.now()}.png`;
      imageUrl = await uploadImageToStorage(result.b64_json, fileName);
    }

    if (!imageUrl) {
      return NextResponse.json({ error: "生成失败，未获取到图片" }, { status: 500 });
    }

    // Deduct credits
    const { error: deductError } = await supabase
      .from("profiles")
      .update({ credits: profile.credits - model.credits_per_use })
      .eq("user_id", user.id);

    if (deductError) {
      console.error("Failed to deduct credits:", deductError);
    }

    // Save generation record
    const { data: generation, error: genError } = await supabase
      .from("generations")
      .insert({
        user_id: user.id,
        model_id: model.model_id,
        model_name: model.name,
        prompt,
        image_url: imageUrl,
        reference_image_url,
        width,
        height,
        credits_used: model.credits_per_use,
      })
      .select()
      .single();

    if (genError) {
      console.error("Failed to save generation:", genError);
    }

    return NextResponse.json({
      generation,
      remaining_credits: profile.credits - model.credits_per_use,
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成失败" },
      { status: 500 }
    );
  }
}
