# Zion Lopes — Portfolio

## Folder Structure

```
zion-portfolio/
│
├── index.html              ← HOME page
│
├── pages/
│   ├── about.html          ← ABOUT page
│   ├── projects.html       ← PROJECTS page
│   └── contact.html        ← CONTACT page
│
├── backend/
│   ├── server.js           ← Node.js / Express server
│   ├── package.json        ← Dependencies
│   └── .env.example        ← Copy to .env and fill credentials
│
├── photo.jpg               ← ADD YOUR PHOTO HERE (rename your image to photo.jpg)
├── resume.pdf              ← ADD YOUR RESUME HERE
│
└── README.md
```

---

## Quick Start (No Backend)

Just open `index.html` in your browser or use VS Code Live Server.
Everything works except the contact form email sending.

---

## Run with Backend (Contact Form Emails)

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in:
```
MAIL_USER=your-gmail@gmail.com
MAIL_PASS=your-gmail-app-password
CONTACT_RECEIVER=your-gmail@gmail.com
```

Then run:
```bash
npm run dev
```

Open → http://localhost:3000

---

## Deploy to GitHub Pages

```bash
git clone https://github.com/ZionLopes/zion.github.io
cd zion.github.io

# Copy all files into the repo root
# Make sure index.html is at the ROOT level

git add .
git commit -m "portfolio update"
git push origin main
```

Then go to: GitHub repo → Settings → Pages → Source: main / root → Save

Your site goes live at: **https://zionlopes.github.io**
