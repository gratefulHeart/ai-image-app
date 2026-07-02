-- 用户注册审批功能迁移
-- 在 Supabase 控制台 → SQL Editor 中执行本文件。

-- 1) profiles 表新增审批状态字段(现有行会先默认为 pending)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- 2) 把所有已存在的用户设为已批准，避免锁住老账号(尤其管理员)
UPDATE public.profiles SET status = 'approved' WHERE status = 'pending';

-- 3) 更新新用户触发器：此后新注册的用户默认 pending，需管理员审批
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, credits, is_admin, status)
  VALUES (new.id, 100, false, 'pending');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
