# Movie Rental Website - Security & Code Quality Report
**Updated: December 2, 2025**  
**Deployment:** https://blockboster-rentals.onrender.com  
**Database:** Aiven MySQL 8.x (defaultdb)

---

## Executive Summary

This report provides a comprehensive security audit of the Flask-based movie rental application after recent code improvements and cleanup.

**Overall Security Rating: ⚠️ MODERATE RISK**

The application demonstrates solid functional implementation with **significant improvements** in connection management and environment security. However, **CRITICAL payment security vulnerabilities remain** that must be addressed before handling real customer data.

**Key Improvements Made:**
- ✅ Connection pool leak fixes (all routes use try-finally)
- ✅ Environment variable validation
- ✅ SQL injection protection (parameterized queries)
- ✅ Code cleanup (removed unused imports, dead code)
- ✅ Bcrypt password hashing

**Critical Issues Remaining:**
- 🔴 **CRITICAL**: Storing card numbers (even hashed) violates PCI DSS
- 🔴 **HIGH**: Weak password requirements (2 chars minimum!)
- 🟡 **MEDIUM**: No CSRF protection
- 🟡 **MEDIUM**: Session key regenerated on every restart
- 🟡 **MEDIUM**: No rate limiting on login/API endpoints

---

## Part 1: Application Architecture

### Technology Stack
```
Frontend: HTML/CSS/JavaScript (static files)
Backend: Python 3.x + Flask 3.1.2
Database: MySQL 8.x (Aiven Cloud)
Auth: Flask-Login + Bcrypt
Deployment: Render.com (Gunicorn WSGI)
Connection Pool: mysql-connector-python (size=10)
```

### File Structure
```
DataBase-project/
├── render.yaml                    # Deployment config
├── requirements.txt               # Dependencies
├── Website/
│   └── Backend/
│       ├── main.py               # Entry point (creates app)
│       ├── __init__.py           # App factory + DB pool
│       ├── auth.py               # Login/logout/signup (3 routes)
│       └── views.py              # Business logic (25 routes)
```

### Entry Point
```
render.yaml → gunicorn → Website.Backend.main:app
                              ↓
                         create_app() from __init__.py
                              ↓
                    Registers blueprints: views, auth
```

### User Roles & Permissions

| Role | Count | Permissions |
|------|-------|-------------|
| **Customer** | Default signup | Browse, rent, return movies, post reviews |
| **Employee** | Admin-created | + Manage customers, add/edit/delete movies, view all rentals |
| **Manager** | Admin-created | + Manage employees/managers, full admin access |

**Access Control Method:** `@login_required` decorator + role checks (`current_user.role`)

---

## Part 2: Security Audit

### 🔴 CRITICAL VULNERABILITIES

#### 1. Payment Card Storage (PCI DSS Violation)
**File:** `views.py:570`
```python
hashed_card = generate_password_hash(card_number).decode()
cursor.execute("""
    INSERT INTO payment (account_id, card_holder_name, card_number, ...)
    VALUES (%s,%s,%s,...)
""", (..., hashed_card, ...))
```

**Issue:** Application stores card numbers in database (even hashed)

**Why It's Critical:**
- PCI DSS **strictly prohibits** storing full card numbers
- Bcrypt hashing does NOT meet PCI DSS encryption requirements
- Violates PCI DSS requirements 3.2, 3.4, 3.5
- Creates massive liability for data breaches
- Can result in $5,000-$100,000 fines per violation

**Impact:** ⚠️ **This single vulnerability makes the app ILLEGAL for real payments**

**Fix Required:**
```python
# OPTION 1: Use payment processor (Stripe, PayPal)
import stripe
stripe_token = stripe.Token.create(card={...})  # Card never touches your server
charge = stripe.Charge.create(amount=total, source=stripe_token.id)

# OPTION 2: Store ONLY last 4 digits + payment processor reference
last_four = card_number[-4:]
cursor.execute("""
    INSERT INTO payment (account_id, card_last_four, stripe_charge_id, ...)
    VALUES (%s, %s, %s, ...)
""", (user_id, last_four, charge.id, ...))
```

