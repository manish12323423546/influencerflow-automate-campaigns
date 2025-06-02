-- Create campaign_settings table
CREATE TABLE IF NOT EXISTS campaign_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  platform VARCHAR NOT NULL,
  min_followers INTEGER NOT NULL DEFAULT 0,
  max_engagement_rate DECIMAL NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE campaign_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own campaign settings"
  ON campaign_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_settings.campaign_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create settings for their own campaigns"
  ON campaign_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_settings.campaign_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own campaign settings"
  ON campaign_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_settings.campaign_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own campaign settings"
  ON campaign_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_settings.campaign_id
      AND c.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_campaign_settings_updated_at
  BEFORE UPDATE ON campaign_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes
CREATE INDEX campaign_settings_campaign_id_idx ON campaign_settings(campaign_id);
CREATE INDEX campaign_settings_platform_idx ON campaign_settings(platform);

-- Add foreign key constraint with cascade delete
ALTER TABLE campaign_settings
  ADD CONSTRAINT fk_campaign_settings_campaign
  FOREIGN KEY (campaign_id)
  REFERENCES campaigns(id)
  ON DELETE CASCADE; 