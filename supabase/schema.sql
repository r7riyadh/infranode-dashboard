-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Assets Table
CREATE TABLE IF NOT EXISTS assets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    asset_tag TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Server', 'Network', 'Storage', 'Power', 'Workstation', 'Laptop', 'Security / Firewall', 'Cloud / Virtual', 'Peripheral', 'Software License')),
    status TEXT NOT NULL CHECK (status IN ('Active', 'Warning', 'Critical', 'Decommissioned')),
    location TEXT NOT NULL,
    purchase_date DATE,
    purchase_cost NUMERIC(10, 2),
    depreciation_rate NUMERIC(5, 2),
    current_value NUMERIC(10, 2),
    assigned_to TEXT,
    last_maintenance DATE,
    end_of_life DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Telemetry Table
CREATE TABLE IF NOT EXISTS telemetry (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    threshold_warning NUMERIC(10, 2),
    threshold_critical NUMERIC(10, 2),
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Action Logs Table
CREATE TABLE IF NOT EXISTS action_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    action_type TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    related_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Asset Requests Table
CREATE TABLE IF NOT EXISTS asset_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    requested_by TEXT NOT NULL,
    item_description TEXT NOT NULL,
    reason TEXT NOT NULL,
    urgency TEXT NOT NULL CHECK (urgency IN ('Low', 'Medium', 'High', 'Critical')),
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Fulfilled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_assets_modtime
    BEFORE UPDATE ON assets
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_requests ENABLE ROW LEVEL SECURITY;

-- Allow public/anon access for the demo environment
CREATE POLICY "Enable all operations for anon users on assets" ON assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for anon users on telemetry" ON telemetry FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for anon users on action_logs" ON action_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for anon users on asset_requests" ON asset_requests FOR ALL USING (true) WITH CHECK (true);
