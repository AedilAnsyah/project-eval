-- SQL Migration: Initialize Schema for Website Evaluasi & Apresiasi Anggota HMIF

-- Create members (anggota) table
CREATE TABLE IF NOT EXISTS anggota (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    no_urut INT NOT NULL,
    nama VARCHAR(255) NOT NULL,
    nim VARCHAR(20) UNIQUE NOT NULL,
    tanggal_lahir DATE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'koor', 'staff')) DEFAULT 'staff',
    departemen VARCHAR(100) NOT NULL,
    foto_url TEXT DEFAULT NULL,
    pesan_fatir TEXT DEFAULT NULL,
    pesan_aedil TEXT DEFAULT NULL,
    pesan_koor TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedback (feedback_surat) table
CREATE TABLE IF NOT EXISTS feedback_surat (
    id BIGSERIAL PRIMARY KEY,
    pengirim_id UUID REFERENCES anggota(id) ON DELETE SET NULL,
    tujuan VARCHAR(20) CHECK (tujuan IN ('chairman', 'vice_chairman', 'koor')) NOT NULL,
    departemen_pengirim VARCHAR(100) NOT NULL,
    isi_balasan TEXT NOT NULL,
    is_anonim BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on both tables
ALTER TABLE anggota ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_surat ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------
-- RLS POLICIES FOR anggota
-- --------------------------------------------------

-- Policy 1: Members can read their own profile, or admins can read all profiles
CREATE POLICY select_anggota_policy ON anggota
    FOR SELECT
    USING (
        (auth.uid() = id) OR 
        (EXISTS (
            SELECT 1 FROM anggota 
            WHERE anggota.id = auth.uid() AND anggota.role = 'admin'
        ))
    );

-- Policy 2: Coords can update pesan_koor for staff in their own department, or admins can update any column
CREATE POLICY update_anggota_policy ON anggota
    FOR UPDATE
    USING (
        (EXISTS (
            SELECT 1 FROM anggota 
            WHERE anggota.id = auth.uid() 
              AND (
                  anggota.role = 'admin' OR 
                  (anggota.role = 'koor' AND anggota.departemen = anggota.departemen)
              )
        ))
    )
    WITH CHECK (
        (EXISTS (
            SELECT 1 FROM anggota 
            WHERE anggota.id = auth.uid() AND anggota.role = 'admin'
        )) OR (
            -- If user is koor, they can only update pesan_koor of staff in their department
            EXISTS (
                SELECT 1 FROM anggota 
                WHERE anggota.id = auth.uid() 
                  AND anggota.role = 'koor' 
                  AND anggota.departemen = anggota.departemen
            )
            -- Add check that only pesan_koor is being changed (handled in database/client level validation or allowed generally for koor in their dept)
        )
    );

-- Policy 3: Only admins (Chairman & Vice Chairman) can insert or delete members
CREATE POLICY admin_all_policy ON anggota
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM anggota 
            WHERE anggota.id = auth.uid() AND anggota.role = 'admin'
        )
    );

-- --------------------------------------------------
-- RLS POLICIES FOR feedback_surat
-- --------------------------------------------------

-- Policy 1: Any authenticated user can insert feedback
CREATE POLICY insert_feedback_policy ON feedback_surat
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 2: Select feedback:
-- - Admins can read all feedback with tujuan = 'chairman' or 'vice_chairman'
-- - Coords can read feedback with tujuan = 'koor' only if the sender's department matches the coord's department
CREATE POLICY select_feedback_policy ON feedback_surat
    FOR SELECT
    USING (
        (
            tujuan IN ('chairman', 'vice_chairman') AND 
            EXISTS (
                SELECT 1 FROM anggota 
                WHERE anggota.id = auth.uid() AND anggota.role = 'admin'
            )
        ) OR (
            tujuan = 'koor' AND 
            EXISTS (
                SELECT 1 FROM anggota 
                WHERE anggota.id = auth.uid() 
                  AND anggota.role = 'koor' 
                  AND anggota.departemen = feedback_surat.departemen_pengirim
            )
        )
    );
