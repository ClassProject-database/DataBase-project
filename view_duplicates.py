"""
Script to view duplicate movies in the database without making any changes.
This is a safe read-only script to see what duplicates exist.
"""

from Website.Backend import get_db_connection

def view_duplicate_movies():
    """Display all duplicate movies without making any changes"""
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Find all duplicate movies (same title and release_year)
        cursor.execute("""
            SELECT title, release_year, COUNT(*) as count, 
                   GROUP_CONCAT(movie_id ORDER BY movie_id) as movie_ids,
                   GROUP_CONCAT(price ORDER BY movie_id) as prices
            FROM movies
            GROUP BY title, release_year
            HAVING count > 1
            ORDER BY title
        """)
        
        duplicates = cursor.fetchall()
        
        if not duplicates:
            print("✓ No duplicate movies found!")
            print("\nYour database is clean! 🎉")
            cursor.close()
            conn.close()
            return
        
        print(f"Found {len(duplicates)} sets of duplicate movies:\n")
        print("=" * 80)
        
        total_duplicates = 0
        
        for i, dup in enumerate(duplicates, 1):
            movie_ids = [int(id) for id in dup['movie_ids'].split(',')]
            prices = dup['prices'].split(',')
            duplicate_count = len(movie_ids) - 1
            total_duplicates += duplicate_count
            
            print(f"\n{i}. '{dup['title']}' ({dup['release_year']})")
            print(f"   Total copies: {dup['count']}")
            print(f"   Movie IDs and prices:")
            
            for idx, (movie_id, price) in enumerate(zip(movie_ids, prices)):
                marker = "   [KEEP]" if idx == 0 else "   [DELETE]"
                print(f"     - ID: {movie_id:3d}  Price: ${price:>6s}  {marker}")
        
        print("\n" + "=" * 80)
        print(f"\nSummary:")
        print(f"  - {len(duplicates)} unique movies have duplicates")
        print(f"  - {total_duplicates} duplicate entries should be removed")
        print(f"  - {len(duplicates)} entries would remain (one of each)")
        
        print("\nTo remove these duplicates, run:")
        print("  python remove_duplicates.py")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")

if __name__ == "__main__":
    print("=" * 80)
    print("DUPLICATE MOVIE VIEWER (Read-Only)")
    print("=" * 80)
    print("\nThis script will show you all duplicate movies in your database.")
    print("It does NOT make any changes.\n")
    
    view_duplicate_movies()
