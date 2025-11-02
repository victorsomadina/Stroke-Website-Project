import pandas as pd
import numpy as np
import os
import pickle
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer

def preprocess_data(df):
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dataset_path = os.path.join(backend_dir, 'dataset.csv')
    
    # df = pd.read_csv(dataset_path)
    print(type(df))
    
    X = df.drop(['id', 'stroke'], axis=1)
    y = df['stroke']
    
    if 'bmi' in X.columns:
        X['bmi'] = X['bmi'].replace('N/A', np.nan)
        X['bmi'] = pd.to_numeric(X['bmi'], errors='coerce')
    
    categorical_cols = X.select_dtypes(include=['object']).columns.tolist()
    
    label_encoders = {}
    for col in categorical_cols:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))
        label_encoders[col] = le
    
    X = X.apply(pd.to_numeric, errors='coerce')
    
    imputer = SimpleImputer(strategy='mean')
    X_imputed = imputer.fit_transform(X)
    X = pd.DataFrame(X_imputed, columns=X.columns)
        
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    X_scaled = pd.DataFrame(X_scaled, columns=X.columns)
    
    preprocessed_df = pd.concat([X_scaled, y], axis=1)
        
    processed_data_dir = backend_dir
    preprocessed_path = os.path.join(processed_data_dir, 'preprocessed_data.csv')
    
    preprocessed_df.to_csv(preprocessed_path, index=False)

    return preprocessed_df

