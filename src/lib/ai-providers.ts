import { Model } from './types';

interface GenerateImageParams {
  model: Model;
  prompt: string;
  width: number;
  height: number;
  reference_image_url?: string;
}

interface GenerateImageResult {
  url: string | null;
  b64_json: string | null;
}

export async function generateImage(params: GenerateImageParams): Promise<GenerateImageResult> {
  const { model, prompt, width, height, reference_image_url } = params;

  if (!model.api_key) {
    throw new Error('API key not configured for this model');
  }

  const size = `${width}x${height}`;

  if (model.provider === 'agnes') {
    return generateWithAgnes(model, prompt, size, reference_image_url);
  } else if (model.provider === 'sensenova') {
    return generateWithSensenova(model, prompt, size, reference_image_url);
  }

  throw new Error(`Unknown provider: ${model.provider}`);
}

async function generateWithAgnes(
  model: Model,
  prompt: string,
  size: string,
  reference_image_url?: string
): Promise<GenerateImageResult> {
  const body: Record<string, unknown> = {
    model: model.model_id,
    prompt,
    size,
    extra_body: {
      response_format: 'url',
    },
  };

  if (reference_image_url) {
    (body.extra_body as Record<string, unknown>).image = [reference_image_url];
  }

  const response = await fetch(model.api_endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${model.api_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Agnes API error: ${error}`);
  }

  const data = await response.json();
  return {
    url: data.data?.[0]?.url || null,
    b64_json: data.data?.[0]?.b64_json || null,
  };
}

async function generateWithSensenova(
  model: Model,
  prompt: string,
  size: string,
  reference_image_url?: string
): Promise<GenerateImageResult> {
  const body: Record<string, unknown> = {
    model: model.model_id,
    prompt,
    size,
  };

  if (reference_image_url) {
    body.image = [reference_image_url];
  }

  const response = await fetch(model.api_endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${model.api_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Sensenova API error: ${error}`);
  }

  const data = await response.json();
  return {
    url: data.data?.[0]?.url || null,
    b64_json: data.data?.[0]?.b64_json || null,
  };
}

export async function uploadImageToStorage(
  b64Data: string,
  fileName: string
): Promise<string> {
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const buffer = Buffer.from(b64Data, 'base64');
  const { data, error } = await supabase.storage
    .from('generated-images')
    .upload(fileName, buffer, {
      contentType: 'image/png',
    });

  if (error) {
    throw new Error(`Storage upload error: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('generated-images')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}
