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

// History functionality
const HISTORY_KEY = 'parkinsons_prediction_history';
const MAX_HISTORY_ITEMS = 10;

// Function to get history from localStorage
function getHistory() {
    const history = localStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
}

// Function to save history to localStorage
function saveHistory(history) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// Function to add new entry to history
function addToHistory(prediction, values) {
    const history = getHistory();
    const newEntry = {
        id: Date.now(),
        date: new Date().toISOString(),
        values: values,
        prediction: prediction
    };
    
    history.unshift(newEntry);
    if (history.length > MAX_HISTORY_ITEMS) {
        history.pop();
    }
    
    saveHistory(history);
    updateHistoryTable();
}

// Function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

// Function to update history table
function updateHistoryTable() {
    const history = getHistory();
    const tableBody = document.getElementById('historyTable');
    tableBody.innerHTML = '';
    
    history.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="history-date">${formatDate(entry.date)}</td>
            <td class="history-value">${entry.values.MDVP_Fo?.toFixed(2) || '-'}</td>
            <td class="history-value">${entry.values.MDVP_Fhi?.toFixed(2) || '-'}</td>
            <td class="history-value">${entry.values.MDVP_Flo?.toFixed(2) || '-'}</td>
            <td class="history-value">${entry.values.MDVP_Jitter?.toFixed(6) || '-'}</td>
            <td class="history-result ${entry.prediction.includes('Detected') ? 'positive' : 'negative'}">
                ${entry.prediction}
            </td>
            <td class="history-actions">
                <button class="btn btn-sm btn-outline-primary" onclick="loadHistoryEntry(${entry.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteHistoryEntry(${entry.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Function to load history entry into calculator
function loadHistoryEntry(id) {
    const history = getHistory();
    const entry = history.find(item => item.id === id);
    if (entry) {
        Object.entries(entry.values).forEach(([key, value]) => {
            const input = document.getElementById(`calc_${key}`);
            if (input) {
                input.value = value;
            }
        });
        updateCalculationResults();
    }
}

// Function to delete history entry
function deleteHistoryEntry(id) {
    const history = getHistory();
    const newHistory = history.filter(item => item.id !== id);
    saveHistory(newHistory);
    updateHistoryTable();
}

// Function to clear all history
function clearHistory() {
    if (confirm('Are you sure you want to clear all history?')) {
        saveHistory([]);
        updateHistoryTable();
    }
}

// Add event listener for clear history button
document.getElementById('clearHistory').addEventListener('click', clearHistory);

// Modify the form submission handler to save to history
document.getElementById('predictionForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const submitButton = this.querySelector('button[type="submit"]');
    const resultDiv = document.getElementById('result');
    
    // Get form values for history
    const values = {};
    for (const [key, value] of formData.entries()) {
        if (key !== 'csrf_token') {
            values[key] = parseFloat(value);
        }
    }
    
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
            // Add to history
            addToHistory(data.prediction, values);
            
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
    updateHistoryTable();
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

// Calculator functionality
const calculatorInputs = document.querySelectorAll('.calc-input');
const calculationResults = document.getElementById('calculationResults');

// Normal ranges for measurements
const normalRanges = {
    MDVP_Fo: { min: 100, max: 200 },
    MDVP_Fhi: { min: 150, max: 250 },
    MDVP_Flo: { min: 50, max: 150 },
    MDVP_Jitter: { min: 0, max: 0.02 },
    MDVP_Jitter_Abs: { min: 0, max: 0.0001 }
};

// Function to check if value is in normal range
function checkNormalRange(value, metric) {
    const range = normalRanges[metric];
    if (!range) return 'unknown';
    
    if (value < range.min) return 'low';
    if (value > range.max) return 'high';
    return 'normal';
}

// Function to get status class
function getStatusClass(status) {
    switch (status) {
        case 'normal': return 'status-normal';
        case 'low': return 'status-warning';
        case 'high': return 'status-danger';
        default: return '';
    }
}

// Function to get status text
function getStatusText(status) {
    switch (status) {
        case 'normal': return 'Normal';
        case 'low': return 'Below Normal';
        case 'high': return 'Above Normal';
        default: return 'Unknown';
    }
}

// Function to calculate derived metrics
function calculateDerivedMetrics(values) {
    const results = {};
    
    // Calculate frequency range
    if (values.MDVP_Fhi && values.MDVP_Flo) {
        results.frequencyRange = values.MDVP_Fhi - values.MDVP_Flo;
    }
    
    // Calculate jitter ratio
    if (values.MDVP_Jitter && values.MDVP_Fo) {
        results.jitterRatio = values.MDVP_Jitter / values.MDVP_Fo;
    }
    
    // Calculate absolute jitter ratio
    if (values.MDVP_Jitter_Abs && values.MDVP_Fo) {
        results.absJitterRatio = values.MDVP_Jitter_Abs / values.MDVP_Fo;
    }
    
    return results;
}

// Function to update calculation results
function updateCalculationResults() {
    const values = {};
    calculatorInputs.forEach(input => {
        const metric = input.id.replace('calc_', '');
        values[metric] = parseFloat(input.value) || null;
    });
    
    const derivedMetrics = calculateDerivedMetrics(values);
    
    // Clear existing results
    calculationResults.innerHTML = '';
    
    // Add basic measurements
    Object.entries(values).forEach(([metric, value]) => {
        if (value !== null) {
            const status = checkNormalRange(value, metric);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${metric}</td>
                <td class="calculation-value">${value.toFixed(6)}</td>
                <td><span class="status-indicator ${getStatusClass(status)}">${getStatusText(status)}</span></td>
            `;
            calculationResults.appendChild(row);
        }
    });
    
    // Add derived metrics
    Object.entries(derivedMetrics).forEach(([metric, value]) => {
        if (value !== undefined) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${metric}</td>
                <td class="calculation-value">${value.toFixed(6)}</td>
                <td><span class="status-indicator">Calculated</span></td>
            `;
            calculationResults.appendChild(row);
        }
    });
}

// Add event listeners to calculator inputs
calculatorInputs.forEach(input => {
    input.addEventListener('input', updateCalculationResults);
});

// Function to copy calculator values to prediction form
function copyToPredictionForm() {
    calculatorInputs.forEach(input => {
        const metric = input.id.replace('calc_', '');
        const predictionInput = document.getElementById(metric);
        if (predictionInput) {
            predictionInput.value = input.value;
        }
    });
}

// Add copy button to calculator section
const calculatorSection = document.querySelector('.calculator-section');
const copyButton = document.createElement('button');
copyButton.className = 'btn btn-primary mt-3';
copyButton.textContent = 'Copy to Prediction Form';
copyButton.addEventListener('click', copyToPredictionForm);
calculatorSection.querySelector('.calculation-results').appendChild(copyButton); 