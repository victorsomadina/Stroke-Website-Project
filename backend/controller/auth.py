from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, field_validator
from database.mySql_connection import db, Session
from sqlalchemy import text
import bcrypt
import re
from typing import Optional
import jwt
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

api = APIRouter(prefix='/auth', tags=['authentication'])

class SignupRequest(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    role: str
    phone: Optional[str] = None
    password: str
    confirmPassword: str
    dateOfBirth: Optional[str] = None
    gender: Optional[str] = None
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        return v

class SigninRequest(BaseModel):
    email: EmailStr
    password: str

class SignupResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

class SigninResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

def is_valid_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

@api.post('/signup', response_model=SignupResponse, status_code=201)
async def signup(request: SignupRequest):
    """User registration endpoint"""
    try:
        first_name = request.firstName.strip()   
        last_name = request.lastName.strip()
        email = request.email.strip()
        password = request.password
        role = request.role
        dob = request.dateOfBirth.strip()
        gender = request.gender.strip()
        phone = request.phone.strip()
        
        # logic one: check confirm equals password
        if password != request.confirmPassword:
            raise HTTPException(
                status_code=400,
                detail="Passwords do not match"
        )
        
        #logic two: check that a user already exists in the database
        check_user_query = text("SELECT * FROM users WHERE email = :email")
        existing_user = db.execute(check_user_query, {'email': email}).fetchone()
        
        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="User with this email already exists"
            )
        
        # logic three: Basically to insert the values into the database
        # logic 3A
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
        # logic 3B
        full_name = f"{first_name} {last_name}"
        
        # logic 3c
        if role not in ['patient', 'doctor']:
            raise HTTPException(
                status_code=400,
                detail="Role must be either 'patient' or 'doctor'"
        )
        
        # logic 3d
        insert_user_query = text("""
            INSERT INTO users (name, email, password, role, phoneNumber, DOB, gender)
            VALUES (:name, :email, :password, :role, :phoneNumber, :DOB, :gender)
        """)
        
        db.execute(insert_user_query, {
            'name': full_name,
            'email': email,
            'password': hashed_password,
            'role': role,
            'phoneNumber': phone,
            'DOB': dob,
            'gender': gender
        })
        db.commit()
        
        return {
            'success': True,
            'message': 'Account created successfully',
            'data': {
                'name': full_name,
                'email': email
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f'An error occurred during registration: {str(e)}'
        )

@api.post('/signin', response_model=SigninResponse, status_code=200)
async def signin(request: SigninRequest):
    """User authentication endpoint"""
    try:
        email = request.email.strip()
        password = request.password
        
        get_user_query = text("SELECT * FROM users WHERE email = :email")
        user = db.execute(get_user_query, {'email': email}).fetchone()
        
        if not user:
            raise HTTPException(
                status_code=401,
                detail='Invalid email or password'
            )
        
        stored_password = user.password.encode('utf-8') if isinstance(user.password, str) else user.password
        password_bytes = password.encode('utf-8')
        
        if not bcrypt.checkpw(password_bytes, stored_password):
            raise HTTPException(
                status_code=401,
                detail='Invalid email or password'
            )
        
        expiry = datetime.now() + timedelta(minutes=int(os.getenv("expiry_time", 1440)))
        details = {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "exp": expiry
        }
        
        secret_key = os.getenv("secret_key")
        if not secret_key:
            raise HTTPException(status_code=500, detail="Server configuration error: secret_key not found")
        
        token = jwt.encode(details, secret_key, algorithm="HS256")
        
        user_dict = {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            "token": token
        }
        
        return {
            'success': True,
            'message': 'Sign in successful',
            'data': user_dict
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f'An error occurred during authentication: {str(e)}'
        )
