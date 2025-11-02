import pandas as pd
import os
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (accuracy_score, precision_score, recall_score, f1_score,confusion_matrix)
from imblearn.over_sampling import SMOTE
from preprocess import preprocess_data


def load_preprocessed_data():
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    preprocessed_path = os.path.join(backend_dir, 'preprocessed_data.csv')
    df = pd.read_csv(preprocessed_path)
    
    X = df.drop('stroke', axis=1)
    y = df['stroke']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    smote = SMOTE(random_state=42)
    X_train_resampled, y_train_resampled = smote.fit_resample(X_train, y_train)
    
    X_train_resampled = pd.DataFrame(X_train_resampled, columns=X_train.columns)
    y_train_resampled = pd.Series(y_train_resampled)
    
    return X_train_resampled, X_test, y_train_resampled, y_test

def train_random_forest(X_train, y_train, n_estimators=100, random_state=42):
    rf_model = RandomForestClassifier(
        n_estimators=n_estimators,
        random_state=random_state,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        n_jobs=-1
    )
    
    rf_model.fit(X_train, y_train)  

    return rf_model

def evaluate_model(model, X_test, y_test):
    y_pred = model.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    
    cm = confusion_matrix(y_test, y_pred)
    
    feature_importance = pd.DataFrame({
        'feature': X_test.columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print(feature_importance.head(10).to_string(index=False))
    
    metrics = {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1_score': f1,
        'confusion_matrix': cm.tolist()
    }
    return metrics

def save_model(model, filepath):
    with open(filepath, 'wb') as f:
        pickle.dump(model, f)

def main():
    try:
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        dataset_path = os.path.join(backend_dir, 'dataset.csv')
        df = pd.read_csv(dataset_path)
        
        preprocess_data(df)
        
        X_train, X_test, y_train, y_test = load_preprocessed_data()
        model = train_random_forest(X_train, y_train, n_estimators=100)
        metrics = evaluate_model(model, X_test, y_test)
        
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        model_path = os.path.join(backend_dir, 'stroke_model.pkl')
        save_model(model, model_path)
        
        metrics_path = os.path.join(backend_dir, 'model_metrics.txt')
        with open(metrics_path, 'w') as f:
            f.write("Random Forest Model Evaluation Metrics\n")
            f.write("=" * 60 + "\n\n")
            f.write(f"Accuracy:  {metrics['accuracy']:.4f}\n")
            f.write(f"Precision: {metrics['precision']:.4f}\n")
            f.write(f"Recall:    {metrics['recall']:.4f}\n")
            f.write(f"F1-Score:  {metrics['f1_score']:.4f}\n")
    except Exception as e:
        print(str(e))

if __name__ == "__main__":
    main()

