-- Enhancement Migration: Add QR, Reusable Candidates, and Template Features
-- This migration enhances the certificate system with new capabilities

-- 1. Add generation_instance and certificate_count to candidates table
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS generation_instance INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS certificate_count INTEGER DEFAULT 0,
MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'available'));

-- 2. Enhance templates table with digital signature and custom fields support
ALTER TABLE templates
ADD COLUMN IF NOT EXISTS digital_signature_url TEXT,
ADD COLUMN IF NOT EXISTS signature_position JSON,
ADD COLUMN IF NOT EXISTS custom_fields JSON,
ADD COLUMN IF NOT EXISTS font_family VARCHAR(100) DEFAULT 'Arial',
ADD COLUMN IF NOT EXISTS header_text VARCHAR(255),
ADD COLUMN IF NOT EXISTS footer_text VARCHAR(255),
ADD COLUMN IF NOT EXISTS background_image_url TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 3. Enhance certificates table with more tracking
ALTER TABLE certificates
ADD COLUMN IF NOT EXISTS generation_instance INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS qr_code_url TEXT,
ADD COLUMN IF NOT EXISTS digital_signature_url TEXT;

-- 4. Enhance notifications table for delivery tracking
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(20) CHECK (delivery_method IN ('email', 'sms', 'download')),
ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed')),
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS delivery_timestamp TIMESTAMP;

-- 5. Create template_imports table for tracking user-imported templates
CREATE TABLE IF NOT EXISTS template_imports (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES templates(id),
  imported_from TEXT,
  imported_by_admin_id INTEGER REFERENCES users(id),
  original_template_data JSON,
  import_date TIMESTAMP DEFAULT NOW()
);

-- 6. Create certificate_deliveries table for comprehensive delivery tracking
CREATE TABLE IF NOT EXISTS certificate_deliveries (
  id SERIAL PRIMARY KEY,
  certificate_id INTEGER REFERENCES certificates(id),
  candidate_id INTEGER REFERENCES candidates(id),
  delivery_method VARCHAR(20) NOT NULL CHECK (delivery_method IN ('email', 'sms', 'download')),
  recipient_email VARCHAR(255),
  recipient_mobile VARCHAR(20),
  delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed')),
  delivered_by_admin_id INTEGER REFERENCES users(id),
  delivery_timestamp TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_candidate_id ON certificates(candidate_id);
CREATE INDEX IF NOT EXISTS idx_certificates_generation_instance ON certificates(generation_instance);
CREATE INDEX IF NOT EXISTS idx_deliveries_certificate_id ON certificate_deliveries(certificate_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_candidate_id ON certificate_deliveries(candidate_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_delivery_method ON certificate_deliveries(delivery_method);
