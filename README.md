# We All With You

Full-stack charity website built with:
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose

## Features
- Home page with mission quote: "Saving lives, changing lives."
- Support Us section with charity quotes and photos
- Donate dashboard with user details:
  - Name, country, email, phone
  - Monthly / once donation type
  - Contribution quote selector
  - Payment line selector: QR code, credit card, debit card
- Live impact counters:
  - People suffering (in millions)
  - People benefited
- World impact dashboard map with highlighted active countries
- Donation data saved to MongoDB
- Admin register/login for program management
- Admin finance dashboard to review total received, balance, and withdrawals
- Admin management dashboards separated by click-tabs (create, amount, delete, finance, approval)
- Admin roles:
  - `approver` can create/update/delete profiles and approve/reject withdrawals
  - `viewer` has read-only access

## Run Backend
```bash
cd server
cp .env.example .env
npm install
npm run dev
```

## Run Frontend
```bash
cd client
npm install
npm run dev
```

Optional payment link env vars in `client/.env`:
```bash
VITE_STRIPE_MONTHLY_LINK=https://checkout.stripe.com/pay/your-monthly-link
VITE_STRIPE_ONCE_LINK=https://checkout.stripe.com/pay/your-once-link
```

Frontend runs on `http://localhost:5173`
Backend runs on `http://localhost:5000`

## API
- `POST /api/donations` Save donation details
- `GET /api/donations` List donations
- `GET /api/stats` Get NGO counters and donor count
- `GET /api/programs` List admin-created support dashboards
  - supports pagination query: `page`, `pageSize`
- `POST /api/programs` Create support dashboard (admin auth required)
- `PATCH /api/programs/:id/amount` Update received amount for a program (admin auth required)
- `DELETE /api/programs/:id` Delete a program profile (admin auth required)
- `POST /api/admin/register` Register admin account
- `POST /api/admin/login` Login admin account
- `GET /api/admin/me` Validate token and get logged-in admin profile
- `GET /api/auth/admins` List admin users (approver role required)
- `PATCH /api/auth/admins/:id/role` Update admin role (approver role required)
- `GET /api/finance/overview` View finance summary (admin auth required)
- `GET /api/finance/withdrawals` List withdrawals (admin auth required)
  - supports pagination query: `page`, `pageSize`
- `GET /api/finance/donations` List donation payments with amounts (admin auth required)
  - supports query filters: `country`, `paymentMethod`, `dateFrom`, `dateTo`
  - supports pagination query: `page`, `pageSize`
- `GET /api/finance/donations/export.csv` Export donation records CSV (admin auth required)
- `GET /api/finance/withdraw-requests` List withdrawal requests (admin auth required)
  - supports query: `status` (`pending|approved|rejected`)
  - supports pagination query: `page`, `pageSize`
- `POST /api/finance/withdraw-request` Create withdrawal request (admin auth required)
- `PATCH /api/finance/withdraw-requests/:id/approve` Approve request and record withdrawal (admin auth required)
- `PATCH /api/finance/withdraw-requests/:id/reject` Reject withdrawal request (admin auth required)

Use `Authorization: Bearer <token>` for admin-protected endpoints.
