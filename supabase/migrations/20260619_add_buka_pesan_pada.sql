-- Add buka_pesan_pada column to anggota table
ALTER TABLE anggota ADD COLUMN IF NOT EXISTS buka_pesan_pada TIMESTAMP WITH TIME ZONE DEFAULT NULL;
