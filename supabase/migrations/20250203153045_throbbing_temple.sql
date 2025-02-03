/*
  # Initial Schema Setup for Hotel Management System

  1. New Tables
    - `guests`
      - Primary guest information table
      - Stores contact details and preferences
    - `bookings`
      - Booking records linked to guests and rooms
      - Tracks check-in/out dates and payment status
    - `notifications`
      - System notifications for various events
      - Tracks read status and related metadata

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  address text,
  city text,
  country text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid REFERENCES guests(id) NOT NULL,
  room_type text NOT NULL,
  room_number text NOT NULL,
  check_in timestamptz NOT NULL,
  check_out timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  total_amount decimal(10,2) NOT NULL,
  payment_status text NOT NULL CHECK (payment_status IN ('paid', 'pending', 'partial')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('booking_created', 'booking_modified', 'booking_cancelled', 'guest_created', 'payment_received')),
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for guests table
CREATE POLICY "Allow authenticated users to read guests"
  ON guests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert guests"
  ON guests FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update guests"
  ON guests FOR UPDATE TO authenticated USING (true);

-- Create policies for bookings table
CREATE POLICY "Allow authenticated users to read bookings"
  ON bookings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert bookings"
  ON bookings FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update bookings"
  ON bookings FOR UPDATE TO authenticated USING (true);

-- Create policies for notifications table
CREATE POLICY "Allow authenticated users to read notifications"
  ON notifications FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update notifications"
  ON notifications FOR UPDATE TO authenticated USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_guests_updated_at
  BEFORE UPDATE ON guests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();