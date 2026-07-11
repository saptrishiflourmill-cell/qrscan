# Visitor Management System

A complete web application for visitor registration and QR code-based identification.

## Features

- **Visitor Registration** - Register visitors with photo upload and auto-generated unique ID
- **QR Code Generation** - Generates QR codes containing visitor detail URLs
- **QR Code Scanning** - Scan QR codes using device camera to view visitor details
- **Admin Dashboard** - Manage visitors with search, filter, edit, delete, check-in/out
- **Visitor Pass** - Printable visitor badge with photo, details, and QR code
- **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js with Express
- **Database:** SQLite (via better-sqlite3)
- **QR Code:** qrcode (server-side generation)
- **QR Scanner:** html5-qrcode (client-side scanning)

## Project Structure

```
visitor-management-system/
├── server.js            # Express server entry point
├── package.json
├── README.md
├── database/
│   ├── db.js            # Database initialization
│   └── schema.sql       # SQL schema
├── models/
│   └── Visitor.js       # Database operations
├── controllers/
│   └── visitorController.js  # Request handlers
├── routes/
│   └── visitors.js      # API routes
├── public/
│   ├── index.html       # Visitor registration page
│   ├── dashboard.html   # Admin dashboard
│   ├── scanner.html     # QR code scanner
│   ├── visitor.html     # Visitor details page
│   ├── pass.html        # Visitor pass/badge
│   ├── 404.html         # Not found page
│   ├── css/style.css    # Styles
│   └── js/              # JavaScript files
├── uploads/             # Visitor photos
└── qrcodes/             # Generated QR code images
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Navigate to the project directory:
   ```bash
   cd visitor-management-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Usage

### Register a Visitor
1. Go to http://localhost:3000
2. Fill in the registration form
3. Submit to generate a unique Visitor ID and QR code
4. Download or print the QR code

### Admin Dashboard
1. Go to http://localhost:3000/dashboard.html
2. View visitor statistics and manage all visitors
3. Search by name, phone, or visitor ID
4. Filter by date
5. Edit, delete, check-in, or check-out visitors

### Scan QR Codes
1. Go to http://localhost:3000/scanner.html
2. Click "Start Scanner" to activate the camera
3. Point at any visitor QR code
4. Automatically redirects to visitor details page

### Visitor Pass
1. From the dashboard, click "Pass" on any visitor
2. Print the visitor badge using the "Print Badge" button

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/visitors/stats | Get dashboard statistics |
| GET | /api/visitors | List all visitors (search, filter, paginate) |
| GET | /api/visitors/:id | Get visitor by ID or visitorId |
| POST | /api/visitors | Create new visitor |
| PUT | /api/visitors/:id | Update visitor |
| DELETE | /api/visitors/:id | Delete visitor |
| PUT | /api/visitors/:id/checkin | Check in visitor |
| PUT | /api/visitors/:id/checkout | Check out visitor |
| GET | /api/visitors/download-qr/:id | Download QR code |
| POST | /api/visitors/upload-photo | Upload photo |

## Security

- All inputs are validated and sanitized
- SQL injection protection via parameterized queries
- Only visitor URL is stored in QR codes (no personal data)
- 404 page for invalid visitor IDs
- Input validation using express-validator
- Helmet.js for security headers
- File upload validation (images only, 2MB max)

## License

MIT
