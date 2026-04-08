# CertifyPro - Enhanced Features Guide

## Project Running Instructions

### Start Development Server
```bash
npm run dev
# or
pnpm dev
```

The application will be available at: **http://localhost:3000**

---

## Feature 1: QR Code Verification System ✓

### What's Implemented:
- **Unique QR Codes**: Every certificate generates a unique QR code
- **Dual Verification Methods**: Search by ID or scan QR code
- **Camera Integration**: Real-time QR code scanning from camera
- **QR Display**: Verification results show the QR code for re-scanning

### Where to Find It:
1. **Home Page** (`/`):
   - Scroll to "Verify a Certificate" section
   - See two tabs: "Search" (by certificate ID) and "QR Code" (camera scan)
   - Click "QR Code" tab to start scanning

2. **Dedicated Verification Page** (`/verify`):
   - Full-screen QR scanner interface
   - Manual certificate ID search
   - Tab-based navigation

3. **Certificate Details** (`/verify/[certId]`):
   - Shows verification status
   - Displays the certificate's QR code
   - Allows for re-scanning and verification

### Testing QR Features:
1. Generate a certificate from Admin Panel
2. Copy the verification URL or certificate ID
3. Navigate to `/verify` page
4. Try manual search first (use certificate ID)
5. For QR scanning, generate a test certificate and scan its QR code

---

## Feature 2: Reusable Candidates System ✓

### What's Implemented:
- **No Status Lock**: Candidates with "generated" status can be re-generated
- **Certificate Counting**: Each candidate shows total certificates generated
- **Generation Tracking**: Each generation increments the certificate count
- **Unlimited Re-generation**: Same candidate can generate multiple unique certificates

### Where to Find It:
1. **Admin Candidates Page** (`/admin/candidates`):
   - View all candidates with their certificate count
   - Status shows "pending" or "generated"
   - Can select any candidate for new certificate generation (no status restrictions)

2. **Admin Generate Page** (`/admin/generate`):
   - Select candidates (both pending and previously generated)
   - Each generation creates a new unique certificate ID and QR code
   - Certificate count automatically increments

### Testing Reusable Candidates:
1. Login as admin (`http://localhost:3000/admin`)
2. Go to "Generate" section
3. Select a candidate that already has generated certificates
4. Generate again - notice:
   - New certificate ID is created
   - New QR code is generated
   - Certificate count in candidates list increases

---

## Feature 3: Enhanced Certificate Delivery Options ✓

### What's Implemented:
- **Three Delivery Methods**:
  - Download ZIP: Direct download of selected certificates
  - Send Email: Email certificates to recipients
  - Send SMS: Send via SMS (mock service, ready for real SMS provider)

- **Candidate Selection**: Choose which candidates' certificates to deliver
- **Delivery Tracking**: All deliveries logged in notifications
- **Status Management**: Track delivery status (pending, sent, failed)

### Where to Find It:
1. **Admin Certificates Page** (`/admin/certificates`):
   - New "Deliver Certificates" button replaces the old download button
   - Opens delivery dialog with multiple options

2. **Delivery Dialog Features**:
   - Select specific candidates/certificates
   - Choose delivery method (Download, Email, SMS)
   - Provide email addresses or phone numbers
   - View delivery history in notifications

### Testing Delivery Features:
1. Login as admin
2. Generate some certificates
3. Go to "Certificates" section
4. Click "Deliver Certificates" button
5. Try each delivery method:
   - **Download**: Downloads ZIP file
   - **Email**: Sends to provided email (mock service logs to console)
   - **SMS**: Sends to phone number (mock service logs to console)
6. Check notifications for delivery status

---

## Feature 4: Advanced Template Management ✓

### What's Implemented:
- **Full Template Editor**:
  - Create new templates
  - Edit existing templates
  - Customize colors, fonts, and layout
  - Add digital signatures
  - Custom field management

- **Digital Signature Support**:
  - Upload signature images
  - Position signatures on certificates
  - Adjust signature size

- **Template Import/Export** (Ready):
  - Export templates with all settings
  - Re-use templates across events

### Where to Find It:
1. **Admin Templates Page** (`/admin/templates`):
   - View all available templates
   - See color scheme and font type for each
   - "Create Template" button to create new template
   - "Edit Template" button on each template card

