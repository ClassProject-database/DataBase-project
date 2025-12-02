# 🎬 Movie Rental Website

Hey! This is our Flask-based movie rental app. Users can browse movies, rent them, leave reviews, and admins can manage the whole thing.

## 🚀 Getting This Thing Live (For FREE!)

Don't worry, we've got you covered. No surprise AWS charges here!

### What You'll Need
- A GitHub account (you already have this!)
- Your database info (it's on AWS RDS)

### Already Pushed to GitHub ✅
Your code is already on GitHub at `ClassProject-database/DataBase-project`, so we're good to go!

### Let's Deploy on Render.com (Actually Free!)

**Why Render?** They give you 750 free hours per month (that's the whole month!). No credit card, no surprise bills.

**The Catch?** Your site goes to sleep after 15 minutes of no visitors. When someone visits, it wakes up in like 30 seconds. Totally fine for a class project!

#### Here's How:

1. **Go to [render.com](https://render.com)** and click "Get Started"
2. **Sign up using your GitHub account** (super easy)
3. Once you're in, click the big **"New +"** button → pick **"Web Service"**
4. **Connect your GitHub repo**: Look for `ClassProject-database/DataBase-project`
5. **Good news!** Render sees your `render.yaml` file and fills everything in automatically
6. **Important part** - Add your database secrets as environment variables:
   - After connecting your repo, you'll see a section called **"Environment"** or **"Environment Variables"**
   - Click **"Add Environment Variable"** (or similar button)
   - Add these one by one (you know what to put here):
     - `DB_HOST`: your AWS database URL
     - `DB_USER`: your username
     - `DB_PASSWORD`: your password
     - `DB_NAME`: `movie_rental`
     - `DB_PORT`: `3306`
7. **Hit "Create Web Service"** and grab a coffee ☕

#### In About 5 Minutes...
Your site will be live! You'll get a URL like `https://movie-rental-app.onrender.com`

Share it with your professor, friends, whoever. It's legit hosted!

## 🔒 Security Stuff (Important!)

We cleaned up the code so your database password isn't sitting in GitHub for the world to see. Now it's stored safely in Render's environment variables. Much better!

**Never ever** commit passwords to GitHub. Bad things happen.

## 📁 What's What in This Project

```
Website/
├── Backend/          # All the Python/Flask magic
│   └── templates/    # HTML pages
└── Frontend/
    └── static/       # CSS styles, JavaScript, images
```

## 🛠️ Running This Locally

Want to test stuff on your computer first?

```bash
pip install -r requirements.txt
python Website/Backend/main.py
```

Then go to `http://localhost:5000` in your browser.

## 💡 Why Can't We Use GitHub Pages?

Short answer: GitHub Pages is for simple HTML/CSS/JS sites. 

We need:
- A Python server running Flask (for login, cart, all that stuff)
- A MySQL database (for storing users, movies, rentals)
- User sessions and authentication

That's why Render.com is perfect - it handles all of this for free!

---

**Questions?** Just ask. We'll figure it out together! 🚀
