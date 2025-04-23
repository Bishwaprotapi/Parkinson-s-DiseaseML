import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score
from sklearn.model_selection import cross_val_score

# Load the dataset
url_string = 'https://raw.githubusercontent.com/Bishwaprotapi/Parkinson-s-DiseaseML/main/PDdataset.csv'
df = pd.read_csv(url_string)

# Drop the 'name' column as it's not needed for the model
if 'name' in df.columns:
    df.drop(['name'], axis=1, inplace=True)

# Split the data into features and target
X = df.drop('status', axis=1)
y = df['status']

# Split the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Scale the features
scaler = MinMaxScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Find the optimal k value using cross-validation
k_range = range(1, 31)
k_scores = []
for k in k_range:
    knn = KNeighborsClassifier(n_neighbors=k)
    scores = cross_val_score(knn, X_train_scaled, y_train, cv=5, scoring='accuracy')
    k_scores.append(scores.mean())

# Plot the accuracy for different k values
plt.figure(figsize=(10, 6))
plt.plot(k_range, k_scores)
plt.xlabel('Value of K for KNN')
plt.ylabel('Cross-Validated Accuracy')
plt.title('Accuracy vs K Value')
plt.grid(True)
plt.savefig('knn_accuracy_plot.png')
plt.close()

# Train the KNN model with the optimal k
optimal_k = k_range[np.argmax(k_scores)]
knn = KNeighborsClassifier(n_neighbors=optimal_k)
knn.fit(X_train_scaled, y_train)

# Make predictions
y_pred = knn.predict(X_test_scaled)

# Calculate accuracy
accuracy = accuracy_score(y_test, y_pred)
print(f"Optimal K: {optimal_k}")
print(f"Accuracy: {accuracy:.4f}")

# Generate and plot confusion matrix
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
plt.xlabel('Predicted')
plt.ylabel('Actual')
plt.title('Confusion Matrix')
plt.savefig('knn_confusion_matrix.png')
plt.close()

# Generate classification report
report = classification_report(y_test, y_pred)
print("\nClassification Report:")
print(report)

# Save the model and scaler
import joblib
joblib.dump(knn, 'knn_model.pkl')
joblib.dump(scaler, 'scaler.pkl') 