let currentPage = 1;
const pageSize = 10;
let paginationData = {};

document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    setupLogout();
    loadPatientData(1);
    setupPagination();
    setupSearch();
    setupRefresh();
});

function checkAuthentication() {
    const user = getUserData();
    
    if (!user) {
        showNotification('Please sign in to access this page', 'error');
        setTimeout(() => {
            window.location.href = 'signin.html';
        }, 1500);
        return false;
    }
    
    // Check if user is a doctor
    if (user.role !== 'doctor') {
        showNotification('Access denied. This page is for doctors only.', 'error');
        setTimeout(() => {
            window.location.href = user.role === 'patient' ? 'prediction.html' : 'index.html';
        }, 2000);
        return false;
    }
    
    const userNameElement = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (user.name && userNameElement) {
        userNameElement.textContent = `Dr. ${user.name}`;
        userNameElement.style.color = '#3b82f6';
        userNameElement.style.fontWeight = '500';
    }
    
    if (logoutBtn) {
        logoutBtn.style.display = 'inline-block';
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

async function loadPatientData(page = 1) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const patientsTable = document.getElementById('patientsTable');
    const noDataMessage = document.getElementById('noDataMessage');
    const paginationContainer = document.getElementById('paginationContainer');
    
    loadingIndicator.style.display = 'block';
    patientsTable.style.display = 'none';
    noDataMessage.style.display = 'none';
    paginationContainer.style.display = 'none';
    
    currentPage = page;
    
    try {
        const url = `${getApiUrl(API_CONFIG.ENDPOINTS.DASHBOARD.PATIENTS)}?page=${page}&page_size=${pageSize}`;
        const response = await apiCall(url);
        
        if (response.success && response.data.success) {
            const data = response.data;
            paginationData = data;
            
            displayStats(data);
            displayPatients(data.predictions);
            updatePaginationControls(data);
            
            loadingIndicator.style.display = 'none';
            if (data.predictions.length > 0) {
                patientsTable.style.display = 'block';
                paginationContainer.style.display = 'block';
            } else {
                noDataMessage.style.display = 'block';
            }
        } else {
            loadingIndicator.style.display = 'none';
            noDataMessage.style.display = 'block';
            const errorMsg = response.error || (response.data?.detail || 'Failed to load patient data');
            showNotification(errorMsg, 'error');
        }
    } catch (error) {
        loadingIndicator.style.display = 'none';
        noDataMessage.style.display = 'block';
        showNotification('An error occurred while loading patient data', 'error');
    }
}

function displayStats(data) {
    const statsContainer = document.getElementById('statsContainer');
    
    const stats = [
        {
            label: 'Total Patients',
            value: data.total_patients,
            icon: 'fa-users',
            color: '#3b82f6',
            bg: '#dbeafe'
        },
        {
            label: 'Total Predictions',
            value: data.total_predictions,
            icon: 'fa-chart-line',
            color: '#8b5cf6',
            bg: '#ede9fe'
        },
        {
            label: 'High Risk',
            value: data.high_risk_count,
            icon: 'fa-exclamation-circle',
            color: '#ef4444',
            bg: '#fee2e2'
        },
        {
            label: 'Moderate Risk',
            value: data.moderate_risk_count,
            icon: 'fa-exclamation-triangle',
            color: '#f59e0b',
            bg: '#fef3c7'
        },
        {
            label: 'Low Risk',
            value: data.low_risk_count,
            icon: 'fa-check-circle',
            color: '#10b981',
            bg: '#d1fae5'
        }
    ];
    
    statsContainer.innerHTML = stats.map(stat => `
        <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; border-left: 4px solid ${stat.color}; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="background: ${stat.bg}; padding: 1rem; border-radius: 0.5rem;">
                    <i class="fas ${stat.icon}" style="font-size: 1.5rem; color: ${stat.color};"></i>
                </div>
                <div>
                    <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">${stat.label}</div>
                    <div style="font-size: 2rem; font-weight: 700; color: ${stat.color};">${stat.value}</div>
                </div>
            </div>
        </div>
    `).join('');
}

function displayPatients(predictions) {
    const tableBody = document.getElementById('patientsTableBody');
    
    if (predictions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #64748b;">
                    No patients found
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = predictions.map(pred => {
        const riskLevel = pred.prediction?.risk_level || 'Low';
        const probability = pred.prediction?.probability || 0;
        const probabilityPercent = (probability * 100).toFixed(2);
        
        let riskColor, riskBg;
        if (riskLevel === 'High') {
            riskColor = '#ef4444';
            riskBg = '#fee2e2';
        } else if (riskLevel === 'Moderate') {
            riskColor = '#f59e0b';
            riskBg = '#fef3c7';
        } else {
            riskColor = '#10b981';
            riskBg = '#d1fae5';
        }
        
        const date = new Date(pred.created_at);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        return `
            <tr style="border-bottom: 1px solid #e2e8f0; transition: background 0.2s;" 
                onmouseover="this.style.background='#f8fafc'" 
                onmouseout="this.style.background='white'">
                <td style="padding: 1rem; color: #1e293b; font-weight: 500;">
                    ${pred.user_name || 'Unknown'}
                </td>
                <td style="padding: 1rem; color: #64748b;">${pred.user_email}</td>
                <td style="padding: 1rem; color: #64748b;">${pred.input_data?.age || 'N/A'}</td>
                <td style="padding: 1rem;">
                    <span style="background: ${riskBg}; color: ${riskColor}; padding: 0.5rem 1rem; border-radius: 0.25rem; font-weight: 600; font-size: 0.875rem;">
                        ${riskLevel}
                    </span>
                </td>
                <td style="padding: 1rem; color: #1e293b; font-weight: 600;">${probabilityPercent}%</td>
                <td style="padding: 1rem; color: #64748b; font-size: 0.875rem;">${formattedDate}</td>
                <td style="padding: 1rem; text-align: center;">
                    <button onclick="viewPatientDetails('${pred.prediction_id}')" 
                            class="btn-primary" 
                            style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function viewPatientDetails(predictionId) {
    const prediction = (paginationData.predictions || []).find(p => p.prediction_id === predictionId);
    
    if (!prediction) {
        showNotification('Patient details not found', 'error');
        return;
    }
    
    const modal = document.getElementById('patientDetailsModal');
    const modalName = document.getElementById('modalPatientName');
    const modalDetails = document.getElementById('modalPatientDetails');
    
    modalName.textContent = `${prediction.user_name || 'Unknown'} - Details`;
    
    const riskLevel = prediction.prediction?.risk_level || 'Low';
    const probability = prediction.prediction?.probability || 0;
    const probabilityPercent = (probability * 100).toFixed(2);
    
    let riskColor, riskBg;
    if (riskLevel === 'High') {
        riskColor = '#ef4444';
        riskBg = '#fee2e2';
    } else if (riskLevel === 'Moderate') {
        riskColor = '#f59e0b';
        riskBg = '#fef3c7';
    } else {
        riskColor = '#10b981';
        riskBg = '#d1fae5';
    }
    
    const date = new Date(prediction.created_at);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    
    const inputData = prediction.input_data || {};
    
    modalDetails.innerHTML = `
        <div style="display: grid; gap: 1.5rem;">
            <div style="background: ${riskBg}; padding: 1.5rem; border-radius: 0.5rem; border-left: 4px solid ${riskColor};">
                <h3 style="margin: 0 0 1rem 0; color: ${riskColor};">Risk Assessment</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div>
                        <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Risk Level</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: ${riskColor};">${riskLevel}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Probability</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: ${riskColor};">${probabilityPercent}%</div>
                    </div>
                </div>
            </div>
            
            <div>
                <h3 style="margin: 0 0 1rem 0; color: #1e293b;">Patient Information</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; background: #f8fafc; padding: 1.5rem; border-radius: 0.5rem;">
                    <div>
                        <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Name</div>
                        <div style="font-weight: 600; color: #1e293b;">${prediction.user_name || 'Unknown'}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Email</div>
                        <div style="font-weight: 600; color: #1e293b;">${prediction.user_email}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Age</div>
                        <div style="font-weight: 600; color: #1e293b;">${inputData.age || 'N/A'}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Gender</div>
                        <div style="font-weight: 600; color: #1e293b;">${inputData.gender || 'N/A'}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Hypertension</div>
                        <div style="font-weight: 600; color: #1e293b;">${inputData.hypertension === 1 ? 'Yes' : 'No'}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Heart Disease</div>
                        <div style="font-weight: 600; color: #1e293b;">${inputData.heart_disease === 1 ? 'Yes' : 'No'}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Ever Married</div>
                        <div style="font-weight: 600; color: #1e293b;">${inputData.ever_married || 'N/A'}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Work Type</div>
                        <div style="font-weight: 600; color: #1e293b;">${inputData.work_type || 'N/A'}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Residence Type</div>
                        <div style="font-weight: 600; color: #1e293b;">${inputData.Residence_type || 'N/A'}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Avg Glucose Level</div>
                        <div style="font-weight: 600; color: #1e293b;">${inputData.avg_glucose_level || 'N/A'}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">BMI</div>
                        <div style="font-weight: 600; color: #1e293b;">${inputData.bmi || 'N/A'}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Smoking Status</div>
                        <div style="font-weight: 600; color: #1e293b;">${inputData.smoking_status || 'N/A'}</div>
                    </div>
                </div>
            </div>
            
            <div>
                <h3 style="margin: 0 0 1rem 0; color: #1e293b;">Prediction Date</h3>
                <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; color: #64748b;">
                    ${formattedDate}
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
}

function closePatientModal() {
    const modal = document.getElementById('patientDetailsModal');
    modal.classList.remove('show');
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // Note: Search will work on current page only
        // For full search, you'd need to implement server-side search
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            const currentPredictions = paginationData.predictions || [];
            
            if (searchTerm === '') {
                displayPatients(currentPredictions);
                return;
            }
            
            const filtered = currentPredictions.filter(pred => {
                const name = (pred.user_name || '').toLowerCase();
                const email = (pred.user_email || '').toLowerCase();
                const riskLevel = (pred.prediction?.risk_level || '').toLowerCase();
                
                return name.includes(searchTerm) || 
                       email.includes(searchTerm) || 
                       riskLevel.includes(searchTerm);
            });
            
            displayPatients(filtered);
        });
    }
}

function setupRefresh() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadPatientData(currentPage);
        });
    }
}

