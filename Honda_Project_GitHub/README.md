# Honda Motorcycle Showroom Management System (ERP & POS)

A production-style dealership management and point-of-sale system built with **React.js (Vite)**, **Tailwind CSS**, **Node.js (Express.js)**, and **MongoDB Atlas (Mongoose)**.

> **Disclaimer**: This is an independent portfolio project for technical interview demonstration. It is not an official Honda product.

---

## 1. Technical Stack

| Tier | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Axios, Recharts, Lucide React |
| **Backend** | Node.js (v24), Express.js (v4), Mongoose (v8), JWT Authentication, bcryptjs, express-validator, morgan, cors, dotenv |
| **Database** | MongoDB Atlas Cloud Database (Production persistent storage) |
| **Testing** | Vitest, Supertest (18 automated tests passing) |
| **API Format** | RESTful JSON APIs, CSV exports, Postman collection included |

---

## 2. System Architecture

```
Honda Project/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB Atlas connection & error handlers
│   │   ├── controllers/     # Business logic (Auth, Bikes, Sales, Payments, etc.)
│   │   ├── middleware/      # JWT auth, role authorization, validation runner, error handler
│   │   ├── models/          # Mongoose schemas (BikeModel, BikeUnit, Customer, Sale, Payment, etc.)
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Financial tax calculations, audit logging
│   │   ├── utils/           # Amount in words (Indian numbering system), sequential invoice generator
│   │   ├── validators/      # express-validator request rules
│   │   ├── app.js           # Express app setup, CORS, route mounting, health check
│   │   └── server.js        # Server listener and database connection bootstrap
│   ├── scripts/
│   │   └── seed.js          # Idempotent database seeder with realistic Honda 2026 models & units
│   ├── tests/               # Vitest calculation and API integration tests
│   ├── .env.example
│   ├── package.json
│   └── vitest.config.js
├── frontend/
│   ├── src/
│   │   ├── components/      # Sidebar, Navbar, StatCard, Badge, Modal, ConfirmModal, InvoicePrint
│   │   ├── context/         # AuthContext (JWT management), NotificationContext (Toasts)
│   │   ├── layouts/         # DashboardLayout with responsive sidebar
│   │   ├── pages/           # Dashboard, Inventory, Customers, Enquiries, TestRides, Sales, Payments, Reports, Settings, AuditLogs, Login
│   │   ├── routes/          # ProtectedRoute component
│   │   ├── services/        # Axios API client with bearer token interceptor
│   │   ├── utils/           # Indian currency formatter (₹), date formatters
│   │   ├── App.jsx          # Router & Route declarations
│   │   └── main.jsx         # React DOM entry point
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── postman_collection.json  # Comprehensive Postman test collection
├── .gitignore
├── package.json             # Root workspace script launcher
└── README.md
```

---

## 3. Core Business Rules & Financial Formulas

### A. Motorcycle Inventory Tracking
- **Physical Unit Derivation**: Model stock counts (`available`, `reserved`, `sold`) are **strictly aggregated from physical `BikeUnit` records** rather than manually maintained counters.
- **Unique Vehicle Identifiers**: Every physical motorcycle has a unique 17-character Chassis/VIN and Engine number, enforced by Mongoose unique indexes and API validators.

### B. Sale & Invoice Pricing Model
All calculations are strictly executed and validated on the backend:
1. **Gross Goods** = Base Ex-Showroom Price + Total Accessories
2. **Effective Discount** = `Math.min(Discount, Gross Goods)`
3. **Taxable Amount** = Gross Goods - Effective Discount
4. **GST Calculation** = Standard Indian Two-Wheeler 28% GST:
   - **CGST (14%)** = `roundToTwo(totalTax / 2)`
   - **SGST (14%)** = `roundToTwo(totalTax - cgst)`
5. **On-Road Invoice Total** = Taxable Value + CGST + SGST + 5-Year Insurance + RTO Registration & Road Tax
6. **Outstanding Balance** = Invoice Total - Sum of Successful Payments

### C. Concurrency & Race-Condition Protection
To prevent two sales representatives from booking or selling the same physical bike simultaneously:
```javascript
const unit = await BikeUnit.findOneAndUpdate(
  { _id: bikeUnitId, status: 'available' },
  { status: 'sold' },
  { new: true }
);
if (!unit) {
  return res.status(409).json({
    success: false,
    message: 'This physical bike unit is no longer available in inventory.'
  });
}
```
If subsequent validation fails, an atomic compensation rollback restores the bike unit to `available`.

