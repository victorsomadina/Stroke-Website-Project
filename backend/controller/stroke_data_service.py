from datetime import datetime
from typing import Optional, Dict, Any
from database.mongodb_connection import stroke_collection
from fastapi import HTTPException

def save_stroke_prediction(
    user_id: int,
    user_email: str,
    input_data: Dict[str, Any],
    prediction: int,
    probability: float,
    risk_level: str
) -> str:
    """
    Save stroke prediction data to MongoDB
    
    Args:
        user_id: User ID from token
        user_email: User email from token
        input_data: Input data used for prediction
        prediction: Prediction result (0 or 1)
        probability: Prediction probability
        risk_level: Risk level (Low, Moderate, High)
    
    Returns:
        str: ID of the inserted document
    """
    if stroke_collection is None:
        raise HTTPException(
            status_code=500,
            detail="MongoDB connection not available"
        )
    
    try:
        stroke_document = {
            "user_id": user_id,
            "user_email": user_email,
            "input_data": {
                "gender": input_data.get("gender"),
                "age": input_data.get("age"),
                "hypertension": input_data.get("hypertension"),
                "heart_disease": input_data.get("heart_disease"),
                "ever_married": input_data.get("ever_married"),
                "work_type": input_data.get("work_type"),
                "Residence_type": input_data.get("Residence_type"),
                "avg_glucose_level": input_data.get("avg_glucose_level"),
                "bmi": input_data.get("bmi"),
                "smoking_status": input_data.get("smoking_status")
            },
            "prediction": {
                "result": prediction,
                "probability": probability,
                "risk_level": risk_level
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = stroke_collection.insert_one(stroke_document)
        return str(result.inserted_id)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save stroke prediction data: {str(e)}"
        )

def get_stroke_predictions_by_user(user_id: int, limit: int = 100) -> list:
    """
    Get stroke predictions for a specific user
    
    Args:
        user_id: User ID
        limit: Maximum number of records to return
    
    Returns:
        list: List of stroke prediction documents
    """
    if stroke_collection is None:
        raise HTTPException(
            status_code=500,
            detail="MongoDB connection not available"
        )
    
    try:
        predictions = stroke_collection.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(limit)
        
        result = []
        for pred in predictions:
            pred["_id"] = str(pred["_id"])
            result.append(pred)
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve stroke predictions: {str(e)}"
        )

def get_all_stroke_predictions(limit: int = 100) -> list:
    """
    Get all stroke predictions (admin function)
    
    Args:
        limit: Maximum number of records to return
    
    Returns:
        list: List of all stroke prediction documents
    """
    if stroke_collection is None:
        raise HTTPException(
            status_code=500,
            detail="MongoDB connection not available"
        )
    
    try:
        predictions = stroke_collection.find().sort("created_at", -1).limit(limit)
        
        result = []
        for pred in predictions:
            pred["_id"] = str(pred["_id"])
            result.append(pred)
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve stroke predictions: {str(e)}"
        )



