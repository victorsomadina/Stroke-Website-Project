from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from controller.auth import api
import uvicorn

app = FastAPI(title="Stroke Prediction API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api)
@app.get('/health')
async def health_check():
    """Health check endpoint"""
    return {'status': 'healthy', 'message': 'Server is running'}

if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
