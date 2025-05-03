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

// Sample data values
const sampleData = {
    mdvp_fo: 119.992,
    mdvp_fhi: 157.302,
    mdvp_flo: 74.997,
    mdvp_jitter: 0.00784,
    mdvp_jitter_abs: 0.00007,
    mdvp_rap: 0.00370,
    mdvp_ppq: 0.00554,
    mdvp_ddp: 0.01109,
    mdvp_shimmer: 0.04374,
    mdvp_shimmer_db: 0.426,
    mdvp_shimmer_apq3: 0.02182,
    mdvp_shimmer_apq5: 0.03130,
    mdvp_apq: 0.02971,
    mdvp_dda: 0.06545,
    nhr: 0.02211,
    hnr: 21.033,
    rpde: 0.414783,
    dfa: 0.815285,
    spread1: -4.813031,
    spread2: 0.266482,
    d2: 2.301442,
    ppe: 0.284654
};

// Normal ranges for voice measurements
const normalRanges = {
    mdvp_fo: { min: 100, max: 200 },
    mdvp_fhi: { min: 150, max: 300 },
    mdvp_flo: { min: 50, max: 150 },
    mdvp_jitter: { min: 0, max: 0.02 },
    mdvp_jitter_abs: { min: 0, max: 0.0001 }
};

// Function to check if a value is within normal range
function isInNormalRange(value, metric) {
    const range = normalRanges[metric];
    if (!range) return true; // If no range defined, consider it normal
    return value >= range.min && value <= range.max;
}

// Function to get status class
function getStatusClass(value, metric) {
    if (!normalRanges[metric]) return 'status-normal';
    const range = normalRanges[metric];
    if (value < range.min) return 'status-low';
    if (value > range.max) return 'status-high';
    return 'status-normal';
}

// Function to get status text
function getStatusText(value, metric) {
    if (!normalRanges[metric]) return 'Normal';
    const range = normalRanges[metric];
    if (value < range.min) return 'Below Normal';
    if (value > range.max) return 'Above Normal';
    return 'Normal';
}

// Function to calculate derived metrics
function calculateDerivedMetrics(inputs) {
    const results = {};
    
    // Calculate frequency range
    results.frequency_range = inputs.mdvp_fhi - inputs.mdvp_flo;
    
    // Calculate jitter ratio
    results.jitter_ratio = inputs.mdvp_jitter / inputs.mdvp_fo;
    
    // Calculate absolute jitter ratio
    results.jitter_abs_ratio = inputs.mdvp_jitter_abs / inputs.mdvp_fo;
    
    return results;
}

// Function to update calculator results
function updateCalculatorResults() {
    const inputs = {
        mdvp_fo: parseFloat(document.getElementById('calc_mdvp_fo').value) || 0,
        mdvp_fhi: parseFloat(document.getElementById('calc_mdvp_fhi').value) || 0,
        mdvp_flo: parseFloat(document.getElementById('calc_mdvp_flo').value) || 0,
        mdvp_jitter: parseFloat(document.getElementById('calc_mdvp_jitter').value) || 0,
        mdvp_jitter_abs: parseFloat(document.getElementById('calc_mdvp_jitter_abs').value) || 0
    };
    
    const derivedMetrics = calculateDerivedMetrics(inputs);
    const resultsTable = document.getElementById('calculatorResults');
    resultsTable.innerHTML = '';
    
    // Add original input values
    for (const [metric, value] of Object.entries(inputs)) {
        const statusClass = getStatusClass(value, metric);
        const statusText = getStatusText(value, metric);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${metric}</td>
            <td class="calc-value">${value.toFixed(6)}</td>
            <td class="${statusClass}">${statusText}</td>
        `;
        resultsTable.appendChild(row);
    }
    
    // Add derived metrics
    for (const [metric, value] of Object.entries(derivedMetrics)) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${metric}</td>
            <td class="calc-value">${value.toFixed(6)}</td>
            <td class="status-normal">Calculated</td>
        `;
        resultsTable.appendChild(row);
    }
}

// Function to copy calculator values to prediction form
function copyToPredictionForm() {
    const calculatorInputs = {
        'mdvp_fo': 'calc_mdvp_fo',
        'mdvp_fhi': 'calc_mdvp_fhi',
        'mdvp_flo': 'calc_mdvp_flo',
        'mdvp_jitter': 'calc_mdvp_jitter',
        'mdvp_jitter_abs': 'calc_mdvp_jitter_abs'
    };
    
    for (const [formId, calcId] of Object.entries(calculatorInputs)) {
        const calcValue = document.getElementById(calcId).value;
        if (calcValue) {
            document.getElementById(formId).value = calcValue;
        }
    }
}