function setupPagination() {
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                loadPatientData(currentPage - 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (paginationData.has_next) {
                loadPatientData(currentPage + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
}

function updatePaginationControls(data) {
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const currentPageNum = document.getElementById('currentPageNum');
    const totalPagesNum = document.getElementById('totalPagesNum');
    const showingFrom = document.getElementById('showingFrom');
    const showingTo = document.getElementById('showingTo');
    const totalItems = document.getElementById('totalItems');
    
    if (prevBtn) {
        prevBtn.disabled = !data.has_prev;
        prevBtn.style.opacity = data.has_prev ? '1' : '0.5';
        prevBtn.style.cursor = data.has_prev ? 'pointer' : 'not-allowed';
    }
    
    if (nextBtn) {
        nextBtn.disabled = !data.has_next;
        nextBtn.style.opacity = data.has_next ? '1' : '0.5';
        nextBtn.style.cursor = data.has_next ? 'pointer' : 'not-allowed';
    }
    
    if (currentPageNum) currentPageNum.textContent = data.current_page;
    if (totalPagesNum) totalPagesNum.textContent = data.total_pages;
    if (totalItems) totalItems.textContent = data.total_predictions;
    
    // Calculate showing range
    const start = (data.current_page - 1) * data.page_size + 1;
    const end = Math.min(start + data.predictions.length - 1, data.total_predictions);
    
    if (showingFrom) showingFrom.textContent = data.total_predictions > 0 ? start : 0;
    if (showingTo) showingTo.textContent = end;
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('patientDetailsModal');
    if (e.target === modal) {
        closePatientModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closePatientModal();
    }
});

