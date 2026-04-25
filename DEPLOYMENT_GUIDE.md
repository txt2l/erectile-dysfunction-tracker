# ChatroomLM Startup Edition — Deployment Guide

This guide walks you through deploying ChatroomLM so it is live on the internet. The **frontend** (what users see) goes on **Netlify**, and the **backend** (the server that handles data) goes on **Snap Deploy** (or a similar Node.js hosting service). No coding experience is required — just follow each step carefully.

---

## Table of Contents

1. [What You Need Before Starting](#1-what-you-need-before-starting)
2. [Understanding the Architecture](#2-understanding-the-architecture)
3. [Step 1 — Get the Code Ready](#step-1--get-the-code-ready)
4. [Step 2 — Set Up Your Database](#step-2--set-up-your-database)
5. [Step 3 — Deploy the Backend on Snap Deploy](#step-3--deploy-the-backend-on-snap-deploy)
6. [Step 4 — Deploy the Frontend on Netlify](#step-4--deploy-the-frontend-on-netlify)
7. [Step 5 — Connect Frontend to Backend](#step-5--connect-frontend-to-backend)
8. [Step 6 — Set Up S3 File Storage](#step-6--set-up-s3-file-storage)
9. [Step 7 — Test Everything](#step-7--test-everything)
10. [Troubleshooting](#troubleshooting)
11. [Environment Variables Reference](#environment-variables-reference)

---

## 1. What You Need Before Starting

Before you begin, make sure you have accounts on these services. All of them have free tiers:

| Service | What It Does | Sign Up Link |
|---------|-------------|-------------|
| **GitHub** | Stores your code | [github.com](https://github.com) |
| **Netlify** | Hosts your frontend (the website) | [netlify.com](https://netlify.com) |
| **Snap Deploy** | Hosts your backend (the server) | Check Snap Deploy's website |
| **PlanetScale** or **TiDB Cloud** | Hosts your MySQL database | [planetscale.com](https://planetscale.com) or [tidbcloud.com](https://tidbcloud.com) |
| **AWS** (for S3) | Stores uploaded files | [aws.amazon.com](https://aws.amazon.com) |

> **What is a "free tier"?** Most cloud services let you use their product for free up to a certain limit. For a small startup, you likely will not exceed these limits.

---

## 2. Understanding the Architecture

Think of ChatroomLM like a restaurant:

- **Frontend (Netlify)** = The dining room. This is what your users see and interact with — the buttons, the chat interface, the dark industrial design.
- **Backend (Snap Deploy)** = The kitchen. This is where all the work happens — storing messages, managing tasks, handling file uploads, running AI translations.
- **Database (PlanetScale/TiDB)** = The recipe book and inventory. This stores all your data permanently.
- **S3 (AWS)** = The storage room. This is where uploaded files (images, documents, etc.) are kept.

```
Users → Netlify (Frontend) → Snap Deploy (Backend) → Database + S3
```

---

## Step 1 — Get the Code Ready

### 1.1 Download the Code

If you received the code as a ZIP file:
1. Unzip it to a folder on your computer
2. You should see folders named `client/`, `server/`, `drizzle/`, etc.

### 1.2 Push to GitHub

You need to put the code on GitHub so Netlify and Snap Deploy can access it.

1. Go to [github.com](https://github.com) and sign in
2. Click the green **"New"** button (top left) to create a new repository
3. Name it `chatroomlm` (or whatever you prefer)
4. Set it to **Private** (recommended)
5. Click **"Create repository"**
6. Follow the instructions shown on screen to upload your code. If you have Git installed on your computer, open a terminal/command prompt in your code folder and run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/chatroomlm.git
git push -u origin main
```

> **Don't have Git?** Download it from [git-scm.com](https://git-scm.com). On Mac, you can also install it via the Terminal by typing `xcode-select --install`.

---

## Step 2 — Set Up Your Database

ChatroomLM uses a MySQL-compatible database. We recommend **PlanetScale** or **TiDB Cloud** because they have generous free tiers.

### Using PlanetScale

1. Go to [planetscale.com](https://planetscale.com) and create an account
2. Click **"Create a database"**
3. Name it `chatroomlm`
4. Choose a region close to your users (e.g., `us-east-1` for US East)
5. Click **"Create database"**
6. Go to **Settings → Passwords** and click **"New password"**
7. Copy the connection string — it looks like:
   ```
   mysql://username:password@host/chatroomlm?ssl={"rejectUnauthorized":true}
   ```
8. **Save this connection string somewhere safe** — you will need it later as `DATABASE_URL`

### Using TiDB Cloud

1. Go to [tidbcloud.com](https://tidbcloud.com) and create an account
2. Create a **Serverless** cluster
3. Go to **Connect** and copy the connection string
4. Save it — this is your `DATABASE_URL`

### Create the Tables

Once your database is set up, you need to create the tables. Find the file `drizzle/0001_last_quicksilver.sql` (or similar) in your code. Copy its contents and run it in your database:

- **PlanetScale**: Go to your database → **Console** tab → paste the SQL → click **Run**
- **TiDB Cloud**: Go to your cluster → **SQL Editor** → paste the SQL → click **Run**

> **What are tables?** Think of them like spreadsheets inside your database. Each table stores a different type of data (users, messages, tasks, etc.).

---

## Step 3 — Deploy the Backend on Snap Deploy

The backend is a Node.js server that handles all the logic.

### 3.1 Connect Your Repository

1. Log in to Snap Deploy
2. Click **"New Project"** or **"Deploy"**
3. Connect your GitHub account when prompted
4. Select the `chatroomlm` repository

### 3.2 Configure Build Settings

Set these build settings:

| Setting | Value |
|---------|-------|
| **Build Command** | `pnpm install && pnpm build` |
| **Start Command** | `pnpm start` |
| **Node Version** | `22` (or latest LTS) |
| **Root Directory** | `/` (the root of your project) |

### 3.3 Set Environment Variables

This is the most important step. In Snap Deploy's settings, add these environment variables:

| Variable | Value | Where to Get It |
|----------|-------|-----------------|
| `DATABASE_URL` | Your database connection string | From Step 2 |
| `JWT_SECRET` | A random string (at least 32 characters) | Generate one at [randomkeygen.com](https://randomkeygen.com) |
| `NODE_ENV` | `production` | Type this exactly |
| `PORT` | `3000` | Type this exactly |
| `BUILT_IN_FORGE_API_URL` | Your AI API endpoint | From your AI provider |
| `BUILT_IN_FORGE_API_KEY` | Your AI API key | From your AI provider |
| `S3_BUCKET` | Your S3 bucket name | From Step 6 |
| `S3_REGION` | Your S3 region (e.g., `us-east-1`) | From Step 6 |
| `S3_ACCESS_KEY_ID` | Your AWS access key | From Step 6 |
| `S3_SECRET_ACCESS_KEY` | Your AWS secret key | From Step 6 |

> **What is a "random string"?** For `JWT_SECRET`, you need a long, random password-like string. Go to [randomkeygen.com](https://randomkeygen.com) and copy one of the "Fort Knox Passwords". Example: `k8Jd9fLm2nPq4rSt6uVw8xYz0aBcDeFg`

### 3.4 Deploy

Click **"Deploy"** and wait for it to finish. This usually takes 2-5 minutes.

Once deployed, you will get a URL like `https://chatroomlm-backend.snapdeploy.app`. **Copy this URL** — you will need it in the next step.

---

## Step 4 — Deploy the Frontend on Netlify

### 4.1 Sign Up and Connect

1. Go to [netlify.com](https://netlify.com) and sign up (you can use your GitHub account)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** and select your `chatroomlm` repository

### 4.2 Configure Build Settings

| Setting | Value |
|---------|-------|
| **Base directory** | `client` |
| **Build command** | `cd .. && pnpm install && pnpm run build` |
| **Publish directory** | `dist` |
| **Node version** | `22` |

> **Why `cd ..`?** The frontend code lives in the `client/` folder, but the build process needs access to the whole project. This command goes up one level first.

### 4.3 Set Environment Variables

In Netlify's **Site settings → Environment variables**, add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | The URL from Step 3.4 (e.g., `https://chatroomlm-backend.snapdeploy.app`) |
| `VITE_APP_TITLE` | `ChatroomLM` |

### 4.4 Deploy

Click **"Deploy site"**. Netlify will build and deploy your frontend. This takes 1-3 minutes.

You will get a URL like `https://chatroomlm.netlify.app`. This is your live website!

### 4.5 (Optional) Custom Domain

Want to use your own domain (like `app.yourcompany.com`)?

1. In Netlify, go to **Domain settings**
2. Click **"Add custom domain"**
3. Follow the instructions to point your domain's DNS to Netlify

---

## Step 5 — Connect Frontend to Backend

For the frontend and backend to communicate, you need to set up a redirect rule so API calls from the frontend reach the backend.

### 5.1 Create a Netlify Redirects File

Create a file called `_redirects` in your `client/public/` folder with this content:

```
/api/*  https://YOUR-BACKEND-URL.snapdeploy.app/api/:splat  200
```

Replace `YOUR-BACKEND-URL` with your actual backend URL from Step 3.4.

### 5.2 Alternative: netlify.toml

Instead of `_redirects`, you can create a `netlify.toml` file in the root of your project:

```toml
[build]
  base = "client"
  command = "cd .. && pnpm install && pnpm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "https://YOUR-BACKEND-URL.snapdeploy.app/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

> **What does this do?** When your frontend makes a request to `/api/something`, Netlify forwards it to your backend server. The second redirect ensures that all other URLs load the app (needed for single-page applications).

### 5.3 Redeploy

After adding the redirects file, push the change to GitHub:

```bash
git add .
git commit -m "Add Netlify redirects"
git push
```

Netlify will automatically redeploy.

---

## Step 6 — Set Up S3 File Storage

Amazon S3 stores the files that users upload (documents, images, etc.).

### 6.1 Create an AWS Account

1. Go to [aws.amazon.com](https://aws.amazon.com) and create an account
2. You will need a credit card, but S3 has a generous free tier (5 GB storage, 20,000 GET requests/month)

### 6.2 Create an S3 Bucket

1. Go to the **S3 Console**: [s3.console.aws.amazon.com](https://s3.console.aws.amazon.com)
2. Click **"Create bucket"**
3. Name it something unique like `chatroomlm-files-yourname`
4. Choose a region (same as your backend if possible)
5. **Uncheck** "Block all public access" (files need to be accessible)
6. Click **"Create bucket"**

### 6.3 Set Bucket Policy

1. Click on your new bucket
2. Go to **Permissions** → **Bucket Policy**
3. Paste this policy (replace `YOUR-BUCKET-NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

### 6.4 Create Access Keys

1. Go to **IAM Console**: [console.aws.amazon.com/iam](https://console.aws.amazon.com/iam)
2. Click **Users** → **Create user**
3. Name it `chatroomlm-s3-user`
4. Attach the policy **AmazonS3FullAccess**
5. Go to the user → **Security credentials** → **Create access key**
6. Choose **Application running outside AWS**
7. Copy the **Access Key ID** and **Secret Access Key**

> **Keep these secret!** Never share your AWS keys publicly or commit them to GitHub.

### 6.5 Update Backend Environment Variables

Go back to Snap Deploy and add/update these environment variables:

| Variable | Value |
|----------|-------|
| `S3_BUCKET` | `chatroomlm-files-yourname` |
| `S3_REGION` | `us-east-1` (or your chosen region) |
| `S3_ACCESS_KEY_ID` | Your access key from step 6.4 |
| `S3_SECRET_ACCESS_KEY` | Your secret key from step 6.4 |

Redeploy the backend after adding these.

---

## Step 7 — Test Everything

Now that everything is deployed, test each feature:

### Quick Test Checklist

| Feature | How to Test | Expected Result |
|---------|------------|-----------------|
| **Landing Page** | Visit your Netlify URL | See the dark industrial landing page |
| **Login** | Click "Enter Workspace" | Redirected to login, then back to workspace |
| **Create Room** | Click the "+" next to "Rooms" | New room appears in sidebar |
| **Send Message** | Type a message and press Enter | Message appears in chat |
| **Memory Bank** | Switch to Memory panel, create a note | Note saved and searchable |
| **Tasks** | Switch to Tasks panel, create a task | Task appears with priority badge |
| **Calendar** | Switch to Calendar panel, click a day | Event created on that day |
| **File Upload** | Switch to Files panel, upload a file | File appears in list, preview works |
| **Notebook** | Switch to Notebook panel, create one | Markdown editing works |
| **Mindmap** | Switch to Mindmap panel, add nodes | Nodes draggable, connections work |
| **Signatures** | Switch to Signatures panel, draw one | Signature saved as image |
| **AI Translation** | In chat, type text, click AI translate | Text translated in-place |
| **Activity Log** | Switch to Log panel | See all recent actions |

---

## Troubleshooting

### "Page not found" when refreshing

This means the SPA (Single Page Application) redirect is not set up. Make sure you have the `_redirects` file or `netlify.toml` from Step 5.

### "Network Error" or "Failed to fetch"

This usually means the frontend cannot reach the backend. Check:
1. Is the backend running? Visit your Snap Deploy URL directly
2. Are the redirects configured correctly in Step 5?
3. Is `VITE_API_URL` set correctly in Netlify?

### "Database connection failed"

1. Check that `DATABASE_URL` is correct in Snap Deploy
2. Make sure your database is running (check PlanetScale/TiDB dashboard)
3. Ensure SSL is enabled in the connection string

### File uploads not working

1. Check that all S3 environment variables are set in Snap Deploy
2. Verify the S3 bucket exists and has the correct policy
3. Check that the IAM user has S3 permissions

### AI Translation not working

1. Check that `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY` are set
2. These should point to an OpenAI-compatible API endpoint
3. If using OpenAI directly, set the URL to `https://api.openai.com/v1` and use your API key

### WebSocket/Real-time chat not working

WebSocket connections require special handling with Netlify redirects. If real-time features do not work:
1. Users may need to refresh to see new messages (they will still be saved)
2. For full WebSocket support, consider using the backend URL directly for the chat feature
3. Add this to your `netlify.toml`:
```toml
[[redirects]]
  from = "/api/socket.io/*"
  to = "https://YOUR-BACKEND-URL.snapdeploy.app/api/socket.io/:splat"
  status = 200
  force = true
```

---

## Environment Variables Reference

### Backend (Snap Deploy)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | MySQL connection string |
| `JWT_SECRET` | Yes | Random string for signing auth tokens |
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | No | Server port (default: 3000) |
| `BUILT_IN_FORGE_API_URL` | Yes | AI API endpoint URL |
| `BUILT_IN_FORGE_API_KEY` | Yes | AI API authentication key |
| `S3_BUCKET` | Yes | S3 bucket name for file storage |
| `S3_REGION` | Yes | AWS region (e.g., `us-east-1`) |
| `S3_ACCESS_KEY_ID` | Yes | AWS access key for S3 |
| `S3_SECRET_ACCESS_KEY` | Yes | AWS secret key for S3 |
| `OAUTH_SERVER_URL` | If using OAuth | OAuth server base URL |
| `VITE_APP_ID` | Yes | OAuth application ID (e.g., `erectile-dysfunction-tracker`) |
| `VITE_OAUTH_PORTAL_URL` | Yes | OAuth portal URL (e.g., `https://manus.im`) |

### Frontend (Netlify)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend server URL |
| `VITE_APP_TITLE` | No | App title (default: ChatroomLM) |
| `VITE_APP_ID` | Yes | OAuth application ID (must match backend) |
| `VITE_OAUTH_PORTAL_URL` | Yes | OAuth portal URL (must match backend) |

---

## Updating Your Deployment

When you make changes to the code:

1. Save your changes
2. Push to GitHub:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```
3. Both Netlify and Snap Deploy will automatically detect the change and redeploy

> **Automatic deploys** are enabled by default on both platforms. Every time you push code to GitHub, your site updates automatically within a few minutes.

---

## Need Help?

- **Netlify Docs**: [docs.netlify.com](https://docs.netlify.com)
- **Snap Deploy Docs**: Check their documentation site
- **PlanetScale Docs**: [docs.planetscale.com](https://docs.planetscale.com)
- **AWS S3 Docs**: [docs.aws.amazon.com/s3](https://docs.aws.amazon.com/s3)

---

*This guide was written for ChatroomLM Startup Edition. Last updated: April 2026.*
