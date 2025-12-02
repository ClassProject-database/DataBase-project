# Movie Rental Website

A Flask-based movie rental application with user authentication, shopping cart, and admin dashboard.

## 🚀 Free Deployment on Render.com

### Prerequisites
- GitHub account
- Your database credentials (AWS RDS MySQL)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/ClassProject-database/DataBase-project.git
git push -u origin main
```

### Step 2: Deploy on Render.com (FREE)
1. Go to [render.com](https://render.com) and sign up with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `ClassProject-database/DataBase-project`
4. Render will auto-detect the `render.yaml` file
5. **Important**: Add these environment variables in Render dashboard:
   - `DB_HOST`: `movierental.c9wwqmsm68mt.us-east-2.rds.amazonaws.com`
   - `DB_USER`: `Matthew1225`
   - `DB_PASSWORD`: `Gallifrey1225`
   - `DB_NAME`: `movie_rental`
   - `DB_PORT`: `3306`
6. Click **"Create Web Service"**

### Step 3: Your Site Will Be Live!
- URL format: `https://movie-rental-app.onrender.com`
- Free tier spins down after 15 minutes of inactivity
- First request after idle takes ~30 seconds to wake up

## 🔒 Security Notes
- Never commit database credentials to GitHub
- Always set sensitive values as environment variables in Render dashboard
- The `render.yaml` file has been secured (credentials removed)

## 📁 Project Structure
```
Website/
├── Backend/          # Flask backend (auth, views, main)
│   └── templates/    # HTML templates
└── Frontend/
    └── static/       # CSS, JS, images
```

## 🛠️ Local Development
```bash
pip install -r requirements.txt
python Website/Backend/main.py
```

## 💡 Why Not GitHub Pages?
GitHub Pages only hosts static sites (HTML/CSS/JS). This project requires:
- Python Flask backend (server-side processing)
- MySQL database connection
- User authentication & sessions

Therefore, we use Render.com which provides free hosting for full-stack apps.
