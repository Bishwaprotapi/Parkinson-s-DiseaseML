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
            resultDiv.querySelector('.alert').className = 'alert alert-success';
            document.getElementById('predictionText').textContent = data.prediction;
            document.getElementById('confidenceText').textContent = `Confidence: ${data.confidence}`;
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