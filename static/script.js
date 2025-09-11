// Certificate Validator - Main JavaScript

// ==========================
// Certificate Upload & Verify
// ==========================
document.addEventListener('DOMContentLoaded', function () {
    // Initialize elements
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadForm = document.getElementById('uploadForm');
    const resultsSection = document.getElementById('results');
    const spinner = document.getElementById('spinner');

    // File upload handling
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                handleFileSelect(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
            }
        });
    }

    // Handle file selection
    function handleFileSelect(file) {
        const fileName = document.getElementById('fileName');
        if (fileName) {
            fileName.textContent = `Selected: ${file.name}`;
        }

        // Auto-submit if form exists
        if (uploadForm) {
            submitForm();
        }
    }

    // Form submission
    function submitForm() {
        if (!fileInput.files || fileInput.files.length === 0) {
            showAlert('Please select a certificate file to verify', 'danger');
            return;
        }

        const formData = new FormData();
        formData.append('certificate', fileInput.files[0]);

        // Show spinner
        if (spinner) spinner.classList.add('show');
        if (resultsSection) resultsSection.classList.remove('show');

        fetch('/api/verify', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (spinner) spinner.classList.remove('show');

                if (data.error) {
                    showAlert(data.error, 'danger');
                } else {
                    displayResults(data);
                }
            })
            .catch(error => {
                if (spinner) spinner.classList.remove('show');
                showAlert('An error occurred during verification. Please try again.', 'danger');
                console.error('Error:', error);
            });
    }

    // Display verification results
    function displayResults(data) {
        if (!resultsSection) return;

        resultsSection.innerHTML = '';
        resultsSection.classList.add('show');

        // Create result card
        const resultCard = document.createElement('div');
        resultCard.className = `result-card result-${data.status.toLowerCase()}`;

        // Status header
        const statusHeader = document.createElement('div');
        statusHeader.className = 'result-header';

        const icon = document.createElement('div');
        icon.className = 'result-icon';
        icon.innerHTML = getStatusIcon(data.status);

        const statusInfo = document.createElement('div');
        statusInfo.innerHTML = `
            <h3>${getStatusTitle(data.status)}</h3>
            <p>Verification ID: ${data.verification_id}</p>
        `;

        statusHeader.appendChild(icon);
        statusHeader.appendChild(statusInfo);
        resultCard.appendChild(statusHeader);

        // Confidence meter
        const confidenceMeter = document.createElement('div');
        confidenceMeter.innerHTML = `
            <h4>Confidence Score: ${(data.confidence * 100).toFixed(1)}%</h4>
            <div class="confidence-meter">
                <div class="confidence-fill" style="width: ${data.confidence * 100}%"></div>
            </div>
        `;
        resultCard.appendChild(confidenceMeter);

        // Extracted data
        if (data.details && data.details.extracted_data) {
            const extractedData = document.createElement('div');
            extractedData.innerHTML = '<h4>Extracted Information:</h4>';

            const table = document.createElement('table');
            table.className = 'data-table';

            for (const [key, value] of Object.entries(data.details.extracted_data)) {
                if (value) {
                    const row = table.insertRow();
                    row.innerHTML = `
                        <td><strong>${formatFieldName(key)}</strong></td>
                        <td>${value}</td>
                    `;
                }
            }

            extractedData.appendChild(table);
            resultCard.appendChild(extractedData);
        }

        // Anomalies
        if (data.details && data.details.anomalies && data.details.anomalies.length > 0) {
            const anomalies = document.createElement('div');
            anomalies.innerHTML = `
                <h4>Issues Detected:</h4>
                <ul>
                    ${data.details.anomalies.map(a => `<li>${a}</li>`).join('')}
                </ul>
            `;
            resultCard.appendChild(anomalies);
        }

        // Recommendations
        if (data.recommendations && data.recommendations.length > 0) {
            const recommendations = document.createElement('div');
            recommendations.innerHTML = `
                <h4>Recommendations:</h4>
                <ul>
                    ${data.recommendations.map(r => `<li>${r}</li>`).join('')}
                </ul>
            `;
            resultCard.appendChild(recommendations);
        }

        resultsSection.appendChild(resultCard);
    }

    // Helper functions
    function getStatusIcon(status) {
        switch (status) {
            case 'AUTHENTIC':
                return '✓';
            case 'SUSPICIOUS':
                return '⚠';
            case 'FAKE':
                return '✗';
            default:
                return '?';
        }
    }

    function getStatusTitle(status) {
        switch (status) {
            case 'AUTHENTIC':
                return 'Certificate Appears Authentic';
            case 'SUSPICIOUS':
                return 'Certificate Requires Review';
            case 'FAKE':
                return 'Certificate Appears Fraudulent';
            case 'ERROR':
                return 'Verification Error';
            default:
                return 'Unknown Status';
        }
    }

    function formatFieldName(fieldName) {
        return fieldName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;

        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(alertDiv, container.firstChild);

            setTimeout(() => {
                alertDiv.remove();
            }, 5000);
        }
    }

    // Attach submit handler to button
    const verifyBtn = document.getElementById('verifyBtn');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', submitForm);
    }
});

// ==========================
// Mobile Navigation Toggle
// ==========================
document.addEventListener('DOMContentLoaded', function () {
    const navbarToggle = document.querySelector('.navbar-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');

    if (navbarToggle && navbarMenu) {
        navbarToggle.addEventListener('click', () => {
            navbarMenu.classList.toggle('active');
        });

        // Close menu when clicking on a link
        navbarMenu.querySelectorAll('.navbar-link').forEach(link => {
            link.addEventListener('click', () => {
                navbarMenu.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navbarToggle.contains(e.target) && !navbarMenu.contains(e.target)) {
                navbarMenu.classList.remove('active');
            }
        });
    }
});

// ==========================
// Admin Functions
// ==========================
const addInstitutionForm = document.getElementById('addInstitutionForm');
if (addInstitutionForm) {
    addInstitutionForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(addInstitutionForm);
        const data = Object.fromEntries(formData);

        fetch('/api/institutions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(result => {
                if (result.error) {
                    showAlert(result.error, 'danger');
                } else {
                    showAlert('Institution added successfully', 'success');
                    addInstitutionForm.reset();
                    location.reload();
                }
            })
            .catch(error => {
                showAlert('Error adding institution', 'danger');
                console.error('Error:', error);
            });
    });
}

// Add certificate form
const addCertificateForm = document.getElementById('addCertificateForm');
if (addCertificateForm) {
    addCertificateForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(addCertificateForm);
        const data = Object.fromEntries(formData);

        // Convert SGPA to float
        if (data.sgpa) {
            data.sgpa = parseFloat(data.sgpa);
        }

        fetch('/api/certificates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(result => {
                if (result.error) {
                    showAlert(result.error, 'danger');
                } else {
                    showAlert('Certificate added successfully', 'success');
                    addCertificateForm.reset();
                }
            })
            .catch(error => {
                showAlert('Error adding certificate', 'danger');
                console.error('Error:', error);
            });
    });
}
