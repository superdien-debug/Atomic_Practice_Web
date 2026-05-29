-- Migration: Create Admin Audit Logs and Secure Admin RPC Functions
-- Created: 2026-05-29

-- Enable pgcrypto extension for crypt() password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on audit logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only Admins can view audit logs
DROP POLICY IF EXISTS "Admins can select audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can select audit logs"
ON public.admin_audit_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 2. Create RPC function to update user role securely
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
    p_user_id UUID,
    p_new_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_caller_role TEXT;
    v_old_role TEXT;
BEGIN
    -- Check if caller is admin
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
    IF v_caller_role IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'Access Denied: Only admins can change user roles.';
    END IF;

    -- Get old role
    SELECT role INTO v_old_role FROM public.profiles WHERE id = p_user_id;

    -- Update role in profiles
    UPDATE public.profiles
    SET role = p_new_role,
        updated_at = now()
    WHERE id = p_user_id;

    -- Log the action
    INSERT INTO public.admin_audit_logs (admin_id, action, target_user_id, details)
    VALUES (
        auth.uid(),
        'update_role',
        p_user_id,
        jsonb_build_object('old_role', v_old_role, 'new_role', p_new_role)
    );
END;
$$;

-- 3. Create RPC function to reset user password securely
CREATE OR REPLACE FUNCTION public.admin_reset_user_password(
    p_user_id UUID,
    p_new_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_caller_role TEXT;
BEGIN
    -- Check if caller is admin
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
    IF v_caller_role IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'Access Denied: Only admins can reset user passwords.';
    END IF;

    -- Update encrypted password in auth.users
    UPDATE auth.users
    SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = p_user_id;

    -- Log the action
    INSERT INTO public.admin_audit_logs (admin_id, action, target_user_id, details)
    VALUES (
        auth.uid(),
        'reset_password',
        p_user_id,
        jsonb_build_object('action', 'reset_password_manual')
    );
END;
$$;
