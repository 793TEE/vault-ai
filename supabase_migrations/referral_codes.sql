-- Create referral_codes table for managing promotional discount codes
-- Run this in your Supabase SQL Editor if you want to use the referral codes feature

CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  discount_months INTEGER NOT NULL CHECK (discount_months > 0),
  max_uses INTEGER CHECK (max_uses > 0),
  current_uses INTEGER DEFAULT 0 CHECK (current_uses >= 0),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create index on code for fast lookups
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);

-- Create index on active status
CREATE INDEX IF NOT EXISTS idx_referral_codes_active ON referral_codes(active);

-- Add RLS policies (admin-only access)
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins to read all codes
CREATE POLICY "Admins can read referral codes"
  ON referral_codes
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      'infohissecretvault23@gmail.com'
      -- Add more admin emails here as needed
    )
  );

-- Policy: Allow admins to insert codes
CREATE POLICY "Admins can insert referral codes"
  ON referral_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'email' IN (
      'infohissecretvault23@gmail.com'
      -- Add more admin emails here as needed
    )
  );

-- Policy: Allow admins to update codes
CREATE POLICY "Admins can update referral codes"
  ON referral_codes
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      'infohissecretvault23@gmail.com'
      -- Add more admin emails here as needed
    )
  );

-- Policy: Allow admins to delete codes
CREATE POLICY "Admins can delete referral codes"
  ON referral_codes
  FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      'infohissecretvault23@gmail.com'
      -- Add more admin emails here as needed
    )
  );

-- Insert sample referral codes
INSERT INTO referral_codes (code, discount_percent, discount_months, max_uses, active) VALUES
  ('VAULT2024', 20, 3, NULL, true),
  ('HSVPREMIUM', 25, 6, 100, true),
  ('LAUNCH50', 50, 1, 50, true)
ON CONFLICT (code) DO NOTHING;

-- Add a function to automatically increment current_uses when a code is applied
CREATE OR REPLACE FUNCTION increment_referral_code_uses(referral_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE referral_codes
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE code = referral_code
    AND active = true
    AND (max_uses IS NULL OR current_uses < max_uses)
    AND (expires_at IS NULL OR expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to validate if a referral code is valid
CREATE OR REPLACE FUNCTION validate_referral_code(referral_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  code_record referral_codes%ROWTYPE;
BEGIN
  SELECT * INTO code_record
  FROM referral_codes
  WHERE code = referral_code;

  -- Code doesn't exist
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Code is inactive
  IF NOT code_record.active THEN
    RETURN false;
  END IF;

  -- Code has expired
  IF code_record.expires_at IS NOT NULL AND code_record.expires_at < NOW() THEN
    RETURN false;
  END IF;

  -- Code has reached max uses
  IF code_record.max_uses IS NOT NULL AND code_record.current_uses >= code_record.max_uses THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to get referral code details
CREATE OR REPLACE FUNCTION get_referral_code_details(referral_code TEXT)
RETURNS TABLE (
  discount_percent INTEGER,
  discount_months INTEGER,
  valid BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.discount_percent,
    rc.discount_months,
    validate_referral_code(referral_code) as valid
  FROM referral_codes rc
  WHERE rc.code = referral_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE referral_codes IS 'Promotional referral codes for discounted subscriptions';
COMMENT ON FUNCTION increment_referral_code_uses IS 'Increments the usage count of a referral code when applied';
COMMENT ON FUNCTION validate_referral_code IS 'Checks if a referral code is valid and can be used';
COMMENT ON FUNCTION get_referral_code_details IS 'Returns the discount details for a referral code';
