from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from controller.auth import api as auth_api
from controller.prediction import api as prediction_api
from controller.dashboard import api as dashboard_api
import uvicorn

app = FastAPI(title="Stroke Prediction API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_api)
app.include_router(prediction_api)
app.include_router(dashboard_api)
@app.get('/health')
async def health_check():
    """Health check endpoint"""
    return {'status': 'healthy', 'message': 'Server is running'}

if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="127.0.0.1",
        port=8080,
        reload=True
    )
