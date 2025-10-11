-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Branches Table
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    timezone TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (name, address) -- prevent duplicates
);

-- 2. Slots Table
CREATE TABLE slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    branch_id UUID NOT NULL REFERENCES branches (id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (
        branch_id,
        start_time,
        end_time
    ),
    CHECK (end_time > start_time) -- ensure valid slot ranges
);

-- Index to speed up slot lookups by branch + date
CREATE INDEX idx_slots_branch_date ON slots (branch_id, start_time);

-- 3. Booking Status Enum
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- 4. Bookings Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    slot_id UUID NOT NULL REFERENCES slots (id) ON DELETE CASCADE,
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    meta JSONB,
    status booking_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (slot_id) -- prevents double booking
);

-- Indexes for faster queries
CREATE INDEX idx_bookings_customer ON bookings (customer_email);

CREATE INDEX idx_bookings_status ON bookings (status);

-- 5. Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER set_timestamp_branches
BEFORE UPDATE ON branches
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp_slots
BEFORE UPDATE ON slots
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp_bookings
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();