# Quick Security Fixes Checklist

Use this checklist to quickly secure your application before deployment.

## ❗ CRITICAL - Fix Before Any Deployment

### 1. Remove Hardcoded Database Credentials
**File**: `Website/Backend/__init__.py`

**Find** (around line 13-16):
```python
db_config = {
    "host": os.environ.get("DB_HOST", "movierental.c9wwqmsm68mt.us-east-2.rds.amazonaws.com"),
    "user": os.environ.get("DB_USER", "Matthew1225"),
    "password": os.environ.get("DB_PASSWORD", "Gallifrey1225"),
    "database": os.environ.get("DB_NAME", "movie_rental"),
    "port": int(os.environ.get("DB_PORT", 3306))
}
```

**Replace with**:
```python
db_config = {
    "host": os.environ.get("DB_HOST"),
    "user": os.environ.get("DB_USER"),
    "password": os.environ.get("DB_PASSWORD"),
    "database": os.environ.get("DB_NAME", "movie_rental"),
    "port": int(os.environ.get("DB_PORT", 3306))
}

# Add validation
if not all([db_config["host"], db_config["user"], db_config["password"]]):
    raise ValueError("Database credentials must be set as environment variables")
```

---

### 2. Disable Debug Mode in Production
**File**: `Website/Backend/main.py`

**Find** (line 7):
```python
app.run(host="0.0.0.0", port=port, debug=True)
```

**Replace with**:
```python
debug_mode = os.environ.get("FLASK_ENV") != "production"
app.run(host="0.0.0.0", port=port, debug=debug_mode)
```

**Then set in Render.com environment variables**:
```
FLASK_ENV=production
```

---

### 3. Set Persistent SECRET_KEY
**File**: `Website/Backend/__init__.py`

**Find** (around line 50):
```python
app.config['SECRET_KEY'] = os.urandom(24).hex()
```

**Replace with**:
```python
secret_key = os.environ.get('SECRET_KEY')
if not secret_key:
    raise ValueError("SECRET_KEY must be set in environment variables")
app.config['SECRET_KEY'] = secret_key
```

**Generate a secret key**:
```python
# Run this once locally to generate:
import secrets
print(secrets.token_hex(32))
# Copy the output and set it in Render.com
```

---

### 4. Fix Payment Card Storage (CRITICAL!)

**Option A: Remove Payment Processing Entirely**

**File**: `Website/Backend/views.py`

Comment out or remove the entire `/api/checkout` route (lines ~450-550) and related payment functionality.

**Option B: Integrate Stripe (Recommended)**

1. Sign up at https://stripe.com
2. Install Stripe:
```bash
pip install stripe
```

3. **Replace checkout logic**:
```python
import stripe
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

@views.route('/api/checkout', methods=['POST'])
@login_required
def checkout():
    data = request.get_json()
    stripe_token = data.get('stripe_token')  # From Stripe.js on frontend
    amount = int(float(data.get('amount')) * 100)  # Stripe uses cents
    
    try:
        charge = stripe.Charge.create(
            amount=amount,
            currency='usd',
            source=stripe_token,
            description=f'Movie rental for user {current_user.id}'
        )
        
        # Store only: charge.id, amount, last4 (no card number!)
        # Continue with rental creation...
        
    except stripe.error.CardError as e:
        return jsonify(success=False, error=str(e)), 400
```

4. Update frontend to use Stripe.js (no card numbers sent to your server)

---

### 5. Improve Password Requirements
**File**: `Website/Backend/auth.py`

**Find** (around line 97 in add_user):
```python
if not password or len(password) < 2:
    return jsonify({'success': False, 'error': 'Password must be at least 2 characters.'}), 400
```

**Replace with**:
```python
if not password or len(password) < 8:
    return jsonify({'success': False, 'error': 'Password must be at least 8 characters.'}), 400

if not any(c.isupper() for c in password):
    return jsonify({'success': False, 'error': 'Password must contain uppercase letter.'}), 400

if not any(c.isdigit() for c in password):
    return jsonify({'success': False, 'error': 'Password must contain a number.'}), 400
```

---

## 🔧 HIGH PRIORITY - Fix Within 1 Week

### 6. Add Rate Limiting

**Install**:
```bash
pip install Flask-Limiter
```

