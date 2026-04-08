-- Seed default templates
INSERT INTO templates (name, description, layout_key, font_style, primary_color, accent_color, is_default) VALUES
(
  'Classic Elegance',
  'Traditional certificate with ornate border and serif typography',
  'classic',
  'serif',
  '#1B2A4A',
  '#C9A84C',
  true
),
(
  'Modern Minimal',
  'Clean contemporary design with bold sans-serif headings',
  'modern',
  'sans-serif',
  '#0F172A',
  '#3B82F6',
  false
),
(
  'Academic Heritage',
  'University-style certificate with crest placement and formal layout',
  'academic',
  'serif',
  '#1E3A5F',
  '#8B7339',
  false
)
ON CONFLICT DO NOTHING;

-- Seed a default admin user (password: Admin123!)
-- bcrypt hash of 'Admin123!' with 10 rounds
INSERT INTO users (name, email, password_hash, role)
VALUES (
  'System Admin',
  'admin@certify.com',
  '$2a$10$rQZ8kHwHr6R5YQmGpVr5aeUkGBnZJqEFXPmJV1dMN4rGYpVk7GXSe',
  'admin'
) ON CONFLICT (email) DO NOTHING;