**Recommendation:** Remove ALL card storage immediately. Use Stripe or similar.

---

#### 2. Weak Password Requirements
**File:** `views.py:205-206`
```python
if not password or len(password) < 2:
    return jsonify({'success': False, 'error': 'Password must be at least 2 characters.'}), 400
```

**Issue:** Minimum password length is only **2 characters**

**Why It's Critical:**
- "ab" is a valid password
- Trivial for brute force attacks (seconds to crack)
- No complexity requirements (upper, lower, number, special char)
- NIST recommends minimum 8 characters
- OWASP recommends 10+ characters

**Impact:** User accounts easily compromised

**Fix Required:**
```python
import re

def validate_password(password):
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain lowercase letter"
    if not re.search(r'[0-9]', password):
        return False, "Password must contain a number"
    return True, None

# In signup and add_user:
valid, error = validate_password(password)
if not valid:
    return jsonify({'success': False, 'error': error}), 400
```

**Also Affects:** 
- `auth.py:signUp()` - No password validation at all (line 66)
- Default Admin user likely has weak password "password"

---

### 🟡 HIGH PRIORITY ISSUES

#### 3. No CSRF Protection
**Files:** All POST routes in `views.py` and `auth.py`

**Issue:** Application does not implement CSRF tokens

**Why It Matters:**
- Attackers can trick logged-in users into making unwanted requests
- Can delete user accounts, add movies, process fake rentals
- Especially dangerous for `/api/checkout` and `/api/delete_user`

**Attack Example:**
```html
<!-- Attacker's malicious website -->
<img src="https://blockboster-rentals.onrender.com/api/delete_user" 
     onerror="fetch('https://blockboster-rentals.onrender.com/api/checkout', {
         method: 'POST',
         credentials: 'include',
         body: JSON.stringify({cart: attackerCart, ...})
     })">
```

**Fix Required:**
```python
# In __init__.py
from flask_wtf.csrf import CSRFProtect
csrf = CSRFProtect()

def create_app():
    app = Flask(__name__)
    csrf.init_app(app)
    
    # Exempt API routes if using JSON (add CORS origin checks instead)
    csrf.exempt('views.checkout')  # Only if you add proper token validation
```

**Recommendation:** Implement Flask-WTF CSRF protection immediately

---

#### 4. Dynamic Session Secret Key
**File:** `__init__.py:62`
```python
app.config['SECRET_KEY'] = os.urandom(24).hex()
```

**Issue:** Secret key regenerated on every app restart

**Impact:**
- All user sessions invalidated when app restarts/redeploys
- Users forcibly logged out during deployments
- Session cookies become invalid and unverifiable

**Fix Required:**
```python
# In __init__.py
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
if not app.config['SECRET_KEY']:
    raise ValueError("SECRET_KEY environment variable not set")

# Add to Render.com env vars:
SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(32))">
```

---

#### 5. No Rate Limiting
**Files:** `auth.py:login()`, all API routes in `views.py`

**Issue:** No protection against brute force or API abuse

**Attack Scenarios:**
- Brute force login attempts (unlimited tries)
- API flooding to cause database exhaustion
- Review spam (unlimited reviews per user)
- Admin API abuse

**Fix Required:**
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Apply to sensitive routes:
@auth.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    ...

@views.route('/api/post_review', methods=['POST'])
@limiter.limit("10 per hour")
def post_review():
    ...
```

---

### 🟢 WORKING SECURITY MEASURES

#### ✅ SQL Injection Protection
All queries use parameterized statements:
```python
cursor.execute("SELECT * FROM users WHERE username = %s", (username,))  # ✅ Safe
cursor.execute(f"SELECT * FROM users WHERE username = '{username}'")   # ❌ Would be vulnerable
```

**Status:** No SQL injection vulnerabilities found across all 25 routes.

---

#### ✅ Password Hashing
Uses Bcrypt for password storage:
```python
hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
# Stored in database, never plain text
```

**Note:** While hashing is correct, minimum password length of 2 undermines this.

---

#### ✅ Connection Pool Management
All routes now use try-finally blocks:
```python
conn = None
try:
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    # ... database operations ...
finally:
    if conn:
        conn.close()