**Add to `__init__.py`**:
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)
```

**Add to `auth.py` login route**:
```python
from . import limiter

@auth.route('/login', methods=['GET', 'POST'])
@limiter.limit("5 per minute")
def login():
    # ... existing code
```

---

### 7. Add CSRF Protection

**Install**:
```bash
pip install Flask-WTF
```

**Add to `__init__.py`**:
```python
from flask_wtf.csrf import CSRFProtect

csrf = CSRFProtect()

def create_app():
    # ... existing setup
    csrf.init_app(app)
```

**Update all forms in templates** to include:
```html
<input type="hidden" name="csrf_token" value="{{ csrf_token() }}"/>
```

---

### 8. Add Session Security

**File**: `Website/Backend/__init__.py`

**Add after SECRET_KEY configuration**:
```python
from datetime import timedelta

app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=2)
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

if os.environ.get('FLASK_ENV') == 'production':
    app.config['SESSION_COOKIE_SECURE'] = True  # HTTPS only
```

---

## 📋 Environment Variables Checklist

Set these in Render.com dashboard:

### Required
- [ ] `DB_HOST` - Your Aiven MySQL host
- [ ] `DB_USER` - Your database username
- [ ] `DB_PASSWORD` - Your database password
- [ ] `DB_NAME` - `movie_rental`
- [ ] `DB_PORT` - `3306`
- [ ] `SECRET_KEY` - Generate with `secrets.token_hex(32)`
- [ ] `FLASK_ENV` - `production`

### Optional (if using Stripe)
- [ ] `STRIPE_SECRET_KEY` - From Stripe dashboard
- [ ] `STRIPE_PUBLISHABLE_KEY` - From Stripe dashboard

---

## 🧪 Testing Checklist

After making changes, test:

### Authentication
- [ ] Register new account
- [ ] Login with correct credentials
- [ ] Login with wrong credentials (should fail)
- [ ] Logout
- [ ] Try accessing admin page as customer (should deny)

### Functionality
- [ ] Browse movies
- [ ] Add movie to cart
- [ ] Checkout process (if keeping payment)
- [ ] View rental history
- [ ] Return movie
- [ ] Post review

### Admin Features
- [ ] Login as employee/manager
- [ ] View admin dashboard
- [ ] Add new user
- [ ] Edit user
- [ ] Delete user
- [ ] Add movie
- [ ] Edit movie
- [ ] Delete movie

### Security
- [ ] Check that debug mode is OFF (no stack traces on errors)
- [ ] Verify HTTPS is enabled (lock icon in browser)
- [ ] Try accessing admin API without login (should fail)
- [ ] Try SQL injection in search box (should fail)
- [ ] Check that passwords are hashed in database

---

## 📝 Update requirements.txt

Add any new dependencies:
```txt
Flask
flask-login
flask-bcrypt
flask-cors
mysql-connector-python
gunicorn
Flask-Limiter
Flask-WTF
stripe  # If using Stripe
```

---

## 🚀 Deployment Steps

1. [ ] Make all critical fixes above
2. [ ] Test locally with `FLASK_ENV=development`
3. [ ] Update `requirements.txt`
4. [ ] Commit and push to GitHub
5. [ ] Set environment variables in Render.com
6. [ ] Deploy from Render.com dashboard
7. [ ] Test deployed site thoroughly
8. [ ] Monitor logs for errors

---

## 🆘 Emergency Rollback

If something breaks after deployment:

1. Go to Render.com dashboard
2. Click on your web service
3. Go to "Manual Deploy" or "Rollback"
4. Select previous working deployment
5. Fix issues locally, then redeploy

---

## ✅ Deployment Validation

Your site is ready for production when:
- [ ] No hardcoded credentials in code
- [ ] Debug mode disabled
- [ ] HTTPS enabled
- [ ] All environment variables set
- [ ] Payment processing either removed or using Stripe
- [ ] Strong passwords enforced
- [ ] Rate limiting enabled
- [ ] All tests passing
- [ ] No errors in deployment logs

---

**Time Estimate**: 2-4 hours to implement all critical fixes

**Questions?** Refer to:
- `SECURITY_AND_CODE_QUALITY_REPORT.md` - Detailed explanations
- `REFACTORING_SUMMARY.md` - How to use refactored code
- This file - Quick fixes

Good luck! 🎉
