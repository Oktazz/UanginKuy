-- Jalankan setelah 2026-07-30-01-add-super-admin-enum.sql berhasil.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION private.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'super_admin'
  );
$$;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.is_super_admin() TO authenticated;

-- Arahkan seluruh policy admin yang sudah ada ke helper private.
ALTER POLICY "Admins can view all profiles" ON public.profiles
  USING (private.is_admin());
ALTER POLICY "Admins can update all profiles" ON public.profiles
  USING (private.is_admin())
  WITH CHECK (private.is_admin());
ALTER POLICY "Users can update own profile" ON public.profiles
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);
ALTER POLICY "Admins can manage all addresses" ON public.user_addresses
  USING (private.is_admin())
  WITH CHECK (private.is_admin());
ALTER POLICY "Admins can insert waste categories" ON public.waste_categories
  WITH CHECK (private.is_admin());
ALTER POLICY "Admins can update waste categories" ON public.waste_categories
  USING (private.is_admin())
  WITH CHECK (private.is_admin());
ALTER POLICY "Admins can delete waste categories" ON public.waste_categories
  USING (private.is_admin());
ALTER POLICY "Everyone can view active schedules" ON public.schedules
  USING (is_active = TRUE OR private.is_admin());
ALTER POLICY "Admins can manage schedules" ON public.schedules
  USING (private.is_admin())
  WITH CHECK (private.is_admin());
ALTER POLICY "Admins can view all tickets" ON public.tickets
  USING (private.is_admin());
ALTER POLICY "Admins can manage tickets" ON public.tickets
  USING (private.is_admin())
  WITH CHECK (private.is_admin());
ALTER POLICY "Users can view own transaction details" ON public.transaction_details
  USING (
    EXISTS (
      SELECT 1
      FROM public.tickets t
      WHERE t.id = transaction_details.ticket_id
        AND (
          t.client_id = (SELECT auth.uid())
          OR t.courier_id = (SELECT auth.uid())
          OR private.is_admin()
        )
    )
  );
ALTER POLICY "Admins can manage transaction details" ON public.transaction_details
  USING (private.is_admin())
  WITH CHECK (private.is_admin());
ALTER POLICY "Admins can manage withdrawals" ON public.withdrawals
  USING (private.is_admin())
  WITH CHECK (private.is_admin());
ALTER POLICY "Admins can manage iot devices" ON public.iot_devices
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- Pengguna hanya boleh mengubah data profil biasa. Role dan balance tetap server-only.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (name, avatar_url, phone_number, address, updated_at)
  ON public.profiles TO authenticated;

-- Pengaturan aplikasi dapat dibaca admin, tetapi hanya diubah super admin.
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can view app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Super admins can insert app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Super admins can update app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Super admins can delete app settings" ON public.app_settings;

CREATE POLICY "Admins can view app settings"
  ON public.app_settings FOR SELECT TO authenticated
  USING (private.is_admin());
CREATE POLICY "Super admins can insert app settings"
  ON public.app_settings FOR INSERT TO authenticated
  WITH CHECK (private.is_super_admin());
CREATE POLICY "Super admins can update app settings"
  ON public.app_settings FOR UPDATE TO authenticated
  USING (private.is_super_admin())
  WITH CHECK (private.is_super_admin());
CREATE POLICY "Super admins can delete app settings"
  ON public.app_settings FOR DELETE TO authenticated
  USING (private.is_super_admin());

-- Audit trail untuk aksi sensitif.
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.audit_logs FROM anon, authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT INSERT ON public.audit_logs TO service_role;

DROP POLICY IF EXISTS "Super admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Super admins can view audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (private.is_super_admin());

-- Seluruh policy sudah dipindahkan; helper lama tidak lagi boleh diekspos.
DROP FUNCTION IF EXISTS public.is_admin();
