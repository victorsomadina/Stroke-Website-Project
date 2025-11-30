from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_USERNAME = os.getenv("mongo_user")
MONGODB_PASSWORD = os.getenv("mongo_password")
MONGODB_CLUSTER = os.getenv("mongo_cluster")
MONGODB_DB_NAME = os.getenv("mongo_name")

mongodb_uri = f"mongodb+srv://{MONGODB_USERNAME}:{MONGODB_PASSWORD}@{MONGODB_CLUSTER}/"

try:
    client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=3000, 
                         tls=True,
                         tlsAllowInvalidCertificates=False,
                         tlsAllowInvalidHostnames=False)
    client.admin.command('ping')
    db = client[MONGODB_DB_NAME]
    stroke_collection = db["stroke_data"]
except Exception as e:
    print(f"MongoDB connection error: {e}")
    client = None
    db = None
    stroke_collection = None

