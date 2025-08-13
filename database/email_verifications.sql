-- Create email_verifications table
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_code ON email_verifications(code);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);

-- Enable Row Level Security (RLS)
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow insert for email verification" ON email_verifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select for email verification" ON email_verifications
  FOR SELECT USING (true);

CREATE POLICY "Allow update for email verification" ON email_verifications
  FOR UPDATE USING (true);

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_verifications_updated_at
  BEFORE UPDATE ON email_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
