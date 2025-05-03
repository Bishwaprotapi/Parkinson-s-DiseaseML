from flask import Flask, render_template, request, jsonify
import pickle
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.model_selection import cross_val_score, train_test_split
import joblib
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Load the models and scaler
try:
    models = {
        'Random Forest': joblib.load('rf_clf.pkl'),
        'SVM': joblib.load('svm_clf.pkl'),
        'KNN': joblib.load('knn_clf.pkl'),
        'Decision Tree': joblib.load('dt_clf.pkl'),
        'Naive Bayes': joblib.load('nb_clf.pkl'),
        'Logistic Regression': joblib.load('lg_clf.pkl')
    }
    logger.info("Successfully loaded all models")
except Exception as e:
    logger.error(f"Error loading models: {str(e)}")
    raise

try:
    with open('scaler.pkl', 'rb') as f:
        scaler = pickle.load(f)
    logger.info("Successfully loaded scaler")
except Exception as e:
    logger.error(f"Error loading scaler: {str(e)}")
    raise

# Load the dataset for performance calculation
try:
    data = pd.read_csv('data.csv')
    X = data.drop(['status', 'name'], axis=1)
    y = data['status']
    logger.info("Successfully loaded dataset")
except Exception as e:
    logger.error(f"Error loading dataset: {str(e)}")
    raise

# Split the data for evaluation
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Scale the features
X_train_scaled = scaler.transform(X_train)
X_test_scaled = scaler.transform(X_test)

def calculate_model_metrics():
    metrics = {}
    for model_name, model in models.items():
        try:
            # Train the model
            model.fit(X_train_scaled, y_train)
            
            # Make predictions
            y_pred = model.predict(X_test_scaled)
            
            # Calculate metrics
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred)
            recall = recall_score(y_test, y_pred)
            f1 = f1_score(y_test, y_pred)
            
            # Calculate confusion matrix
            cm = confusion_matrix(y_test, y_pred)
            tn, fp, fn, tp = cm.ravel()
            
            # Calculate additional metrics
            specificity = tn / (tn + fp)  # True Negative Rate
            sensitivity = tp / (tp + fn)  # True Positive Rate
            
            metrics[model_name] = {
                'accuracy': float(accuracy),
                'precision': float(precision),
                'recall': float(recall),
                'f1Score': float(f1),
                'specificity': float(specificity),
                'sensitivity': float(sensitivity),
                'confusion_matrix': {
                    'true_negative': int(tn),
                    'false_positive': int(fp),
                    'false_negative': int(fn),
                    'true_positive': int(tp)
                }
            }
            logger.info(f"Successfully calculated metrics for {model_name}")
        except Exception as e:
            logger.error(f"Error calculating metrics for {model_name}: {str(e)}")
            raise
    
    logger.debug(f"Calculated metrics: {metrics}")
    return metrics

def get_accuracy_class(accuracy):
    if accuracy >= 0.85:
        return 'accuracy-high'
    elif accuracy >= 0.75:
        return 'accuracy-medium'
    else:
        return 'accuracy-low'

@app.route('/')
def home():
    try:
        # Calculate model metrics
        model_metrics = calculate_model_metrics()
        logger.debug(f"Model metrics being sent to template: {model_metrics}")
        return render_template('index.html', model_metrics=model_metrics, get_accuracy_class=get_accuracy_class)
    except Exception as e:
        logger.error(f"Error in home route: {str(e)}")
        return str(e), 500

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
        logger.error(f"Error in predict route: {str(e)}")
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True) 