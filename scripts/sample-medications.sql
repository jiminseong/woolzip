-- Sample medications for testing
-- Run this after creating a user to set up test medications

-- Example: Insert medications for the current user
-- Replace the user_id with actual user ID

-- Insert sample medications
INSERT INTO public.medications (user_id, name, times, is_active) VALUES
  ((SELECT id FROM public.users LIMIT 1), '고혈압약', ARRAY['morning', 'evening'], true),
  ((SELECT id FROM public.users LIMIT 1), '비타민 D', ARRAY['morning'], true),
  ((SELECT id FROM public.users LIMIT 1), '종합비타민', ARRAY['noon'], true);

-- Create indexes if not exists
CREATE INDEX IF NOT EXISTS idx_medications_user_active 
ON public.medications (user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_med_logs_user_date 
ON public.med_logs (user_id, DATE(taken_at));

-- Enable RLS policies if not already enabled
-- (These are already in rls-policies.sql but adding as reminder)

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can manage own medications" ON public.medications
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.med_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Family members can view med logs" ON public.med_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = med_logs.family_id AND fm.user_id = auth.uid() AND fm.is_active = true
    )
  );

CREATE POLICY IF NOT EXISTS "Users can insert own med logs" ON public.med_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);