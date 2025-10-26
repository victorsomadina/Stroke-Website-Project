from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from pymysql.constants import CLIENT
from dotenv import load_dotenv
import os

load_dotenv()

db_url = f'mysql+pymysql://{os.getenv("dbuser")}:{os.getenv("dbpassword")}@{os.getenv("dbhost")}:{os.getenv("dbport")}/{os.getenv("dbname")}'

engine = create_engine(
    db_url,
    connect_args={"client_flag": CLIENT.MULTI_STATEMENTS}
)

Session = sessionmaker(bind=engine)

db = Session()