# 🎉 CelebriPlan — AI-Powered Celebration & Event Planner

> Full-Stack Startup Blueprint | AI Event Planning Engine + Vendor Marketplace + 3D Venue Preview + Smart Invitations & RSVP + Google Calendar Automatic Scheduling

---

## 🌟 Live Local Hosting
The backend server is currently running:
- **Local URL:** [http://localhost:3000](http://localhost:3000)
- **AI Planning API:** `POST http://localhost:3000/api/ai/plan`
- **Vendor Marketplace API:** `GET http://localhost:3000/api/vendors`
- **Calendar Sync (.ICS):** `GET http://localhost:3000/api/calendar/export`

To start the server anytime:
```bash
node server.js
```

---

## 🚀 How to Host Online (Free Cloud Deployment Options)

### Option 1: Vercel (Recommended - 1 Command)
1. Open your terminal in this folder:
   ```bash
   npx vercel
   ```
2. Follow the 3 prompts (Login with GitHub / Email).
3. Your website will be live in 30 seconds with a free `.vercel.app` URL and automatic HTTPS!

---

### Option 2: Netlify (Drag & Drop or CLI)
- **Method A (Drag & Drop):**
  1. Visit [https://app.netlify.com/drop](https://app.netlify.com/drop).
  2. Drag and drop the `C:\Event Page` folder into the browser.
  3. Done! Your site is hosted instantly.
- **Method B (Terminal):**
  ```bash
  npx netlify deploy --prod
  ```

---

### Option 3: GitHub Pages
1. Create a new repository on [GitHub](https://github.com/new) named `celebriplan`.
2. Push this project:
   ```bash
   git init
   git add .
   git commit -m "Launch CelebriPlan"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/celebriplan.git
   git push -u origin main
   ```
3. In your GitHub repo, go to **Settings > Pages**, select the `main` branch, and click **Save**.
4. Your site will be published at `https://YOUR_USERNAME.github.io/celebriplan/`.

---

### Option 4: Render / Railway (Full-Stack Node.js Hosting)
1. Push to GitHub as shown in Option 3.
2. Sign in to [Render](https://render.com) or [Railway](https://railway.app).
3. Select **New Web Service** and connect your GitHub repository.
4. Set Build Command to empty and Start Command to `node server.js`.
5. Your full-stack Node.js server and API will be live 24/7!

---

## 🛠️ Tech Stack
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla ES6+), Three.js / Canvas 3D Viewer
- **Backend:** Node.js HTTP Server, REST APIs
- **AI Planning Engine:** Section 9 Structured Event Planning Engine (`budgetPaise`, `tasks`, `timeline`)
- **Integrations:** Google Calendar Web API, WhatsApp Cloud URL Scheme, Dynamic QR Generation
