# FaciliFlow v2 — Africa Prudential

Two-app internal workflow platform.

| App | Environment | Branch | URL | Port (local) |
|-----|-------------|--------|-----|---------------|
| Staff Portal | Production | `main` | facilflow.africaprudential.com | 3000 |
| Staff Portal | Development | `dev` | dev-facilflow.africaprudential.com | 3000 |
| Admin Console | Production | `main` | admin-facilflow.africaprudential.com | 3001 |
| Admin Console | Development | `dev` | admin-dev-facilflow.africaprudential.com | 3001 |

---

## Quick Start (Local)

Each app needs its own `.env.local` with Supabase credentials — copy the example and fill in real values (get the URL/anon key from Supabase → Project Settings → API):

```bash
cp facilflow-user/.env.example facilflow-user/.env.local
cp facilflow-admin/.env.example facilflow-admin/.env.local
```

```bash
# Staff Portal
cd facilflow-user
npm install
npm run dev        # http://localhost:3000

# Admin Console
cd facilflow-admin
npm install
npm run dev        # http://localhost:3001
```

---

## Build for Production

```bash
cd facilflow-user && npm run build   # outputs to facilflow-user/dist/
cd facilflow-admin && npm run build  # outputs to facilflow-admin/dist/
```

---

## Deploy to AWS Amplify (Official)

Both apps are deployed on AWS Amplify Hosting, each as its own Amplify app connected to this monorepo, building off branch. Branch-to-environment mapping:

| Branch | Environment |
|--------|-------------|
| `main` | Production |
| `dev`  | Development |

Pushing/merging to `main` or `dev` triggers an Amplify build and deploy for the corresponding environment automatically.

### facilflow-user
- App root: `facilflow-user`
- Build command: `npm run build`
- Output directory: `dist`
- Production: facilflow.africaprudential.com (`main`)
- Development: dev-facilflow.africaprudential.com (`dev`)

### facilflow-admin
- App root: `facilflow-admin`
- Build command: `npm run build`
- Output directory: `dist`
- Production: admin-facilflow.africaprudential.com (`main`)
- Development: admin-dev-facilflow.africaprudential.com (`dev`)

---

## Deploy to Vercel (Alternative)

Each app can also be deployed independently as a Vercel project.

### facilflow-user
- Root directory: `facilflow-user`
- Build command: `npm run build`
- Output directory: `dist`

### facilflow-admin
- Root directory: `facilflow-admin`
- Build command: `npm run build`
- Output directory: `dist`

---

## Project Structure

```
facilflow-v2/
├── facilflow-user/          # Staff Portal
│   ├── src/
│   │   ├── main.jsx         # React entry point
│   │   └── App.jsx          # Full user platform
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── facilflow-admin/         # Admin Console
│   ├── src/
│   │   ├── main.jsx         # React entry point
│   │   └── App.jsx          # Full admin platform
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore
└── README.md
```
