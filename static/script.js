// Model performance data will be populated from the server
let modelPerformance = {};

// Function to get accuracy class
function getAccuracyClass(value) {
    if (value >= 0.90) return 'accuracy-high';
    if (value >= 0.80) return 'accuracy-medium';
    return 'accuracy-low';
}

// Function to format percentage
function formatPercentage(value) {
    return (value * 100).toFixed(1) + '%';
}

// Function to populate model comparison table
function populateModelComparison() {
    const tableBody = document.getElementById('modelComparisonTable');
    let bestAccuracy = 0;
    let bestModel = '';

    // Find best model
    Object.entries(modelPerformance).forEach(([model, metrics]) => {
        if (metrics.accuracy > bestAccuracy) {
            bestAccuracy = metrics.accuracy;
            bestModel = model;
        }
    });

    // Clear existing table
    tableBody.innerHTML = '';

    // Populate table
    Object.entries(modelPerformance).forEach(([model, metrics]) => {
        const row = document.createElement('tr');
        if (model === bestModel) {
            row.classList.add('best-model');
        }

        row.innerHTML = `
            <td>${model}</td>
            <td><span class="accuracy-badge ${getAccuracyClass(metrics.accuracy)}">${formatPercentage(metrics.accuracy)}</span></td>
            <td>${formatPercentage(metrics.precision)}</td>
            <td>${formatPercentage(metrics.recall)}</td>
            <td>${formatPercentage(metrics.f1Score)}</td>
        `;

        tableBody.appendChild(row);
    });
}

// Function to display all model predictions
function displayAllPredictions(predictions) {
    const resultDiv = document.getElementById('result');
    const allPredictionsDiv = document.createElement('div');
    allPredictionsDiv.className = 'all-predictions mt-4';
    allPredictionsDiv.innerHTML = `
        <h5>Predictions from All Models:</h5>
        <div class="table-responsive">
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Model</th>
                        <th>Prediction</th>
                        <th>Confidence</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(predictions).map(([model, pred]) => `
                        <tr>
                            <td>${model}</td>
                            <td>${pred.prediction === 1 ? 'Parkinson\'s Disease Detected' : 'No Parkinson\'s Disease Detected'}</td>
                            <td>${pred.confidence.toFixed(2)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    resultDiv.appendChild(allPredictionsDiv);
}

// Handle form submission
document.getElementById('predictionForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const submitButton = this.querySelector('button[type="submit"]');
    const resultDiv = document.getElementById('result');
    
    // Disable submit button and show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
    
    try {
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Show success result
            resultDiv.style.display = 'block';
            const alertDiv = resultDiv.querySelector('.alert');
            alertDiv.className = 'alert ' + (data.prediction.includes('Detected') ? 'alert-danger' : 'alert-success');
            
            // Update prediction status
            const predictionStatus = resultDiv.querySelector('.prediction-status');
            predictionStatus.innerHTML = `
                <i class="fas ${data.prediction.includes('Detected') ? 'fa-times-circle' : 'fa-check-circle'}"></i>
                <p id="predictionText" class="mb-2">${data.prediction}</p>
            `;
            
            // Update confidence meter
            const confidenceValue = parseFloat(data.confidence);
            const confidenceBar = document.getElementById('confidenceBar');
            confidenceBar.style.width = `${confidenceValue}%`;
            document.getElementById('confidenceText').textContent = `Confidence: ${data.confidence}`;
            
            // Update recommendation
            document.getElementById('recommendationText').textContent = getRecommendation(data.prediction, confidenceValue);
            
            // Display all model predictions
            displayAllPredictions(data.all_predictions);
            
            // Scroll to result
            resultDiv.scrollIntoView({ behavior: 'smooth' });
        } else {
            // Show error result
            resultDiv.style.display = 'block';
            resultDiv.querySelector('.alert').className = 'alert alert-danger';
            document.getElementById('predictionText').textContent = 'Error occurred during prediction';
            document.getElementById('confidenceText').textContent = data.error || 'Please try again';
        }
    } catch (error) {
        // Show error result
        resultDiv.style.display = 'block';
        resultDiv.querySelector('.alert').className = 'alert alert-danger';
        document.getElementById('predictionText').textContent = 'Error occurred during prediction';
        document.getElementById('confidenceText').textContent = 'Please try again';
    } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'Predict';
    }
});

// Initialize model performance data from server
document.addEventListener('DOMContentLoaded', function() {
    // Get model metrics from the server
    fetch('/')
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const metricsScript = doc.querySelector('script#model-metrics');
            if (metricsScript) {
                modelPerformance = JSON.parse(metricsScript.textContent);
                populateModelComparison();
            }
        });
});

// Sample data for testing
const sampleData = {
    MDVP_Fo: 119.992,
    MDVP_Fhi: 157.302,
    MDVP_Flo: 74.997,
    MDVP_Jitter: 0.00784,
    MDVP_Jitter_Abs: 0.00007,
    MDVP_RAP: 0.00370,
    MDVP_PPQ: 0.00554,
    Jitter_DDP: 0.01109,
    MDVP_Shimmer: 0.04374,
    MDVP_Shimmer_dB: 0.426
};

// Function to fill form with sample data
function fillSampleData() {
    Object.keys(sampleData).forEach(key => {
        const input = document.getElementById(key);
        if (input) {
            input.value = sampleData[key];
        }
    });
}

// Function to clear form
function clearForm() {
    document.getElementById('predictionForm').reset();
}

// Handle sample data checkbox
document.getElementById('useSampleData').addEventListener('change', function(e) {
    if (e.target.checked) {
        fillSampleData();
    } else {
        clearForm();
    }
});

// Function to get recommendation based on prediction
function getRecommendation(prediction, confidence) {
    if (prediction === 'Parkinson\'s Disease Detected') {
        if (confidence >= 80) {
            return 'Strong recommendation to consult a neurologist for further evaluation and potential treatment options.';
        } else if (confidence >= 60) {
            return 'Recommendation to schedule a consultation with a neurologist for further assessment.';
        } else {
            return 'Consider scheduling a consultation with a neurologist for further evaluation.';
        }
    } else {
        if (confidence >= 80) {
            return 'No immediate action required. Continue regular health check-ups.';
        } else if (confidence >= 60) {
            return 'No immediate action required, but maintain regular health monitoring.';
        } else {
            return 'Consider regular health monitoring and consult a healthcare provider if symptoms develop.';
        }
    }
} 