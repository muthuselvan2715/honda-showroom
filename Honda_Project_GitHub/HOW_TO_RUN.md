# Honda Showroom App — How to Run & Deploy

## A. Run on your computer (Windows)

Needs: Node.js LTS (https://nodejs.org) and MongoDB
(local: https://www.mongodb.com/try/download/community, or a MongoDB Atlas cluster).

1. Open `backend/.env` and set `MONGODB_URI`
   - Local MongoDB: `mongodb://127.0.0.1:27017/honda_dealership` (already set)
   - Atlas: paste your Atlas connection string
2. Terminal 1 (inside `backend` folder):
   ```
   npm install
   npm run seed
   npm run dev
   ```
3. Terminal 2 (inside `frontend` folder):
   ```
   npm install
   npm run dev
   ```
4. Open http://localhost:5173

Login: `admin@honda-dealership.com` / `Admin@Honda2026!`
(Staff: `staff@honda-dealership.com` / `Staff@Honda2026!`)

## B. Put it online (one public link, free)

The backend also serves the built frontend, so one Render web service = one link.
On first start with an empty database, the demo data is loaded automatically.

1. **MongoDB Atlas** (done): cluster `cluster0.mcarfno.mongodb.net`, user `hondaadmin`,
   IP Access List `0.0.0.0/0`.
2. **GitHub**: create a new repository and upload the project files
   (do NOT upload `node_modules` or `.env`).
3. **Render** (https://render.com) → New → Web Service → pick the repo, then set:
   - Language: Node
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Instance Type: Free
   - Environment Variables:
     - `MONGODB_URI` = `mongodb+srv://hondaadmin:YOUR_PASSWORD@cluster0.mcarfno.mongodb.net/honda_dealership?retryWrites=true&w=majority&appName=Cluster0`
     - `JWT_SECRET` = any long random text
     - `NODE_ENV` = `production`
4. Click **Deploy**. When the log shows `running on port`, open the
   `https://<name>.onrender.com` link Render shows.

Note: Render's free plan sleeps after ~15 min of no use; the first visit then takes ~1 minute.
