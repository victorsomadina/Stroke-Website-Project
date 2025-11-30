document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initializePredictionForm();
    setupLogout();
});

function checkAuthentication() {
    const user = localStorage.getItem('user');
    
    if (!user) {
        showNotification('Please sign in to access this page', 'error');
        setTimeout(() => {
            window.location.href = 'signin.html';
        }, 1500);
        return false;
    }
    
    try {
        const userData = JSON.parse(user);
        const userNameElement = document.getElementById('userName');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (userData.name && userNameElement) {
            userNameElement.textContent = `Welcome, ${userData.name}`;
            userNameElement.style.color = '#3b82f6';
            userNameElement.style.fontWeight = '500';
        }
        
        if (logoutBtn) {
            logoutBtn.style.display = 'inline-block';
        }
    } catch (e) {
        console.error('Error parsing user data:', e);
    }
    
    return true;
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('user');
            showNotification('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = 'signin.html';
            }, 1000);
        });
    }
}

function initializePredictionForm() {
    const form = document.getElementById('predictionForm');
    if (!form) return;
    
    form.addEventListener('submit', handlePrediction);
    
    const inputs = form.querySelectorAll('input[required], select[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    const errorElement = document.getElementById(fieldName + 'Error');
    
    let isValid = true;
    let errorMessage = '';
    
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = `${getFieldLabel(fieldName)} is required`;
    }
    
    if (fieldName === 'age' && value) {
        const age = parseFloat(value);
        if (age < 0 || age > 150) {
            isValid = false;
            errorMessage = 'Age must be between 0 and 150';
        }
    }
    
    if (fieldName === 'avg_glucose_level' && value) {
        const glucose = parseFloat(value);
        if (glucose < 0) {
            isValid = false;
            errorMessage = 'Glucose level must be positive';
        }
    }
    
    if (fieldName === 'bmi' && value) {
        const bmi = parseFloat(value);
        if (bmi < 0 || bmi > 100) {
            isValid = false;
            errorMessage = 'BMI must be between 0 and 100';
        }
    }
    
    if (isValid) {
        clearFieldError(field);
    } else {
        showFieldError(field, errorMessage);
    }
    
    return isValid;
}

function getFieldLabel(fieldName) {
    const labels = {
        gender: 'Gender',
        age: 'Age',
        hypertension: 'Hypertension',
        heart_disease: 'Heart Disease',
        ever_married: 'Ever Married',
        work_type: 'Work Type',
        Residence_type: 'Residence Type',
        avg_glucose_level: 'Average Glucose Level',
        bmi: 'BMI',
        smoking_status: 'Smoking Status'
    };
    return labels[fieldName] || fieldName;
}

function showFieldError(field, message) {
    const errorElement = document.getElementById(field.name + 'Error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    field.style.borderColor = '#ef4444';
    field.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
}

function clearFieldError(field) {
    const errorElement = document.getElementById(field.name + 'Error');
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
    
    field.style.borderColor = '#e2e8f0';
    field.style.boxShadow = 'none';
}

async function handlePrediction(e) {
    e.preventDefault();
    
    if (!checkAuthentication()) {
        return;
    }
    
    const form = e.target;
    const formData = new FormData(form);
    
    const inputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    if (!isValid) {
        showNotification('Please fix the errors before submitting', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const predictionData = {
            gender: formData.get('gender'),
            age: parseFloat(formData.get('age')),
            hypertension: parseInt(formData.get('hypertension')),
            heart_disease: parseInt(formData.get('heart_disease')),
            ever_married: formData.get('ever_married'),
            work_type: formData.get('work_type'),
            Residence_type: formData.get('Residence_type'),
            avg_glucose_level: parseFloat(formData.get('avg_glucose_level')),
            smoking_status: formData.get('smoking_status')
        };
        
        const bmiValue = formData.get('bmi');
        if (bmiValue && bmiValue.trim() !== '') {
            predictionData.bmi = parseFloat(bmiValue);
        }
        
        // Check authentication
        if (!isAuthenticated()) {
            showNotification('Please sign in to make predictions', 'error');
            setTimeout(() => {
                window.location.href = 'signin.html';
            }, 1500);
            return;
        }
        
        const response = await apiCall(getApiUrl(API_CONFIG.ENDPOINTS.PREDICTION.PREDICT), {
            method: 'POST',
            body: JSON.stringify(predictionData)
        });
        
        hideLoading();
        
        if (response.success && response.data.success) {
            displayPredictionResult(response.data);
            document.getElementById('predictionResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            const errorMsg = response.error || (response.data?.detail || response.data?.message || 'An error occurred during prediction');
            showNotification(errorMsg, 'error');
        }
        
    } catch (error) {
        hideLoading();
        console.error('Prediction error:', error);
        showNotification('An error occurred. Please try again.', 'error');
    }
}

function displayPredictionResult(result) {
    const resultDiv = document.getElementById('predictionResult');
    const resultContent = document.getElementById('resultContent');
    
    if (!resultDiv || !resultContent) return;
    
    let riskColor, riskIcon, riskBg;
    if (result.risk_level === 'Low') {
        riskColor = '#10b981';
        riskIcon = 'fa-check-circle';
        riskBg = '#d1fae5';
    } else if (result.risk_level === 'Moderate') {
        riskColor = '#f59e0b';
        riskIcon = 'fa-exclamation-triangle';
        riskBg = '#fef3c7';
    } else {
        riskColor = '#ef4444';
        riskIcon = 'fa-exclamation-circle';
        riskBg = '#fee2e2';
    }
    
    const probabilityPercent = (result.probability * 100).toFixed(2);
    
    resultContent.innerHTML = `
        <div style="background: ${riskBg}; padding: 2rem; border-radius: 0.5rem; margin-bottom: 2rem; border-left: 6px solid ${riskColor};">
            <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 0.5rem;">
                <i class="fas ${riskIcon}" style="font-size: 3rem; color: ${riskColor};"></i>
                <div style="flex: 1;">
                    <h4 style="margin: 0; color: ${riskColor}; font-size: 2rem; font-weight: 700;">${result.risk_level} Risk</h4>
                    <p style="margin: 0.5rem 0 0 0; color: #64748b; font-size: 1.1rem;">${result.message}</p>
                </div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-top: 1.5rem;">
            <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 1rem; color: #64748b; margin-bottom: 0.75rem; font-weight: 500;">Prediction</div>
                <div style="font-size: 1.75rem; font-weight: 600; color: #1e293b;">
                    ${result.prediction === 1 ? 'Stroke Risk Detected' : 'No Stroke Risk'}
                </div>
            </div>
            <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 1rem; color: #64748b; margin-bottom: 0.75rem; font-weight: 500;">Probability</div>
                <div style="font-size: 1.75rem; font-weight: 600; color: #1e293b;">${probabilityPercent}%</div>
            </div>
        </div>
        
        <div style="margin-top: 2rem; padding: 1.5rem; background: #f1f5f9; border-radius: 0.5rem; border-left: 4px solid #64748b;">
            <p style="margin: 0; color: #64748b; font-size: 0.95rem; line-height: 1.6;">
                <strong>Disclaimer:</strong> This prediction is for informational purposes only and should not replace professional medical advice. Please consult with a healthcare professional for proper diagnosis and treatment.
            </p>
        </div>
    `;
    
    resultDiv.style.display = 'block';
}

