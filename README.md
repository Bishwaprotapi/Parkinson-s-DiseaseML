# Parkinson's Disease Prediction System

A web-based application that uses machine learning to predict Parkinson's Disease based on voice measurements. The system employs multiple machine learning models and provides a user-friendly interface for inputting voice measurements and viewing predictions.

## Model Performance Visualizations

### Confusion Matrices
![Confusion Matrices](docs/images/confusion_matrices.png)
*Figure 1: Confusion matrices for all models showing true positives, false positives, true negatives, and false negatives*

### Model Comparison
![Model Comparison](docs/images/model_comparison.png)
*Figure 2: Comparison of accuracy, precision, recall, and F1-score across all models*

### ROC Curves
![ROC Curves](docs/images/roc_curves.png)
*Figure 3: ROC curves showing the trade-off between true positive rate and false positive rate*

### Feature Importance
![Feature Importance](docs/images/feature_importance.png)
*Figure 4: Feature importance analysis for tree-based models*

### Data Distribution
![Feature Distributions](docs/images/feature_distributions.png)
*Figure 5: Distribution of key features in the dataset*

### Correlation Matrix
![Correlation Matrix](docs/images/correlation_matrix.png)
*Figure 6: Correlation matrix showing relationships between features*

## Features

### 1. Multiple Model Support
- Random Forest Classifier
- Support Vector Machine (SVM)
- K-Nearest Neighbors (KNN)
- Decision Tree
- Naive Bayes
- Logistic Regression

### 2. Model Performance Metrics
- Accuracy
- Precision
- Recall
- F1-Score
- Specificity
- Sensitivity
- Confusion Matrix

### 3. User Interface Features
- Real-time voice measurement calculator
- Sample data input option
- Detailed prediction results
- Model comparison table
- History of previous predictions
- Responsive design for all devices

### 4. Voice Measurement Calculator
- Input validation
- Real-time calculations
- Normal range indicators
- Copy to prediction form functionality

### 5. Prediction History
- Stores last 10 predictions
- View previous measurements
- Load previous values
- Delete individual entries
- Clear all history

## Setup Instructions

### Prerequisites
- Python 3.7 or higher
- pip (Python package installer)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Parkinson-s-DiseaseML
```

2. Install required packages:
```bash
pip install -r requirements.txt
```

3. Generate visualizations:
```bash
python generate_visualizations.py
```

4. Ensure all model files are present:
- rf_clf.pkl (Random Forest model)
- svm_clf.pkl (SVM model)
- knn_clf.pkl (KNN model)
- dt_clf.pkl (Decision Tree model)
- nb_clf.pkl (Naive Bayes model)
- lg_clf.pkl (Logistic Regression model)
- scaler.pkl (Standard Scaler)
- data.csv (Dataset)

### Running the Application

1. Start the Flask server:
```bash
python app.py
```

2. Open your web browser and navigate to:
```
http://localhost:5000
```

## Usage Guide

### Making a Prediction

1. Enter voice measurements:
   - MDVP:Fo (Hz)
   - MDVP:Fhi (Hz)
   - MDVP:Flo (Hz)
   - MDVP:Jitter (%)
   - MDVP:Jitter(Abs)
   - And other required measurements

2. Use the calculator:
   - Input values in the calculator section
   - View real-time calculations
   - Check if values are within normal ranges
   - Copy values to the prediction form

3. Submit for prediction:
   - Click the "Predict" button
   - View the prediction result
   - See confidence level
   - Check predictions from all models

### Viewing Model Performance

1. Model Comparison Table:
   - View accuracy, precision, recall, and F1-score
   - Compare performance across models
   - See confusion matrix details
   - Identify the best performing model

2. Performance Metrics:
   - Accuracy: Overall prediction accuracy
   - Precision: True positive rate
   - Recall: Sensitivity to positive cases
   - F1-Score: Harmonic mean of precision and recall
   - Specificity: True negative rate
   - Sensitivity: True positive rate

### Managing History

1. View History:
   - See previous predictions
   - View measurement values
   - Check prediction results

2. History Actions:
   - Load previous values
   - Delete individual entries
   - Clear all history

## Technical Details

### Machine Learning Models
- Random Forest: Best performing model
- SVM: Good for non-linear data
- KNN: Simple and effective
- Decision Tree: Easy to interpret
- Naive Bayes: Fast and efficient
- Logistic Regression: Linear model baseline

### Data Processing
- Standard scaling of features
- Train-test split (80-20)
- Cross-validation for model evaluation

### Web Technologies
- Frontend: HTML, CSS, JavaScript
- Backend: Flask (Python)
- Data Storage: Local Storage (Browser)
- UI Framework: Bootstrap

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Dataset: UCI Machine Learning Repository
- Machine Learning: scikit-learn
- Web Framework: Flask
- UI Framework: Bootstrap

## Screenshots Gallery

![Mobile View](docs/images/mobile_view.png)
*Figure 13: Mobile Responsive View*

![Dark Mode](docs/images/dark_mode.png)
*Figure 14: Dark Mode Interface*

![Error Handling](docs/images/error_handling.png)
*Figure 15: Error Handling and Validation*