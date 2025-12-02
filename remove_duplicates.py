"""
Script to remove duplicate movies from the database.
Keeps the movie with the lowest movie_id for each duplicate set.

Run this BEFORE running the setup-database-now endpoint if you want to clean existing data.
"""

from Website.Backend import get_db_connection

def remove_duplicate_movies():
    """Find and remove duplicate movies, keeping the first occurrence"""
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Find all duplicate movies (same title and release_year)
        cursor.execute("""
            SELECT title, release_year, COUNT(*) as count, 
                   GROUP_CONCAT(movie_id ORDER BY movie_id) as movie_ids
            FROM movies
            GROUP BY title, release_year
            HAVING count > 1
        """)
        
        duplicates = cursor.fetchall()
        
        if not duplicates:
            print("✓ No duplicate movies found!")
            cursor.close()
            conn.close()
            return
        
        print(f"Found {len(duplicates)} sets of duplicate movies:\n")
        
        total_deleted = 0
        
        for dup in duplicates:
            movie_ids = [int(id) for id in dup['movie_ids'].split(',')]
            keep_id = movie_ids[0]  # Keep the first (lowest) ID
            delete_ids = movie_ids[1:]  # Delete the rest
            
            print(f"Movie: '{dup['title']}' ({dup['release_year']})")
            print(f"  - Keeping movie_id: {keep_id}")
            print(f"  - Deleting movie_ids: {delete_ids}")
            
            # Delete duplicate movies (CASCADE will handle related tables)
            for delete_id in delete_ids:
                cursor.execute("DELETE FROM movies WHERE movie_id = %s", (delete_id,))
                total_deleted += 1
            
            print()
        
        conn.commit()
        print(f"✓ Successfully removed {total_deleted} duplicate movies!")
        print(f"✓ Kept {len(duplicates)} unique movies (one copy of each)")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        if conn:
            conn.rollback()

if __name__ == "__main__":
    print("=" * 60)
    print("DUPLICATE MOVIE REMOVER")
    print("=" * 60)
    print("\nThis script will remove duplicate movies from your database.")
    print("It keeps the movie with the lowest ID for each duplicate set.\n")
    
    response = input("Do you want to proceed? (yes/no): ").strip().lower()
    
    if response in ['yes', 'y']:
        print("\nProcessing...\n")
        remove_duplicate_movies()
    else:
        print("\nOperation cancelled.")
