-- Add notification token to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_token TEXT;
