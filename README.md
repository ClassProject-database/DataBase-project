# 🎬 Movie Rental Website

Hey! This is our Flask-based movie rental app. Users can browse movies, rent them, leave reviews, and admins can manage the whole thing.

## 🚀 Getting This Thing Live (For FREE!)

Don't worry, we've got you covered. No surprise AWS charges here!

### What You'll Need
- A GitHub account (you already have this!)
- **A free database** - let's set one up!

### Quick Database Setup (FREE Options)

#### Option 1: Railway.app (Recommended - MySQL)
1. Go to [railway.app](https://railway.app) and sign up
2. Click **"New Project"** → **"Database"** → **"MySQL"**
3. Wait for it to deploy (2-3 minutes)
4. Go to **"Variables"** tab - copy these values:
   - `DATABASE_URL`: `mysql://user:password@host:port/database`

#### Option 2: PlanetScale (MySQL)
1. Go to [planetscale.com](https://planetscale.com) and sign up
2. Create a new database
3. Get your connection details from the dashboard

#### Option 3: Supabase (PostgreSQL - requires code changes)
1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Go to **Settings** → **Database** for connection details

### Step 2: Set Up Your Database Schema
Once you have your new database, run the SQL commands in your `SQL db` file to create all the tables:

1. Open your database admin panel (Railway/PlanetScale/Supabase dashboard)
2. Find the SQL query editor
3. Copy and paste the contents of your `SQL db` file
4. Run the queries to create all tables (users, movies, rentals, etc.)

### Option 4: Run MySQL on Your PC (Advanced - Database Only)

**You can run JUST the MySQL database on your PC** and host the Flask app on Render.com. Here's how:

#### Set Up Local MySQL Database:
1. **Install MySQL** on your PC (or use XAMPP/WAMP)
2. **Create database**: `movie_rental`
3. **Run your SQL file** to create all tables
4. **Create a user** for remote access:
   ```sql
   CREATE USER 'remote_user'@'%' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON movie_rental.* TO 'remote_user'@'%';
   FLUSH PRIVILEGES;
   ```

#### Make MySQL Accessible from Internet (⚠️ RISKY):
1. **Port forward** port 3306 on your router
2. **Find your public IP** (whatismyip.com)
3. **Use dynamic DNS** if your IP changes (no-ip.com)

#### Environment Variables for Render:
- `DB_HOST`: your_public_ip (or dynamic DNS address)
- `DB_USER`: remote_user
- `DB_PASSWORD`: your_password
- `DB_NAME`: movie_rental
- `DB_PORT`: 3306

**⚠️ WARNING**: This exposes your database to the internet. Anyone could try to hack it. Use a strong password and consider firewall rules.

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
   - Add these one by one (use the values from your new database):
     - `DB_HOST`: your database host URL
     - `DB_USER`: your database username
     - `DB_PASSWORD`: your database password
     - `DB_NAME`: your database name
     - `DB_PORT`: your database port (usually 3306 for MySQL)
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

## 🏠 Alternative: Run on Your Own PC (Not Recommended)

**You CAN technically run this on your PC**, but it's not great for a class project. Here's why:

### ❌ Problems with Home Hosting:
- **Site goes down** when your PC is off/restarts
- **Slow for others** - your home internet upload speed sucks
- **Security risks** - exposing your home network to the internet
- **Unreliable** - power outages, ISP issues, etc.
- **Not professional** - professors expect hosted solutions

### ✅ If You Really Want To (Advanced Users Only):

#### Quick Local Setup:
```bash
# Install requirements
pip install -r requirements.txt

# Set environment variables (create a .env file)
DB_HOST=your_database_host
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=movie_rental
DB_PORT=3306

# Run the app
python Website/Backend/main.py
```

#### To Make It Public (Complex & Risky):
1. **Port forwarding** on your router (dangerous!)
2. **Dynamic DNS** service (like no-ip.com)
3. **Firewall rules** to expose port 5000
4. **Keep PC running 24/7**

**⚠️ WARNING**: This exposes your home network to hackers. Don't do this unless you know what you're doing.

---

**Much better idea**: Use Render.com like we talked about. It's actually free, always accessible, and professional-looking! 🚀
