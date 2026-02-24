-- Migration: Notification System
-- Implements table for scheduling and recording notifications

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  is_sent BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Optional: type of notification (e.g., 'announcement', 'reminder')
  type TEXT DEFAULT 'announcement'
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. Anyone (authenticated) can view notifications (for history)
-- We only show notifications that have been sent or are public
CREATE POLICY "Public notifications are viewable by everyone."
ON public.notifications FOR SELECT
USING (is_sent = true OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
));

-- 2. Only Admins can insert/update/delete notifications
CREATE POLICY "Admins can manage notifications."
ON public.notifications FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Add index for performance on scheduling
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON public.notifications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_sent ON public.notifications(is_sent);
