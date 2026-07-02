-- Fix: infinite recursion (42P17) in RLS policies on "profiles".
-- Root cause: admin policies queried the same table they guard, so evaluating
-- the policy re-triggered the policy. The fix is a SECURITY DEFINER helper that
-- reads profiles with RLS bypassed, breaking the recursion. All admin checks
-- across tables now call public.is_admin() instead of an inline subquery.

-- 1) SECURITY DEFINER helper: runs as owner, bypasses RLS on profiles.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND is_admin = true
  );
$$;

-- 2) profiles: replace the recursive admin policies.
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (public.is_admin());

-- 3) models
DROP POLICY IF EXISTS "Admins can view all models" ON models;
CREATE POLICY "Admins can view all models" ON models
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert models" ON models;
CREATE POLICY "Admins can insert models" ON models
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update models" ON models;
CREATE POLICY "Admins can update models" ON models
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete models" ON models;
CREATE POLICY "Admins can delete models" ON models
  FOR DELETE USING (public.is_admin());

-- 4) generations
DROP POLICY IF EXISTS "Admins can view all generations" ON generations;
CREATE POLICY "Admins can view all generations" ON generations
  FOR SELECT USING (public.is_admin());

-- 5) credit_recharges
DROP POLICY IF EXISTS "Admins can view all recharges" ON credit_recharges;
CREATE POLICY "Admins can view all recharges" ON credit_recharges
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all recharges" ON credit_recharges;
CREATE POLICY "Admins can update all recharges" ON credit_recharges
  FOR UPDATE USING (public.is_admin());
