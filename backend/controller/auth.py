from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, field_validator
from database.connection import db, Session
from sqlalchemy import text
import bcrypt
import re
from typing import Optional

api = APIRouter(prefix='/auth', tags=['authentication'])

class SignupRequest(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
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
        
        if password != request.confirmPassword:
            raise HTTPException(
                status_code=400,
                detail="Passwords do not match"
            )
        
        check_user_query = text("SELECT * FROM users WHERE email = :email")
        existing_user = db.execute(check_user_query, {'email': email}).fetchone()
        
        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="User with this email already exists"
            )
        
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
        full_name = f"{first_name} {last_name}"
        
        insert_user_query = text("""
            INSERT INTO users (name, email, password)
            VALUES (:name, :email, :password)
        """)
        
        db.execute(insert_user_query, {
            'name': full_name,
            'email': email,
            'password': hashed_password
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
        
        user_dict = {
            'id': user.id,
            'name': user.name,
            'email': user.email
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
