import pandas as pd
import sys
import os
import bcrypt
from datetime import datetime
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.connection import db
from database.mongodb_connection import stroke_collection

def create_user(gender, age, row_id):
    """Create a user in MySQL and return the user ID"""
    try:
        email = f"patient_{row_id}@strokeapp.com"
        name = f"Patient {row_id}"
        
        default_password = "Patient123!"
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(default_password.encode('utf-8'), salt).decode('utf-8')
        
        gender_mapped = gender.lower() if gender.lower() in ['male', 'female'] else 'male'
        
        current_year = datetime.now().year
        birth_year = current_year - int(age)
        dob = f"{birth_year}-01-01"
        
        check_user_query = text("SELECT id FROM users WHERE email = :email")
        existing_user = db.execute(check_user_query, {'email': email}).fetchone()
        
        if existing_user:
            return existing_user.id
        
        insert_user_query = text("""
            INSERT INTO users (name, email, password, role, phoneNumber, DOB, gender)
            VALUES (:name, :email, :password, :role, :phoneNumber, :DOB, :gender)
        """)
        
        result = db.execute(insert_user_query, {
            'name': name,
            'email': email,
            'password': hashed_password,
            'role': 'patient',
            'phoneNumber': None,
            'DOB': dob,
            'gender': gender_mapped
        })
        db.commit()
        
        get_user_query = text("SELECT id FROM users WHERE email = :email")
        user = db.execute(get_user_query, {'email': email}).fetchone()
        
        return user.id
    
    except Exception as e:
        db.rollback()
        print(f"Error creating user for row {row_id}: {e}")
        return None

def save_stroke_data_to_mongodb(user_id, user_email, row_data, stroke_result):
    """Save stroke data to MongoDB"""
    try:
        if stroke_collection is None:
            print(f"Warning: MongoDB not connected. Skipping row {row_data.get('id')}")
            return False
        
        bmi = row_data.get('bmi')
        if bmi == 'N/A' or pd.isna(bmi):
            bmi = None
        else:
            try:
                bmi = float(bmi)
            except (ValueError, TypeError):
                bmi = None
        
        stroke_document = {
            "user_id": user_id,
            "user_email": user_email,
            "input_data": {
                "gender": row_data.get('gender'),
                "age": float(row_data.get('age')),
                "hypertension": int(row_data.get('hypertension')),
                "heart_disease": int(row_data.get('heart_disease')),
                "ever_married": row_data.get('ever_married'),
                "work_type": row_data.get('work_type'),
                "Residence_type": row_data.get('Residence_type'),
                "avg_glucose_level": float(row_data.get('avg_glucose_level')),
                "bmi": bmi,
                "smoking_status": row_data.get('smoking_status')
            },
            "prediction": {
                "result": int(stroke_result),
                "probability": 1.0 if stroke_result == 1 else 0.0,
                "risk_level": "High" if stroke_result == 1 else "Low"
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        stroke_collection.insert_one(stroke_document)
        return True
    
    except Exception as e:
        print(f"Error saving stroke data to MongoDB for row {row_data.get('id')}: {e}")
        return False

def seed_data(csv_path):
    """Main function to seed data from CSV"""
    try:
        print(f"Reading CSV file: {csv_path}")
        df = pd.read_csv(csv_path)
        
        print(f"Found {len(df)} rows to process")
        
        success_count = 0
        error_count = 0
        
        for index, row in df.iterrows():
            try:
                row_id = row.get('id', index)
                gender = row.get('gender', 'Male')
                age = row.get('age', 50)
                stroke_result = int(row.get('stroke', 0))
                
                user_id = create_user(gender, age, row_id)
                
                if user_id is None:
                    error_count += 1
                    print(f"Failed to create user for row {row_id}")
                    continue
                
                user_email = f"patient_{row_id}@strokeapp.com"
                
                if save_stroke_data_to_mongodb(user_id, user_email, row, stroke_result):
                    success_count += 1
                    if (index + 1) % 100 == 0:
                        print(f"Processed {index + 1} rows...")
                else:
                    error_count += 1
                    
            except Exception as e:
                error_count += 1
                continue
        
    except FileNotFoundError:
        print(f"Error: CSV file not found at {csv_path}")
    except Exception as e:
        print(f"Error reading CSV file: {e}")

if __name__ == "__main__":
    csv_path = r"C:\Users\HomePC\Documents\stroke_data.csv"
    seed_data(csv_path)



