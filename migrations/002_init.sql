-- ⚠️ Drop everything (order matters because of dependencies)
DROP TRIGGER IF EXISTS set_timestamp_bookings ON bookings;

DROP TRIGGER IF EXISTS set_timestamp_slots ON slots;

DROP TRIGGER IF EXISTS set_timestamp_branches ON branches;

DROP FUNCTION IF EXISTS update_updated_at_column ();

DROP TABLE IF EXISTS bookings CASCADE;

DROP TABLE IF EXISTS slots CASCADE;

DROP TABLE IF EXISTS branches CASCADE;

DROP TYPE IF EXISTS booking_status;

CREATE TYPE provinces AS ENUM (
  'EASTERN CAPE',
  'FREE STATE',
  'GAUTENG',
  'KWAZULU-NATAL',
  'LIMPOPO',
  'MPUMALANGA',
  'NORTHERN CAPE',
  'NORTH WEST',
  'WESTERN CAPE'
);

-- =====================================================
-- Branches Table
-- =====================================================
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    province provinces NOT NULL,
    timezone TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (name, address) -- prevent duplicates
);

CREATE INDEX idx_branches_province ON branches (province);

-- =====================================================
-- Slots Table
-- =====================================================
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

-- Index for slot lookups by branch/date
CREATE INDEX idx_slots_branch_date ON slots (branch_id, start_time);

-- =====================================================
-- Booking Status Enum
-- =====================================================
CREATE TYPE booking_status AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED', 'EXPIRED');

-- =====================================================
-- Bookings Table
-- =====================================================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    slot_id UUID NOT NULL REFERENCES slots (id) ON DELETE CASCADE,
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    service_type TEXT NOT NULL, -- new column
    meta JSONB,
    status booking_status NOT NULL, -- explicitly set on insert
    confirmed_at TIMESTAMP DEFAULT NOW(), -- optional, auto-populated
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (slot_id), -- one booking per slot
    CONSTRAINT unique_active_booking_per_email UNIQUE (customer_email, status) DEFERRABLE INITIALLY IMMEDIATE
    -- check this constraint right away by default, but allow me to defer it until the end of the transaction if I need to
);

-- Indexes for performance
CREATE INDEX idx_bookings_customer ON bookings (customer_email);

CREATE INDEX idx_bookings_status ON bookings (status);

-- =====================================================
-- Trigger for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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