// Function to handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = {};
    const form = event.target;
    const formElements = form.elements;
    
    for (let i = 0; i < formElements.length; i++) {
        const element = formElements[i];
        if (element.name && element.value) {
            formData[element.name] = parseFloat(element.value);
        }
    }
    
    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayResults(result);
            saveToHistory(formData, result);
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while making the prediction.');
    }
}

// Function to display results
function displayResults(result) {
    const resultsSection = document.getElementById('resultsSection');
    const predictionResult = document.getElementById('predictionResult');
    const modelPredictions = document.getElementById('modelPredictions');
    
    // Display overall prediction
    const predictionText = result.overall_prediction === 1 ? 
        'Parkinson\'s Disease Detected' : 
        'No Parkinson\'s Disease Detected';
    
    predictionResult.innerHTML = `
        <div class="prediction-status ${result.overall_prediction === 1 ? 'positive' : 'negative'}">
            ${predictionText}
        </div>
    `;
    
    // Display individual model predictions
    modelPredictions.innerHTML = '';
    for (const [modelName, prediction] of Object.entries(result.model_predictions)) {
        const modelCard = document.createElement('div');
        modelCard.className = 'model-card';
        modelCard.innerHTML = `
            <h4>${modelName}</h4>
            <div class="model-prediction ${prediction.prediction === 1 ? 'positive' : 'negative'}">
                ${prediction.prediction === 1 ? 'Positive' : 'Negative'}
            </div>
            ${prediction.probability !== null ? 
                `<div class="model-probability">
                    Confidence: ${(prediction.probability * 100).toFixed(2)}%
                </div>` : 
                ''}
        `;
        modelPredictions.appendChild(modelCard);
    }
    
    resultsSection.style.display = 'block';
}

// Function to save prediction to history
function saveToHistory(inputs, result) {
    const history = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
    const timestamp = new Date().toLocaleString();
    
    history.unshift({
        timestamp,
        inputs,
        result
    });
    
    // Keep only last 10 predictions
    if (history.length > 10) {
        history.pop();
    }
    
    localStorage.setItem('predictionHistory', JSON.stringify(history));
    updateHistoryTable();
}

// Function to update history table
function updateHistoryTable() {
    const historyTable = document.getElementById('historyTable');
    const history = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
    
    historyTable.innerHTML = '';
    
    for (const entry of history) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.timestamp}</td>
            <td>${entry.inputs.mdvp_fo.toFixed(3)}</td>
            <td>${entry.inputs.mdvp_fhi.toFixed(3)}</td>
            <td>${entry.inputs.mdvp_flo.toFixed(3)}</td>
            <td>${entry.inputs.mdvp_jitter.toFixed(6)}</td>
            <td class="${entry.result.overall_prediction === 1 ? 'positive' : 'negative'}">
                ${entry.result.overall_prediction === 1 ? 'Positive' : 'Negative'}
            </td>
            <td>
                <button class="btn-view" onclick="viewHistoryEntry(${history.indexOf(entry)})">View</button>
            </td>
        `;
        historyTable.appendChild(row);
    }
}

// Function to view history entry
function viewHistoryEntry(index) {
    const history = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
    const entry = history[index];
    
    if (entry) {
        // Fill form with historical values
        for (const [key, value] of Object.entries(entry.inputs)) {
            const input = document.getElementById(key);
            if (input) {
                input.value = value;
            }
        }
        
        // Display results
        displayResults(entry.result);
    }
}

// Function to clear history
function clearHistory() {
    if (confirm('Are you sure you want to clear the prediction history?')) {
        localStorage.removeItem('predictionHistory');
        updateHistoryTable();
    }
}

// Function to use sample data
function useSampleData() {
    for (const [key, value] of Object.entries(sampleData)) {
        const input = document.getElementById(key);
        if (input) {
            input.value = value;
        }
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Form submission
    const form = document.getElementById('predictionForm');
    form.addEventListener('submit', handleFormSubmit);
    
    // Calculator inputs
    const calculatorInputs = document.querySelectorAll('.calculator-input');
    calculatorInputs.forEach(input => {
        input.addEventListener('input', updateCalculatorResults);
    });
    
    // Copy to form button
    const copyButton = document.getElementById('copyToForm');
    copyButton.addEventListener('click', copyToPredictionForm);
    
    // Clear history button
    const clearButton = document.getElementById('clearHistory');
    clearButton.addEventListener('click', clearHistory);
    
    // Sample data button
    const sampleButton = document.getElementById('useSampleData');
    sampleButton.addEventListener('click', useSampleData);
    
    // Initial history table update
    updateHistoryTable();
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
                <td><span class="status-indicator ${getStatusClass(value, metric)}">${getStatusText(value, metric)}</span></td>
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