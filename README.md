# 🍱 FoodBridge Mumbai — Smart Food Redistribution Platform

A zero-cost, scalable platform connecting **Donors**, **NGOs**, and **Volunteers** across Mumbai using a Trust-First verification model.

---

## 📁 Complete Project Structure

```
food-redistribution/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          ← MongoDB Atlas connection
│   │   │   └── cloudinary.js        ← Image upload config
│   │   ├── models/
│   │   │   ├── User.js              ← User + NGO verification state
│   │   │   ├── Donation.js          ← Donation state machine
│   │   │   ├── NGOData.js           ← Mumbai 2025 NGO directory
│   │   │   └── GlobalStats.js       ← Running impact totals
│   │   ├── controllers/
│   │   │   ├── authController.js    ← Register, Login, GetMe
│   │   │   ├── donationController.js← All donation logic
│   │   │   ├── ngoVerification      ← 4-step NGO verification
│   │   │   │   Controller.js
│   │   │   └── adminController.js   ← Admin approve/reject
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── donationRoutes.js
│   │   │   ├── ngoRoutes.js
│   │   │   └── adminRoutes.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js    ← JWT verification
│   │   │   ├── roleMiddleware.js    ← Role guards
│   │   │   └── errorHandler.js     ← Global error handler
│   │   ├── services/
│   │   │   ├── emailService.js     ← Nodemailer OTP emails
│   │   │   ├── otpService.js       ← OTP + email masking
│   │   │   └── ngoMatchService.js  ← Fuse.js fuzzy matching
│   │   ├── jobs/
│   │   │   └── expiryJob.js        ← Hourly cron expiry
│   │   └── server.js               ← Entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── api.js              ← Axios instance + interceptors
│   │   ├── context/
│   │   │   └── AuthContext.jsx     ← Auth state management
│   │   ├── components/
│   │   │   ├── Navbar.jsx          ← Shared nav
│   │   │   ├── StatCard.jsx        ← Animated stat display
│   │   │   ├── StatusBadge.jsx     ← Donation status pill
│   │   │   └── NGOVerification.jsx ← Full 4-step NGO flow
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx     ← Public landing page
│   │   │   ├── Login.jsx           ← Auth
│   │   │   ├── Register.jsx        ← Role selection + signup
│   │   │   ├── DonorDashboard.jsx  ← Post + track donations
│   │   │   ├── NGODashboard.jsx    ← Browse + claim donations
│   │   │   ├── VolunteerDashboard  ← Accept + complete tasks
│   │   │   │   .jsx
│   │   │   └── AdminDashboard.jsx  ← Review + approve NGOs
│   │   ├── App.jsx                 ← Routing
│   │   ├── main.jsx
│   │   └── index.css              ← Tailwind + design tokens
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── seed.js                         ← Import Mumbai NGO CSV
```

---

## 🚀 Setup Instructions (Step by Step)

### Step 1 — Create External Accounts (all free)

| Service       | URL               | What to get                          |
| ------------- | ----------------- | ------------------------------------ |
| MongoDB Atlas | cloud.mongodb.com | Connection URI                       |
| Cloudinary    | cloudinary.com    | Cloud name, API key, API secret      |
| Gmail         | mail.google.com   | Enable 2FA → App Password (16 chars) |

### Step 2 — Clone & Install

```bash
# Backend
cd food-redistribution/backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 3 — Configure Environment

```bash
# In backend/
cp .env.example .env
# Fill in all values in .env
```

### Step 4 — Seed the NGO Dataset

Prepare your Mumbai NGO CSV with columns:
`name, email, contact, address, ward, isBmcPartner, areaOfWork`

```bash
# From project root
node seed.js ./path/to/mumbai_ngos.csv
```

### Step 5 — Create First Admin User

After registering normally, open MongoDB Atlas → Collections → Users
Find your user document and change `role` from `"DONOR"` to `"ADMIN"`.

### Step 6 — Run Locally

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Visit: `http://localhost:5173`

---

## 🌐 Deployment

### Backend → Render

1. Create new Web Service on render.com
2. Connect your GitHub repo
3. Root directory: `backend`
4. Build: `npm install`
5. Start: `node src/server.js`
6. Add all `.env` variables in Render dashboard

### Frontend → Vercel

1. Import repo on vercel.com
2. Root directory: `frontend`
3. Add env var: `VITE_API_URL=https://your-render-url.onrender.com/api`
4. Deploy

---

## 🔐 NGO Verification Flow

```
User enters NGO name
      ↓
Fuse.js fuzzy match against MongoDB NGOData
      ↓
    Found?
   /      \
  YES      NO
   ↓        ↓
Show      Ask for
masked    Darpan ID
email      ↓
   ↓      PENDING_ADMIN
User      (Admin approves
enters    in dashboard)
email
   ↓
OTP sent to that email
   ↓
User enters OTP
   ↓
EMAIL_VERIFIED ✅
(TRUSTED NGO — can claim food)
```

---

## ⚙️ Key Technical Decisions

- **Atomic claiming**: `findOneAndUpdate` with `{status: 'AVAILABLE'}` filter — prevents race conditions
- **Fuse.js**: In-memory fuzzy search cached on server start, reloaded every 6 hours
- **2dsphere index**: MongoDB geospatial — finds donations within 10km radius
- **Ward fallback**: If GPS unavailable, matches by ward string
- **Impact formula**: Meals = weight / 0.5kg | CO₂ = weight × 2.5kg
- **GlobalStats**: Single document with `$inc` — atomic running totals

---

## 📊 API Reference

| Method | Endpoint                           | Role      | Description           |
| ------ | ---------------------------------- | --------- | --------------------- |
| POST   | /api/auth/register                 | Public    | Create account        |
| POST   | /api/auth/login                    | Public    | Get JWT token         |
| POST   | /api/ngo/check-name                | NGO       | Fuzzy search NGO name |
| POST   | /api/ngo/verify-email              | NGO       | Validate + send OTP   |
| POST   | /api/ngo/confirm-otp               | NGO       | Confirm OTP           |
| POST   | /api/ngo/submit-darpan             | NGO       | Submit Darpan ID      |
| POST   | /api/donations                     | DONOR     | Create donation       |
| GET    | /api/donations/nearby              | NGO       | Geo search nearby     |
| PATCH  | /api/donations/:id/reserve         | NGO       | Atomic claim          |
| GET    | /api/donations/reserved            | VOLUNTEER | See claimable tasks   |
| PATCH  | /api/donations/:id/accept-delivery | VOLUNTEER | Accept task           |
| PATCH  | /api/donations/:id/complete        | VOLUNTEER | Mark delivered        |
| GET    | /api/donations/stats               | Public    | Global impact stats   |
| GET    | /api/admin/pending-ngos            | ADMIN     | Review queue          |
| PATCH  | /api/admin/approve/:id             | ADMIN     | Approve NGO           |
| PATCH  | /api/admin/reject/:id              | ADMIN     | Reject NGO            |