---

## 4. Windows Terminal Setup Instructions

Open PowerShell or Command Prompt on Windows:

### Step 1: Install Dependencies
```powershell
# In Honda Project root:
cd "C:\Users\Administrator\Documents\Honda Project"

# Install backend dependencies
cd backend
npm.cmd install

# Install frontend dependencies
cd ..\frontend
npm.cmd install
```

### Step 2: Configure MongoDB Atlas
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas/database).
2. Under **Security > Database Access**, add a database user (e.g. `honda_admin`) with password.
3. Under **Security > Network Access**, add your current IP address (or `0.0.0.0/0` during development).
4. Under **Clusters > Connect > Drivers**, copy the connection string.
5. Edit `backend/.env`:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/honda_dealership?retryWrites=true&w=majority
```

### Step 3: Seed Database
Populate realistic Honda models (Activa 6G, Shine 125, SP125, CB350), physical chassis units, demo customers, sample invoices, and demo accounts:
```powershell
cd "C:\Users\Administrator\Documents\Honda Project\backend"
node scripts/seed.js
```

### Step 4: Run Tests
Execute the backend automated test suite:
```powershell
cd "C:\Users\Administrator\Documents\Honda Project\backend"
npm.cmd run test
```

### Step 5: Start Backend and Frontend
Open two separate terminal windows:

**Terminal 1 (Backend API):**
```powershell
cd "C:\Users\Administrator\Documents\Honda Project\backend"
npm.cmd start
# API starts at http://localhost:5000
# Health check: http://localhost:5000/api/health
```

**Terminal 2 (Frontend Interface):**
```powershell
cd "C:\Users\Administrator\Documents\Honda Project\frontend"
npm.cmd run dev
# Frontend interface starts at http://localhost:5173
```

---

## 5. Demo Credentials

| Role | Email Address | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Demo Admin** | `admin@honda-dealership.com` | `Admin@Honda2026!` | Full dealership control, pricing settings, user management, audit trail |
| **Demo Staff** | `staff@honda-dealership.com` | `Staff@Honda2026!` | Inventory lookup, customer registration, sale billing, payment collection |

*Note: The login page includes 1-click quick-fill buttons for both credentials to streamline interview demonstrations.*

---

## 6. End-to-End Interview Demonstration Script

Follow this 5-minute technical walkthrough to present the project:

1. **Sign In**:
   - Navigate to `http://localhost:5173/login`.
   - Click **Demo Admin** quick-fill and log in.
2. **Dashboard Analytics**:
   - Point out that physical inventory statistics (`Available`, `Reserved`, `Sold`) are derived directly from the physical units collection.
   - Explain the distinction between **Total Invoiced Value** (gross volume) and **Revenue Collected** (actual completed payment transactions).
   - Review the **Low Stock Alerts** triggered automatically by model reorder thresholds.
3. **Inventory & Physical Unit Tracking**:
   - Go to `/inventory`. Show the **Physical Bike Units** tab with unique 17-character VINs and engine numbers.
   - Switch to the **Model Catalog** tab to show derived stock totals.
   - Click **Stock In New Bike Unit** to add a new physical bike into the showroom floor.
4. **Sales & Billing Workflow**:
   - Go to `/sales/new`.
   - Select an existing customer (or quick-register a new one).
   - Pick an available bike unit from the dropdown. Notice how the base price updates automatically.
   - Add an accessory (e.g., Chrome Guard, ₹2,400).
   - Observe the live, real-time GST tax breakdown (CGST 14% + SGST 14% + Insurance + RTO).
   - Enter an advance booking payment (e.g., ₹25,000 via UPI).
   - Click **Confirm Sale & Generate Invoice**.
5. **Printable Tax Invoice**:
   - Open the created invoice from `/sales`.
   - Notice the dealership tax invoice with GSTIN, chassis/engine number, itemized breakdown, amount in words, and printable layout.
6. **Stock Consistency Verification**:
   - Return to `/inventory`. Notice that the sold bike unit's status immediately updated to `sold` and is no longer selectable in the billing screen.
7. **Record Balance Payment**:
   - Go to `/payments`. Click **Record Customer Payment**.
   - Select the invoice and record the remaining balance. Notice the invoice transitions from `partial` to `paid`.
8. **Audit Trail**:
   - Go to `/audit-logs` (Admin only). Show that every sale creation, payment receipt, and unit status update is immutably timestamped with user details and IP address.
