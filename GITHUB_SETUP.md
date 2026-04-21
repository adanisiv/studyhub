# 📤 How to Upload to GitHub

## Option 1: Create New Repository on GitHub (Recommended)

### Step 1: Create Repository on GitHub Website
1. Go to https://github.com
2. Click the **+** button (top right) → **New repository**
3. Repository name: `studyhub`
4. Description: `Social network for students - Android 2 course project`
5. **⚠️ IMPORTANT:** 
   - ✅ Keep it **PUBLIC** (so you can share the link)
   - ❌ Do NOT initialize with README (we already have one)
6. Click **Create repository**

### Step 2: Connect Your Local Project
GitHub will show you commands. Copy the **second set** (push an existing repository):

```bash
cd /path/to/studyhub
git remote add origin https://github.com/YOUR_USERNAME/studyhub.git
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME` with your GitHub username!**

---

## Option 2: Using GitHub Desktop (Easier for Beginners)

### Step 1: Install GitHub Desktop
Download from: https://desktop.github.com

### Step 2: Publish Repository
1. Open GitHub Desktop
2. File → Add Local Repository
3. Choose the `studyhub` folder
4. Click **Publish repository**
5. Uncheck "Keep this code private" (make it public)
6. Click **Publish repository**

Done! 🎉

---

## ⚠️ BEFORE You Upload — Change Git Config

Your Git identity is currently set to generic values. Update it to your real name and email:

```bash
cd studyhub
git config user.name "Your Real Name"
git config user.email "your.email@example.com"
```

Or globally (for all Git projects):
```bash
git config --global user.name "Your Real Name"
git config --global user.email "your.email@example.com"
```

---

## 📝 Important Files Already Set Up

✅ `.gitignore` — Prevents uploading:
   - `node_modules/` (huge, don't upload)
   - `.env` (contains secrets)
   - Build files

✅ First commit already created with all 40 files

---

## 🔗 Share the Link

After uploading, your repository URL will be:
```
https://github.com/YOUR_USERNAME/studyhub
```

**This is the link you submit in Moodle!**

---

## 🛡️ Security Reminder

The `.env` file contains `JWT_SECRET=your_jwt_secret_change_this`

**Before running in production:**
1. Change `JWT_SECRET` to something random (like: `openssl rand -hex 32`)
2. Never commit the real `.env` to Git (it's already in .gitignore)
3. Each team member creates their own `.env` file locally

---

## 📚 Common Git Commands (After Initial Setup)

### Make changes and push:
```bash
git add .
git commit -m "Description of changes"
git push
```

### Pull changes from teammate:
```bash
git pull
```

### Check status:
```bash
git status
```

### See commit history:
```bash
git log --oneline
```

---

## ❓ Troubleshooting

**Problem:** `git push` asks for username/password repeatedly

**Solution:** Use a Personal Access Token instead of password:
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token → Select "repo" scope → Copy the token
3. When Git asks for password, paste the token (not your GitHub password)

**Problem:** Permission denied

**Solution:** Make sure you're the owner of the repository or have been added as a collaborator.

---

Good luck! 🚀
