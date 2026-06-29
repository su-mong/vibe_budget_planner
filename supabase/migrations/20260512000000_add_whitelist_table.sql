-- Create whitelist table
CREATE TABLE IF NOT EXISTS public.whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.whitelist ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read the whitelist
CREATE POLICY "Allow authenticated users to read whitelist"
ON public.whitelist
FOR SELECT
TO authenticated
USING (true);

-- Insert initial authorized email (optional, based on user preference)
-- Note: Replace with actual email if known, or leave commented for manual entry.
-- INSERT INTO public.whitelist (email) VALUES ('your_email@example.com');