```

**Status:** Connection pool leaks fixed. No more "pool exhausted" errors.

---

#### ✅ Environment Variable Security
Database credentials properly secured:
```python
# __init__.py
db_config = {
    "host": os.environ.get("DB_HOST"),
    "user": os.environ.get("DB_USER"),
    "password": os.environ.get("DB_PASSWORD"),
    "database": os.environ.get("DB_NAME"),
    "port": int(os.environ.get("DB_PORT", 3306))
}

# Validates all required vars
required_vars = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"]
missing_vars = [var for var in required_vars if not os.environ.get(var)]
if missing_vars:
    raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
```

**Status:** No hardcoded credentials found. All secrets in environment variables.

---

#### ✅ Role-Based Access Control
Proper authorization checks on admin routes:
```python
@views.route('/admin', methods=['GET'])
@login_required
def admin_dashboard():
    if current_user.role not in ['employee', 'manager']:
        abort(403, description="Only employees and managers can access admin dashboard.")
```

**Hierarchy Enforced:**
- Employees can only manage customers
- Managers can manage employees
- Users cannot escalate their own privileges

---

## Part 3: Code Quality Assessment

### ✅ Recent Improvements

1. **Removed Unused Code**
   - Deleted `app.py` (redundant entry point)
   - Deleted `setup_database.py` (initialization routes)
   - Removed duplicate imports (`flask.session`, `current_app`)
   - Removed debug statements (`sys.stdout.reconfigure`, `print()`)

2. **Consistent Error Handling**
   - All 25 routes use try-finally for connections
   - Proper rollback on write errors
   - Cursors closed before returning

3. **Clean Blueprint Structure**
   - `auth.py`: 3 routes (login, logout, signup)
   - `views.py`: 25 routes (movies, admin, rentals, checkout)
   - No circular imports or dead blueprints

### 🟡 Code Quality Issues

#### 1. No Input Validation
**Missing validation on:**
- Email format (accepts "test" as email)
- Phone format (no standardization)
- Movie prices (can be negative)
- Release years (can be 9999+, though capped)

**Example:**
```python
email = data.get('email', '').strip()  # No validation!
cursor.execute("INSERT INTO users (..., email, ...) VALUES (..., %s, ...)", (email,))
```

**Recommendation:**
```python
import re

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    cleaned = re.sub(r'[^\d]', '', phone)
    return len(cleaned) == 10  # US format
```

---

#### 2. Error Logging Uses print()
**File:** Multiple routes
```python
except Exception as e:
    print(f"Error during checkout: {e}")  # ❌ Goes to console only
    return jsonify(success=False, error="Checkout failed"), 500
```

**Issue:** 
- Errors not logged to persistent storage
- No error tracking or monitoring
- Cannot debug production issues

**Fix Required:**
```python
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# In routes:
except Exception as e:
    logger.error(f"Checkout failed for user {current_user.id}: {str(e)}", exc_info=True)
    return jsonify(success=False, error="Checkout failed"), 500
```

---

#### 3. Hardcoded Discount Codes
**File:** `views.py:561-567`
```python
if discount_code == "VIP":
    final_price = round(total_price * 0.80, 2)
elif discount_code == "ADMIN":
    final_price = 0.00
