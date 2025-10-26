import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from database.connection import db, engine
from sqlalchemy import text

def init_database():
    try:
        create_table_query = text("""
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
        """)
        
        db.execute(create_table_query)
        db.commit()
        print("Database tables created successfully!")
        return True
        
    except Exception as e:
        print(f"Error creating tables: {str(e)}")
        db.rollback()
        return False

if __name__ == "__main__":
    print("Initializing database...")
    init_database()
