from flask import Flask, render_template, request, jsonify
import pickle
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

app = Flask(__name__)

# Load the models and scaler
with open('best_model.pkl', 'rb') as f:
    model = pickle.load(f)
with open('scaler.pkl', 'rb') as f:
    scaler = pickle.load(f)

@app.route('/')
def home():
    return render_template('index.html')

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
        
        # Make prediction
        prediction = model.predict(features_scaled)
        probability = model.predict_proba(features_scaled)
        
        # Get the probability of the predicted class
        confidence = probability[0][prediction[0]] * 100
        
        result = {
            'prediction': 'Parkinson\'s Disease Detected' if prediction[0] == 1 else 'No Parkinson\'s Disease Detected',
            'confidence': f'{confidence:.2f}%'
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True) 