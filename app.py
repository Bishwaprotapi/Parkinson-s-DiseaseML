from flask import Flask, render_template, request, jsonify
import pickle
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.model_selection import cross_val_score
import joblib

app = Flask(__name__)

# Load the models and scaler
models = {
    'Random Forest': joblib.load('rf_clf.pkl'),
    'SVM': joblib.load('svm_clf.pkl'),
    'KNN': joblib.load('knn_clf.pkl'),
    'Decision Tree': joblib.load('dt_clf.pkl'),
    'Naive Bayes': joblib.load('nb_clf.pkl'),
    'Logistic Regression': joblib.load('lg_clf.pkl')
}

with open('scaler.pkl', 'rb') as f:
    scaler = pickle.load(f)

# Load the dataset for performance calculation
data = pd.read_csv('data.csv')
X = data.drop(['status', 'name'], axis=1)
y = data['status']

# Scale the features
X_scaled = scaler.transform(X)

def calculate_model_metrics():
    metrics = {}
    for model_name, model in models.items():
        # Calculate cross-validation scores
        cv_scores = cross_val_score(model, X_scaled, y, cv=5)
        
        # Make predictions
        y_pred = model.predict(X_scaled)
        
        # Calculate metrics
        metrics[model_name] = {
            'accuracy': float(np.mean(cv_scores)),
            'precision': float(precision_score(y, y_pred)),
            'recall': float(recall_score(y, y_pred)),
            'f1Score': float(f1_score(y, y_pred))
        }
    return metrics

@app.route('/')
def home():
    # Calculate model metrics
    model_metrics = calculate_model_metrics()
    return render_template('index.html', model_metrics=model_metrics)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get values from the form
        data = request.form.to_dict()
        
        # Convert form data to float values
        features = []
        for key, value in data.items():
            if key != 'csrf_token':  # Skip CSRF token
                features.append(float(value))
        
        # Convert to numpy array and reshape
        features = np.array(features).reshape(1, -1)
        
        # Scale the features
        features_scaled = scaler.transform(features)
        
        # Get predictions from all models
        predictions = {}
        for model_name, model in models.items():
            pred = model.predict(features_scaled)
            proba = model.predict_proba(features_scaled)
            predictions[model_name] = {
                'prediction': int(pred[0]),
                'confidence': float(proba[0][pred[0]] * 100)
            }
        
        # Use Random Forest as the main prediction (since it's the best model)
        main_prediction = predictions['Random Forest']
        
        result = {
            'prediction': 'Parkinson\'s Disease Detected' if main_prediction['prediction'] == 1 else 'No Parkinson\'s Disease Detected',
            'confidence': f"{main_prediction['confidence']:.2f}%",
            'all_predictions': predictions
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True) 