# Duplicate Movies Fix

## Problem
Your database had duplicate movies with the same title and year:
- **Interstellar** (2014) - IDs: 1, 50
- **Frozen** (2013) - IDs: 6, 99
- **Tangled** (2010) - IDs: 18, 100
- **Forrest Gump** (1994) - IDs: 21, 48
- **Pulp Fiction** (1994) - IDs: 23, 63
- **Harry Potter and the Half-Blood Prince** (2009) - IDs: 14, 43

## Solutions Implemented

### 1. ✅ Added UNIQUE Constraint
Updated `setup_database.py` to add a unique constraint on `(title, release_year)` in the `movies` table:
```sql
UNIQUE KEY unique_movie (title, release_year)
```
This prevents future duplicate movies from being inserted at the database level.

### 2. ✅ Removed Duplicates from Setup Script
Cleaned up the movie insert statements in `setup_database.py`:
- Removed 6 duplicate entries (IDs: 43, 48, 50, 63, 99, 100)
- Updated genre mappings to reference correct movie IDs
- Now inserts 94 unique movies instead of 100

### 3. ✅ Updated add_movie API
Modified `views.py` to check for existing movies before inserting:
```python
# Checks if movie with same title and year already exists
# Returns HTTP 409 Conflict if duplicate found
```

## How to Clean Your Existing Database

### Option 1: Run the Duplicate Remover Script (Recommended for existing data)
```bash
python remove_duplicates.py
```
This script will:
- Find all duplicate movies in your current database
- Keep the first occurrence (lowest movie_id)
- Delete all duplicates
- Show you what was deleted

### Option 2: Reset Database (Safe - Preserves User Data)
Visit your setup endpoint to recreate movie/rental tables:
```
https://blockboster-rentals.onrender.com/setup-database-now
```
✅ **User accounts are preserved** - Only movies, rentals, and related data are reset!

## Verification

After cleaning duplicates, you can verify by running:
```sql
SELECT title, release_year, COUNT(*) as count
FROM movies
GROUP BY title, release_year
HAVING count > 1;
```

If no results are returned, you have no duplicates! ✅

## Summary of Changes

### Files Modified:
1. **`Website/Backend/setup_database.py`**
   - Added UNIQUE constraint to movies table
   - Removed 6 duplicate movie entries
   - Updated genre mappings
   - Updated success message

2. **`Website/Backend/views.py`**
   - Added duplicate check before inserting new movies
   - Returns meaningful error message if duplicate detected

### Files Created:
1. **`remove_duplicates.py`** - Utility script to clean existing duplicates
2. **`DUPLICATE_FIX_README.md`** - This documentation file

## Future Prevention

With these changes:
- ✅ Database enforces uniqueness at schema level
- ✅ Application checks for duplicates before inserting
- ✅ Setup script no longer inserts duplicates
- ✅ Users get clear error messages if they try to add a duplicate

Your movie database should now be duplicate-free! 🎉
