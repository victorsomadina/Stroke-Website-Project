let isLoading = false;

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    initializeSmoothScrolling();
    initializeFormValidation();
    initializePasswordStrength();
    initializeMobileMenu();
    initializeModals();
    initializeFormSubmissions();
}

function initializeSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function initializeFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select');
        
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                clearFieldError(this);
            });
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
    
    if (fieldName === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }
    }
    
    if (fieldName === 'password' && value) {
        if (value.length < 8) {
            isValid = false;
            errorMessage = 'Password must be at least 8 characters long';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
            isValid = false;
            errorMessage = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }
    }
    
    if (fieldName === 'confirmPassword' && value) {
        const password = document.getElementById('password').value;
        if (value !== password) {
            isValid = false;
            errorMessage = 'Passwords do not match';
        }
    }
    
    if (fieldName === 'phone' && value) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number';
        }
    }
    
    if (fieldName === 'dateOfBirth' && value) {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        if (age < 13) {
            isValid = false;
            errorMessage = 'You must be at least 13 years old to register';
        } else if (age > 120) {
            isValid = false;
            errorMessage = 'Please enter a valid date of birth';
        }
    }
    
    if (fieldName === 'terms' && field.type === 'checkbox') {
        if (!field.checked) {
            isValid = false;
            errorMessage = 'You must agree to the terms and conditions';
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
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email',
        phone: 'Phone Number',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        dateOfBirth: 'Date of Birth',
        gender: 'Gender',
        terms: 'Terms and Conditions'
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

function initializePasswordStrength() {
    const passwordField = document.getElementById('password');
    if (!passwordField) return;
    
    passwordField.addEventListener('input', function() {
        const password = this.value;
        const strengthFill = document.getElementById('strengthFill');
        const strengthText = document.getElementById('strengthText');
        
        if (!strengthFill || !strengthText) return;
        
        const strength = calculatePasswordStrength(password);
        
        strengthFill.className = 'strength-fill';
        strengthFill.classList.add(strength.level);
        strengthText.textContent = strength.text;
    });
}

function calculatePasswordStrength(password) {
    let score = 0;
    let feedback = [];
    
    if (password.length >= 8) score += 1;
    else feedback.push('at least 8 characters');
    
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('lowercase letters');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('uppercase letters');
    
    if (/\d/.test(password)) score += 1;
    else feedback.push('numbers');
    
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push('special characters');
    
    if (score < 2) {
        return { level: 'weak', text: 'Weak password' };
    } else if (score < 4) {
        return { level: 'medium', text: 'Medium strength' };
    } else {
        return { level: 'strong', text: 'Strong password' };
    }
}

function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const toggle = field.parentElement.querySelector('.password-toggle i');
    
    if (field.type === 'password') {
        field.type = 'text';
        toggle.classList.remove('fa-eye');
        toggle.classList.add('fa-eye-slash');
    } else {
        field.type = 'password';
        toggle.classList.remove('fa-eye-slash');
        toggle.classList.add('fa-eye');
    }
}

function initializeMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
        
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            });
        });
    }
}

function initializeModals() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                openModal.classList.remove('show');
            }
        }
    });
}

function initializeFormSubmissions() {
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    const signinForm = document.getElementById('signinForm');
    if (signinForm) {
        signinForm.addEventListener('submit', handleSignin);
    }
    
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    if (isLoading) return;
    
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
        const signupData = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirmPassword').value,
            dateOfBirth: document.getElementById('dateOfBirth').value,
            gender: document.getElementById('gender').value,
            role: document.getElementById('role').value
        };
        
        const response = await apiCall(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.SIGNUP), {
            method: 'POST',
            body: JSON.stringify(signupData)
        });
        
        hideLoading();
        
        if (response.success && response.data.success) {
            showSuccessModal();
            form.reset();
        } else {
            const errorMsg = response.error || (response.data?.detail || response.data?.message || 'An error occurred');
            showNotification(errorMsg, 'error');
        }
        
    } catch (error) {
        hideLoading();
        showNotification('An error occurred. Please try again.', 'error');
    }
}

async function handleSignin(e) {
    e.preventDefault();
    
    if (isLoading) return;
    
    const form = e.target;
    const formData = new FormData(form);
    
    const inputs = form.querySelectorAll('input[required]');
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
        const signinData = {
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value
        };
        
        const response = await apiCall(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.SIGNIN), {
            method: 'POST',
            body: JSON.stringify(signinData)
        });
        
        hideLoading();
        
        if (response.success && response.data.success) {
            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify(response.data.data));
            showNotification('Sign in successful! Redirecting...', 'success');
            
            // Redirect based on user role
            const userRole = response.data.data?.role;
            setTimeout(() => {
                if (userRole === 'doctor') {
                    window.location.href = 'dashboard.html';
                } else {
                    window.location.href = 'prediction.html';
                }
            }, 1000);
        } else {
            // Handle error cases
            const errorMsg = response.error || (response.data?.detail || response.data?.message || 'Invalid credentials. Please try again.');
            showNotification(errorMsg, 'error');
        }
        
    } catch (error) {
        hideLoading();
        showNotification('An error occurred. Please try again.', 'error');
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    
    if (isLoading) return;
    
    const form = e.target;
    const email = form.querySelector('#resetEmail').value;
    
    if (!email) {
        showNotification('Please enter your email address', 'error');
        return;
    }
    
    showLoading();
    
    try {
        await simulateApiCall(1000);
        hideLoading();
        closeForgotPassword();
        showSuccessModal();
        
    } catch (error) {
        hideLoading();
        showNotification('An error occurred. Please try again.', 'error');
    }
}

function showForgotPassword() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeForgotPassword() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function showSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function redirectToSignIn() {
    closeSuccessModal();
    window.location.href = 'signin.html';
}

function showLoading() {
    isLoading = true;
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('show');
    }
}

function hideLoading() {
    isLoading = false;
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function getNotificationColor(type) {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    return colors[type] || '#3b82f6';
}

function simulateApiCall(delay = 1000) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() > 0.1) {
                resolve();
            } else {
                reject(new Error('Simulated API error'));
            }
        }, delay);
    });
}

const notificationStyles = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0.25rem;
        margin-left: auto;
    }
    
    .notification-close:hover {
        opacity: 0.8;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);