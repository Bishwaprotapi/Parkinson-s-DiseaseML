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