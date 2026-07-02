export interface Profile {
  user_id: string;
  credits: number;
  is_admin: boolean;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  email?: string;
}

export interface Model {
  id: string;
  name: string;
  model_id: string;
  provider: 'agnes' | 'sensenova';
  api_key?: string;
  api_endpoint: string;
  credits_per_use: number;
  is_active: boolean;
  supports_img2img: boolean;
  created_at: string;
}

export interface Generation {
  id: string;
  user_id: string;
  model_id: string;
  model_name?: string;
  prompt: string;
  image_url: string;
  reference_image_url?: string;
  width: number;
  height: number;
  credits_used: number;
  created_at: string;
}

export interface CreditRecharge {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  admin_note?: string;
  created_at: string;
  processed_at?: string;
}

export interface GenerateRequest {
  model_id: string;
  prompt: string;
  width: number;
  height: number;
  reference_image_url?: string;
  thinking_mode?: boolean;
  watermark?: boolean;
}

export interface GenerateResponse {
  image_url: string;
  credits_used: number;
  remaining_credits: number;
}

export type ImageSize = {
  label: string;
  value: string;
  width: number;
  height: number;
};

export const IMAGE_SIZES: ImageSize[] = [
  { label: '1:1', value: '1024x1024', width: 1024, height: 1024 },
  { label: '3:4', value: '768x1024', width: 768, height: 1024 },
  { label: '4:3', value: '1024x768', width: 1024, height: 768 },
  { label: '9:16', value: '576x1024', width: 576, height: 1024 },
  { label: '16:9', value: '1024x576', width: 1024, height: 576 },
];

export const GALLERY_CATEGORIES = [
  '全部', '风景', '人物', '动物', '建筑', '动漫', '科幻', '油画', '产品'
];
