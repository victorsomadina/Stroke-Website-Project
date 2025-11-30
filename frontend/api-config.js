// API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:8080',
    ENDPOINTS: {
        AUTH: {
            SIGNUP: '/auth/signup',
            SIGNIN: '/auth/signin'
        },
        PREDICTION: {
            PREDICT: '/prediction/predict'
        },
        DASHBOARD: {
            PATIENTS: '/dashboard/patients'
        },
        HEALTH: '/health'
    }
};

// Helper function to get full API URL
function getApiUrl(endpoint) {
    return `${API_CONFIG.BASE_URL}${endpoint}`;
}

// Helper function to get auth token from localStorage
function getAuthToken() {
    const user = localStorage.getItem('user');
    if (!user) return null;
    
    try {
        const userData = JSON.parse(user);
        return userData.token || userData.data?.token || null;
    } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
    }
}

// Helper function to get user data from localStorage
function getUserData() {
    const user = localStorage.getItem('user');
    if (!user) return null;
    
    try {
        return JSON.parse(user);
    } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
    }
}

// Helper function to check if user is authenticated
function isAuthenticated() {
    return getAuthToken() !== null;
}

// Helper function to make API calls with error handling
async function apiCall(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    // Add auth token if available
    const token = getAuthToken();
    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    };
    
    try {
        const response = await fetch(url, finalOptions);
        const data = await response.json();
        
        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
            localStorage.removeItem('user');
            if (window.location.pathname !== '/signin.html' && !window.location.pathname.includes('signin.html')) {
                showNotification('Your session has expired. Please sign in again.', 'error');
                setTimeout(() => {
                    window.location.href = 'signin.html';
                }, 2000);
            }
            throw new Error('Unauthorized');
        }
        
        // Handle other errors
        if (!response.ok) {
            const errorMsg = data.detail || data.message || `Error: ${response.status}`;
            throw new Error(errorMsg);
        }
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}