2. **Template Editor** (`/admin/templates/edit`):
   - New template creation or edit existing one
   - Customize:
     - Template name and description
     - Primary and accent colors (color picker)
     - Font style (serif/sans-serif)
     - Upload and position digital signatures
     - Add custom fields (name, value, etc.)

### Testing Template Features:
1. Login as admin
2. Go to Templates section
3. Click "Create Template" button
4. Fill in template details:
   - Name: "Custom Event Certificate"
   - Choose colors using color picker
   - Upload a signature image (or use placeholder)
   - Add custom fields
5. Save template
6. Use this template when generating certificates
7. Edit template later to modify signature or colors

---

## Feature 5: Error Fixes & Improvements ✓

### What's Fixed:
1. **Registration Error Handling**:
   - Better error messages from server
   - Detailed logging for debugging
   - Shows actual error reasons (not just "Registration failed")

2. **Home Page QR Integration**:
   - Verification section now has QR scanner tab
   - Seamless switching between ID search and QR scanning
   - Full mobile camera support

### Testing Error Handling:
1. Try registering with:
   - Missing required fields
   - Invalid email format
   - Short password (<6 characters)
   - Each should show specific error message

2. Admin registration:
   - Use admin code "Swapnil" or organization-specific code
   - Invalid code should show "Invalid admin secret code"

---

## API Endpoints Summary

### Certificate Management
- `POST /api/admin/certificates/generate` - Generate certificates
- `GET /api/admin/certificates` - List all certificates
- `POST /api/admin/certificates/deliver` - Deliver certificates (new)
- `GET /api/certificates/[certId]/download` - Download certificate

### Verification
- `GET /api/verify/[certId]` - Verify certificate and get details (includes QR code)

### Template Management
- `GET /api/admin/templates` - List templates
- `POST /api/admin/templates` - Create template (new)
- `GET /api/admin/templates/[id]` - Get template details (new)
- `PUT /api/admin/templates/[id]` - Update template (new)

### Candidate Management
- `GET /api/admin/candidates` - List all candidates (shows certificate count)
- `POST /api/admin/candidates` - Create candidates
- `PUT /api/admin/candidates/[id]` - Update candidate

---

## Database Collections

### Enhanced Collections:
1. **Candidates**:
   - Added: `certificateCount` (tracks total certificates generated)

2. **Certificates**:
   - Added: `qrCodeUrl` (for display in verification)
   - Added: `generationInstance` (tracks which generation this is)

3. **Templates**:
   - Added: `signaturePosition` (x, y, width, height)
   - Added: `signatureUrl` (path to signature image)
   - Added: `customFields` (array of custom field definitions)

4. **Notifications**:
   - Enhanced: `deliveryMethod` (email, sms, download)
   - Tracks all delivery events

---

## Troubleshooting

### QR Scanner Not Working
- Check browser camera permissions
- Use HTTPS in production (camera requires secure context)
- Try using a different QR code library if jsQR doesn't work

### Registration Failing
- Check MongoDB connection
- Verify admin code is correct (default: "Swapnil")
- Check browser console for detailed error messages
- Look at server logs with [v0] prefix

### Certificates Not Generating
- Ensure template is selected
- Check template exists in database
- Verify candidate data is complete
- Check file system permissions for PDF generation

### Email/SMS Not Sending (Mock Mode)
- In development, check browser console
- Emails and SMS are logged but not actually sent
- For production, configure actual email/SMS providers

---

## Next Steps for Production

1. **Integrate Real Email Service**:
   - Replace nodemailer mock with SendGrid, Twilio, etc.
   - Update `/lib/email.ts`

2. **Integrate Real SMS Service**:
   - Use Twilio, AWS SNS, or similar
   - Update delivery API

3. **Setup Cloud Storage**:
   - Move certificates to S3 or Vercel Blob
   - Update certificate storage paths

4. **Enable HTTPS**:
   - Required for camera access in production
   - Get SSL certificate for your domain

5. **Database Backup**:
   - Setup MongoDB Atlas backups
   - Test restore procedures

---

## Support & Debugging

All debug logs are prefixed with `[v0]` for easy filtering.

Check:
- Browser Console (F12) for frontend errors
- Server logs for backend errors
- Network tab for API call issues

For detailed investigation, enable verbose logging in:
- `/app/api/` route handlers
- `/lib/` utility functions
- React components using `console.log("[v0] ...")`

