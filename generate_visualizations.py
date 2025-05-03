import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, accuracy_score, precision_score, recall_score, f1_score
import joblib
import os

# Create docs/images directory if it doesn't exist
os.makedirs('docs/images', exist_ok=True)

# Set style for all plots
plt.style.use('default')
sns.set_theme()

def plot_confusion_matrices(models, X_test, y_test):
    """Generate confusion matrices for all models"""
    fig, axes = plt.subplots(2, 3, figsize=(15, 10))
    axes = axes.ravel()
    
    for idx, (model_name, model) in enumerate(models.items()):
        y_pred = model.predict(X_test)
        # Convert predictions to int type
        y_pred = y_pred.astype(int)
        y_test_int = y_test.astype(int)
        cm = confusion_matrix(y_test_int, y_pred)
        
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes[idx])
        axes[idx].set_title(f'{model_name} Confusion Matrix')
        axes[idx].set_xlabel('Predicted')
        axes[idx].set_ylabel('Actual')
    
    plt.tight_layout()
    plt.savefig('docs/images/confusion_matrices.png', dpi=300, bbox_inches='tight')
    plt.close()

def plot_model_comparison(models, X_test, y_test):
    """Generate comparison of model metrics"""
    metrics = {
        'Model': [],
        'Accuracy': [],
        'Precision': [],
        'Recall': [],
        'F1-Score': []
    }
    
    y_test_int = y_test.astype(int)
    
    for model_name, model in models.items():
        y_pred = model.predict(X_test)
        y_pred = y_pred.astype(int)
        metrics['Model'].append(model_name)
        metrics['Accuracy'].append(accuracy_score(y_test_int, y_pred))
        metrics['Precision'].append(precision_score(y_test_int, y_pred))
        metrics['Recall'].append(recall_score(y_test_int, y_pred))
        metrics['F1-Score'].append(f1_score(y_test_int, y_pred))
    
    df_metrics = pd.DataFrame(metrics)
    
    # Plot metrics comparison
    plt.figure(figsize=(12, 6))
    x = np.arange(len(df_metrics['Model']))
    width = 0.2
    
    plt.bar(x - 1.5*width, df_metrics['Accuracy'], width, label='Accuracy')
    plt.bar(x - 0.5*width, df_metrics['Precision'], width, label='Precision')
    plt.bar(x + 0.5*width, df_metrics['Recall'], width, label='Recall')
    plt.bar(x + 1.5*width, df_metrics['F1-Score'], width, label='F1-Score')
    
    plt.xlabel('Models')
    plt.ylabel('Score')
    plt.title('Model Performance Comparison')
    plt.xticks(x, df_metrics['Model'], rotation=45)
    plt.legend()
    plt.tight_layout()
    plt.savefig('docs/images/model_comparison.png', dpi=300, bbox_inches='tight')
    plt.close()

def plot_feature_importance(models, feature_names):
    """Generate feature importance plots for tree-based models"""
    tree_models = {name: model for name, model in models.items() 
                  if name in ['Random Forest', 'Decision Tree']}
    
    fig, axes = plt.subplots(1, len(tree_models), figsize=(15, 5))
    if len(tree_models) == 1:
        axes = [axes]
    
    for idx, (model_name, model) in enumerate(tree_models.items()):
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            indices = np.argsort(importances)[::-1]
            
            axes[idx].bar(range(len(importances)), importances[indices])
            axes[idx].set_title(f'{model_name} Feature Importance')
            axes[idx].set_xticks(range(len(importances)))
            axes[idx].set_xticklabels([feature_names[i] for i in indices], rotation=90)
    
    plt.tight_layout()
    plt.savefig('docs/images/feature_importance.png', dpi=300, bbox_inches='tight')
    plt.close()

def plot_roc_curves(models, X_test, y_test):
    """Generate ROC curves for all models"""
    from sklearn.metrics import roc_curve, auc
    
    plt.figure(figsize=(10, 8))
    y_test_int = y_test.astype(int)
    
    for model_name, model in models.items():
        if hasattr(model, 'predict_proba'):
            y_pred_proba = model.predict_proba(X_test)[:, 1]
            fpr, tpr, _ = roc_curve(y_test_int, y_pred_proba)
            roc_auc = auc(fpr, tpr)
            
            plt.plot(fpr, tpr, label=f'{model_name} (AUC = {roc_auc:.2f})')
    
    plt.plot([0, 1], [0, 1], 'k--')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('ROC Curves for All Models')
    plt.legend(loc="lower right")
    plt.savefig('docs/images/roc_curves.png', dpi=300, bbox_inches='tight')
    plt.close()

def plot_data_distribution(data):
    """Generate distribution plots for features"""
    plt.figure(figsize=(15, 10))
    
    # Plot feature distributions
    for i, feature in enumerate(data.columns[:6]):  # Plot first 6 features
        if feature not in ['status', 'name']:
            plt.subplot(2, 3, i+1)
            sns.histplot(data=data, x=feature, hue='status', kde=True)
            plt.title(f'{feature} Distribution')
    
    plt.tight_layout()
    plt.savefig('docs/images/feature_distributions.png', dpi=300, bbox_inches='tight')
    plt.close()

def plot_correlation_matrix(data):
    """Generate correlation matrix heatmap"""
    # Select only numeric columns
    numeric_cols = data.select_dtypes(include=[np.number]).columns
    data_numeric = data[numeric_cols]
    
    plt.figure(figsize=(12, 10))
    correlation_matrix = data_numeric.corr()
    sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', center=0)
    plt.title('Feature Correlation Matrix')
    plt.tight_layout()
    plt.savefig('docs/images/correlation_matrix.png', dpi=300, bbox_inches='tight')
    plt.close()

def main():
    # Load models
    models = {
        'Random Forest': joblib.load('rf_clf.pkl'),
        'SVM': joblib.load('svm_clf.pkl'),
        'KNN': joblib.load('knn_clf.pkl'),
        'Decision Tree': joblib.load('dt_clf.pkl'),
        'Naive Bayes': joblib.load('nb_clf.pkl'),
        'Logistic Regression': joblib.load('lg_clf.pkl')
    }
    
    # Load and prepare data
    data = pd.read_csv('data.csv')
    X = data.drop(['status', 'name'], axis=1)
    y = data['status']
    
    # Split data
    from sklearn.model_selection import train_test_split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scale the features
    from sklearn.preprocessing import StandardScaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Convert to DataFrame to preserve column names
    X_test_scaled = pd.DataFrame(X_test_scaled, columns=X.columns)
    
    # Generate all visualizations
    plot_confusion_matrices(models, X_test_scaled, y_test)
    plot_model_comparison(models, X_test_scaled, y_test)
    plot_feature_importance(models, X.columns)
    plot_roc_curves(models, X_test_scaled, y_test)
    plot_data_distribution(data)
    plot_correlation_matrix(data)

if __name__ == "__main__":
    main() 