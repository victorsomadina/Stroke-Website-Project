from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional
from .jwt_auth import verify_token
from .stroke_data_service import get_all_stroke_predictions
from database.mySql_connection import db
from sqlalchemy import text

api = APIRouter(prefix='/dashboard', tags=['dashboard'])

class PatientPrediction(BaseModel):
    prediction_id: str
    user_id: int
    user_email: str
    user_name: Optional[str] = None
    input_data: dict
    prediction: dict
    created_at: str

class DashboardResponse(BaseModel):
    success: bool
    total_patients: int
    total_predictions: int
    high_risk_count: int
    moderate_risk_count: int
    low_risk_count: int
    predictions: List[PatientPrediction]
    current_page: int
    total_pages: int
    page_size: int
    has_next: bool
    has_prev: bool

@api.get('/patients', response_model=DashboardResponse)
async def get_all_patients(
    page: int = Query(1, ge=1, description="Page number (starts from 1)"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    token_payload: dict = Depends(verify_token)
):
    """
    Get all patients and their stroke predictions with pagination (Doctor only)
    """
    try:
        if token_payload.get("role") != 'doctor':
            raise HTTPException(
                status_code=403,
                detail="Only doctors can access this endpoint"
            )
        
        all_predictions_data = get_all_stroke_predictions(limit=10000)
        
        user_ids = list(set([pred.get('user_id') for pred in all_predictions_data if pred.get('user_id')]))
        
        user_names = {}
        if user_ids:
            user_ids_tuple = tuple(user_ids)
            if len(user_ids_tuple) == 1:
                query = text("SELECT id, name, email FROM users WHERE id = :user_id")
                users = db.execute(query, {'user_id': user_ids_tuple[0]}).fetchall()
            else:
                placeholders = ','.join([f':id{i}' for i in range(len(user_ids))])
                query = text(f"SELECT id, name, email FROM users WHERE id IN ({placeholders})")
                params = {f'id{i}': user_id for i, user_id in enumerate(user_ids)}
                users = db.execute(query, params).fetchall()
            
            for user in users:
                user_names[user.id] = user.name
        
        all_processed = []
        high_risk = 0
        moderate_risk = 0
        low_risk = 0
        
        for pred in all_predictions_data:
            user_id = pred.get('user_id')
            risk_level = pred.get('prediction', {}).get('risk_level', 'Low')
            
            if risk_level == 'High':
                high_risk += 1
            elif risk_level == 'Moderate':
                moderate_risk += 1
            else:
                low_risk += 1
            
            processed_pred = {
                'prediction_id': pred.get('_id'),
                'user_id': user_id,
                'user_email': pred.get('user_email', ''),
                'user_name': user_names.get(user_id),
                'input_data': pred.get('input_data', {}),
                'prediction': pred.get('prediction', {}),
                'created_at': pred.get('created_at').isoformat() if pred.get('created_at') else ''
            }
            all_processed.append(processed_pred)
        
        all_processed.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        total_predictions = len(all_processed)
        total_pages = (total_predictions + page_size - 1) // page_size  # Ceiling division
        current_page = min(page, total_pages) if total_pages > 0 else 1
        
        start_idx = (current_page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_predictions = all_processed[start_idx:end_idx]
        
        return {
            'success': True,
            'total_patients': len(user_ids),
            'total_predictions': total_predictions,
            'high_risk_count': high_risk,
            'moderate_risk_count': moderate_risk,
            'low_risk_count': low_risk,
            'predictions': paginated_predictions,
            'current_page': current_page,
            'total_pages': total_pages,
            'page_size': page_size,
            'has_next': current_page < total_pages,
            'has_prev': current_page > 1
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving patient data: {str(e)}"
        )

