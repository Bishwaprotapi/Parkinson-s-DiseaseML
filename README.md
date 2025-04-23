# Parkinson's Disease Detection using Machine Learning

This project implements various machine learning models to detect Parkinson's Disease using voice measurements. The models are trained on a dataset containing various voice features that can help in early detection of Parkinson's Disease.

## Features

- Multiple machine learning models implemented (SVM, Random Forest, Gradient Boosting)
- Comprehensive model comparison and evaluation
- Feature scaling and preprocessing
- Model persistence using joblib
- Visualization of results including confusion matrices and accuracy comparisons

## Visualizations

### Model Accuracy Comparison
![Model Accuracy Comparison](model_accuracy_comparison.png)
*Comparison of accuracy scores across different models*

### Confusion Matrices
#### Support Vector Machine (SVM)
![SVM Confusion Matrix](confusion_matrix_svm.png)
*Confusion matrix showing the performance of the SVM model*

#### Random Forest
![Random Forest Confusion Matrix](confusion_matrix_random_forest.png)
*Confusion matrix showing the performance of the Random Forest model*

#### Gradient Boosting
![Gradient Boosting Confusion Matrix](confusion_matrix_gradient_boosting.png)
*Confusion matrix showing the performance of the Gradient Boosting model*

## Model Performance

Based on our experiments, the Random Forest classifier achieved the best performance with:
- Accuracy: 98.74%
- Precision: 98.87%
- Recall: 98.74%
- F1-score: 98.77%

## Dataset

The project uses the Parkinson's Disease dataset which contains various voice measurements. The dataset includes features like:
- MDVP:Fo(Hz) - Average vocal fundamental frequency
- MDVP:Fhi(Hz) - Maximum vocal fundamental frequency
- MDVP:Flo(Hz) - Minimum vocal fundamental frequency
- And various other voice-related measurements

## Requirements

- Python 3.7+
- Required packages are listed in `requirements.txt`:
  - pandas
  - numpy
  - matplotlib
  - seaborn
  - scikit-learn
  - joblib
  - scipy

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Parkinson-s-DiseaseML.git
cd Parkinson-s-DiseaseML
```

2. Create a virtual environment and activate it:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install the required packages:
```bash
pip install -r requirements.txt
```

## Usage

1. Run the model comparison script:
```bash
python model_comparison.py
```

This will:
- Load and preprocess the dataset
- Train multiple machine learning models
- Compare their performance
- Save the best model and scaler
- Generate visualization plots

## Model Files

The project includes several saved models:
- `best_model.pkl` - The best performing model
- `scaler.pkl` - The scaler used for feature normalization
- Various other model files (svm_clf.pkl, rf_clf.pkl, etc.)

## Results

The script generates several visualization files:
- `model_accuracy_comparison.png` - Bar plot comparing model accuracies
- `confusion_matrix_*.png` - Confusion matrices for each model

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Dataset source: [UCI Machine Learning Repository](https://archive.ics.uci.edu/ml/datasets/Parkinson%27s+Disease+Classification)
- Special thanks to all contributors and the open-source community