```

**Issues:**
- Codes hardcoded in application
- No expiration dates
- No usage limits
- "ADMIN" code gives 100% discount to anyone who knows it

**Recommendation:** Move discount codes to database with:
- Expiration dates
- Usage limits (per user / total)
- Minimum purchase requirements
- Admin interface to manage codes

---

## Part 4: Security Recommendations

### Immediate Actions (Before Production)

| Priority | Action | Files Affected | Effort |
|----------|--------|----------------|--------|
| 🔴 **P0** | Remove card storage, integrate Stripe/PayPal | `views.py:checkout()` | High |
| 🔴 **P0** | Increase password requirements to 8+ chars | `views.py:add_user()`, `auth.py:signUp()` | Low |
| 🟡 **P1** | Add CSRF protection | All POST routes | Medium |
| 🟡 **P1** | Use persistent SECRET_KEY | `__init__.py` | Low |
| 🟡 **P1** | Add rate limiting | `auth.py:login()`, API routes | Medium |
| 🟢 **P2** | Add input validation | All form handlers | Medium |
| 🟢 **P2** | Implement proper logging | All routes | Low |
| 🟢 **P2** | Move discount codes to database | `views.py:checkout()` | Medium |

### Medium-Term Improvements

1. **Add Security Headers**
```python
@app.after_request
def set_security_headers(response):
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response
```

2. **Implement HTTPS Everywhere**
   - Render.com provides HTTPS by default
   - Add HTTP → HTTPS redirect
   - Set secure cookie flags

3. **Add API Authentication**
   - Consider JWT tokens for API routes
   - Separate session auth from API auth

4. **Database Security**
   - Enable SSL for MySQL connections
   - Use read-only database user for query routes
   - Implement backup strategy

### Long-Term Recommendations

1. **Monitoring & Alerting**
   - Integrate Sentry for error tracking
   - Add Datadog/New Relic for performance monitoring
   - Set up alerts for failed logins, errors

2. **Compliance**
   - Remove all payment processing (use Stripe)
   - Add privacy policy and terms of service
   - Implement GDPR data export/deletion

3. **Testing**
   - Add unit tests for auth functions
   - Add integration tests for checkout flow
   - Implement security scanning in CI/CD

---

## Part 5: Conclusion

### Current State
The application is **functional and improving** with recent connection management fixes and code cleanup. However, it has **critical payment security issues** that make it unsuitable for production use with real customer data.

### Risk Summary
- ✅ **Low Risk:** SQL injection, connection leaks, environment security
- 🟡 **Medium Risk:** CSRF, rate limiting, input validation
- 🔴 **High Risk:** Card storage, weak passwords

### Deployment Readiness
**Status:** ⚠️ **NOT READY for production with real payments**

**Safe for:**
- Educational/demo purposes
- Testing with fake data
- Portfolio showcase (clearly marked as demo)

**NOT safe for:**
- Real customer credit cards
- Real payment processing
- Production deployment with actual users

### Next Steps
1. **IMMEDIATELY:** Stop storing card numbers (remove payment table inserts)
2. **Week 1:** Implement Stripe integration
3. **Week 2:** Add CSRF protection and password requirements
4. **Week 3:** Add rate limiting and proper logging
5. **Week 4:** Security audit + penetration testing

---

## Appendix: Route Inventory

### Public Routes (No Auth Required)
- `GET /` - Home page
- `GET /inventory` - Browse movies
- `GET /login` - Login form
- `POST /login` - Process login
- `GET /signUp` - Signup form
- `POST /signUp` - Process signup

### Customer Routes (`@login_required`)
- `GET /user_Rentals` - View rental history
- `POST /api/checkout` - Process rental
- `POST /api/return_movie/<rental_id>/<movie_id>` - Return movie
- `POST /api/post_review` - Submit review
- `GET /movie/<movie_id>` - Movie details

### Employee/Manager Routes (`role check`)
- `GET /admin` - Admin dashboard
- `GET /admin/user/<account_id>` - View user details
- `POST /api/add_user` - Create user
- `POST /api/delete_user` - Delete user
- `POST /api/update_user` - Edit user
- `POST /api/add_movie` - Add movie
- `POST /api/update_movie` - Edit movie
- `POST /api/delete_movie` - Delete movie

### API Routes (Various Auth)
- `GET /api/movies` - Search/filter movies
- `GET /api/movies/all` - All movies
- `GET /api/movies/random` - Random 10 movies
- `GET /api/rentals` - User's rentals
- `GET /api/reviews/random` - Random reviews
- `GET /api/search_users` - Admin user search
- `GET /api/search_rented_movies` - User's rented movies search

**Total Routes:** 28 (3 auth + 25 views)

---

**Report End** | Generated: December 2, 2025 | Reviewed By: AI Code Assistant
