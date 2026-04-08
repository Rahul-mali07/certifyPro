-- Users table (both admin and candidates)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Candidates table (managed by admin)
CREATE TABLE IF NOT EXISTS candidates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  mobile VARCHAR(20),
  event_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generated')),
  created_by_admin_id INTEGER REFERENCES users(id),
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Certificate templates
CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  layout_key VARCHAR(50) NOT NULL,
  font_style VARCHAR(100) DEFAULT 'serif',
  primary_color VARCHAR(7) DEFAULT '#1e3a5f',
  accent_color VARCHAR(7) DEFAULT '#c8a45a',
  logo_url TEXT,
  signature_url TEXT,
  is_default BOOLEAN DEFAULT false,
  created_by_admin_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Generated certificates
CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  certificate_id VARCHAR(20) UNIQUE NOT NULL,
  candidate_id INTEGER REFERENCES candidates(id),
  user_id INTEGER REFERENCES users(id),
  template_id INTEGER REFERENCES templates(id),
  event_name VARCHAR(255) NOT NULL,
  candidate_name VARCHAR(255) NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  certificate_data TEXT,
  qr_code_data TEXT,
  verification_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications log (mock)
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  certificate_id INTEGER REFERENCES certificates(id),
  recipient_email VARCHAR(255),
  recipient_mobile VARCHAR(20),
  type VARCHAR(10) CHECK (type IN ('email', 'sms')),
  status VARCHAR(20) DEFAULT 'sent',
  sent_at TIMESTAMP DEFAULT NOW()
);

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
