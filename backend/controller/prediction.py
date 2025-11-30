from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
import pandas as pd
import numpy as np
import os
import pickle
from .preprocess import preprocess_data
from .jwt_auth import verify_token
from .stroke_data_service import save_stroke_prediction

api = APIRouter(prefix='/prediction', tags=['prediction'])

class StrokePredictionRequest(BaseModel):
    gender: str = Field(..., description="Gender: Male, Female, or Other")
    age: float = Field(..., ge=0, le=150, description="Age in years")
    hypertension: int = Field(..., ge=0, le=1, description="Hypertension: 0 or 1")
    heart_disease: int = Field(..., ge=0, le=1, description="Heart disease: 0 or 1")
    ever_married: str = Field(..., description="Ever married: Yes or No")
    work_type: str = Field(..., description="Work type: Private, Self-employed, Govt_job, children, or Never_worked")
    Residence_type: str = Field(..., description="Residence type: Urban or Rural")
    avg_glucose_level: float = Field(..., ge=0, description="Average glucose level")
    bmi: Optional[float] = Field(None, ge=0, le=100, description="BMI (Body Mass Index), can be None")
    smoking_status: str = Field(..., description="Smoking status: never smoked, formerly smoked, smokes, or Unknown")

class StrokePredictionResponse(BaseModel):
    success: bool
    prediction: int
    probability: float
    risk_level: str
    message: str

def load_model():
    """Load the trained model"""
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(backend_dir, 'stroke_model.pkl')
    if not os.path.exists(model_path):
        raise FileNotFoundError("Model file not found. Please train the model first.")
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    return model

@api.post('/predict', response_model=StrokePredictionResponse)
async def predict_stroke( request: StrokePredictionRequest, token_payload: dict = Depends(verify_token)):
    try:
        if token_payload.get("role") != 'patient':
            raise HTTPException(status_code=400, detail = "You are not authorized to use this endpoint because you are not a patient")
        
        print(token_payload)

        model = load_model()

        input_dict = {
            'id': [0],
            'gender': [request.gender],
            'age': [request.age],
            'hypertension': [request.hypertension],
            'heart_disease': [request.heart_disease],
            'ever_married': [request.ever_married],
            'work_type': [request.work_type],
            'Residence_type': [request.Residence_type],
            'avg_glucose_level': [request.avg_glucose_level],
            'bmi': [request.bmi if request.bmi is not None else np.nan],
            'smoking_status': [request.smoking_status],
            'stroke': [0] 
        }
        
        df = pd.DataFrame(input_dict)
        preprocessed_df = preprocess_data(df)
        
        X_preprocessed = preprocessed_df.drop('stroke', axis=1)
        
        prediction = model.predict(X_preprocessed)[0]
        probability = model.predict_proba(X_preprocessed)[0][1]
        
        if probability < 0.3:
            risk_level = "Low"
            message = "Low risk of stroke based on the provided data."
        elif probability < 0.6:
            risk_level = "Moderate"
            message = "Moderate risk of stroke. Consider lifestyle changes and regular check-ups."
        else:
            risk_level = "High"
            message = "High risk of stroke. Please consult with a healthcare professional."
        
        try:
            user_id = token_payload.get("id")
            user_email = token_payload.get("email", "")
            
            input_data = {
                "gender": request.gender,
                "age": request.age,
                "hypertension": request.hypertension,
                "heart_disease": request.heart_disease,
                "ever_married": request.ever_married,
                "work_type": request.work_type,
                "Residence_type": request.Residence_type,
                "avg_glucose_level": request.avg_glucose_level,
                "bmi": request.bmi,
                "smoking_status": request.smoking_status
            }
            
            save_stroke_prediction(
                user_id=user_id,
                user_email=user_email,
                input_data=input_data,
                prediction=int(prediction),
                probability=float(probability),
                risk_level=risk_level
            )
        except Exception as e:
            print(f"Warning: Failed to save stroke prediction to MongoDB: {str(e)}")
        
        return {
            'success': True,
            'prediction': int(prediction),
            'probability': float(probability),
            'risk_level': risk_level,
            'message': message
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

