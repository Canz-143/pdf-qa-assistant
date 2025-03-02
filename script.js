// Initialize PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('pdfUpload');
const fileInfo = document.getElementById('fileInfo');
const uploadButton = document.getElementById('uploadButton');
const uploadStatus = document.getElementById('uploadStatus');
const uploadProgressContainer = document.getElementById('uploadProgressContainer');
const uploadProgressBar = document.getElementById('uploadProgressBar');
const pdfPreview = document.getElementById('pdfPreview');
const pdfViewer = document.getElementById('pdfViewer');
const questionInput = document.getElementById('questionInput');
const askButton = document.getElementById('askButton');
const chatContainer = document.getElementById('chatContainer');
const qaSection = document.getElementById('qaSection');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingMessage = document.getElementById('loadingMessage');
const exportButton = document.getElementById('exportButton');
const clearButton = document.getElementById('clearButton');
const settingsButton = document.getElementById('settingsButton');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettings = document.getElementById('closeSettings');
const saveSettings = document.getElementById('saveSettings');
const darkModeToggle = document.getElementById('darkModeToggle');
const modelSelect = document.getElementById('modelSelect');
const temperatureSlider = document.getElementById('temperatureSlider');

// App State
let currentFile = null;
let pdfDocument = null;
let chatHistory = [];
let settings = {
    model: 'deepseek-r1:1.5b',
    temperature: 0.7
};

// Check for dark mode preference
if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    darkModeToggle.checked = true;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    // File drag & drop
    setupDragAndDrop();
    
    // File selection
    fileInput.addEventListener('change', handleFileSelection);
    
    // Upload button
    uploadButton.addEventListener('click', uploadPDF);
    
    // Question input
    questionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            askQuestion();
        }
    });
    
    // Ask button
    askButton.addEventListener('click', askQuestion);
    
    // Action buttons
    exportButton.addEventListener('click', exportConversation);
    clearButton.addEventListener('click', clearConversation);
    settingsButton.addEventListener('click', toggleSettings);
    closeSettings.addEventListener('click', toggleSettings);
    saveSettings.addEventListener('click', saveSettingsHandler);
    
    // Dark mode toggle
    darkModeToggle.addEventListener('change', toggleDarkMode);
    
    // Load settings if available
    loadSettings();
}

function setupDragAndDrop() {
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('active');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('active');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('active');
        
        if (e.dataTransfer.files.length) {
            handleFiles(e.dataTransfer.files);
        }
    });
    
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
}

function handleFileSelection() {
    if (fileInput.files.length) {
        handleFiles(fileInput.files);
    }
}

function handleFiles(files) {
    if (files.length === 0) return;
    
    const file = files[0];
    
    // Check if file is PDF
    if (file.type !== 'application/pdf') {
        showStatus('Please upload a PDF file.', 'error');
        return;
    }
    
    currentFile = file;
    fileInfo.textContent = `${file.name} (${formatFileSize(file.size)})`;
    uploadButton.disabled = false;
    
    // Show PDF preview
    const fileReader = new FileReader();
    fileReader.onload = function(e) {
        const typedArray = new Uint8Array(e.target.result);
        renderPdfPreview(typedArray);
    };
    fileReader.readAsArrayBuffer(file);
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

function renderPdfPreview(pdfData) {
    // Load the PDF document
    pdfjsLib.getDocument({ data: pdfData }).promise.then(function(pdf) {
        pdfDocument = pdf;
        
        // Get the first page
        return pdf.getPage(1);
    }).then(function(page) {
        const viewport = page.getViewport({ scale: 1.0 });
        
        // Prepare canvas for rendering
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Clear previous preview if exists
        pdfViewer.innerHTML = '';
        pdfViewer.appendChild(canvas);
        
        // Render the page
        page.render({
            canvasContext: context,
            viewport: viewport
        });
        
        // Show the preview
        pdfPreview.style.display = 'block';
    }).catch(function(error) {
        console.error('Error loading PDF for preview:', error);
    });
}

function uploadPDF() {
    if (!currentFile) {
        showStatus('Please select a file to upload.', 'error');
        return;
    }
    
    // Show progress bar
    uploadProgressContainer.style.display = 'block';
    uploadProgressBar.style.width = '0%';
    
    const formData = new FormData();
    formData.append('file', currentFile);
    
    // Create XMLHttpRequest for progress tracking
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            uploadProgressBar.style.width = percentComplete + '%';
        }
    });
    
    xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
            try {
                const response = JSON.parse(xhr.responseText);
                showStatus(response.message || 'File uploaded successfully!', 'success');
                askButton.disabled = false;
                questionInput.disabled = false;
                qaSection.scrollIntoView({ behavior: 'smooth' });
            } catch (error) {
                showStatus('Error processing server response.', 'error');
            }
        } else {
            showStatus('Error uploading file. Server returned: ' + xhr.status, 'error');
        }
    });
    
    xhr.addEventListener('error', () => {
        showStatus('Network error occurred while uploading.', 'error');
    });
    
    xhr.open('POST', 'http://127.0.0.1:5000/upload', true);
    xhr.send(formData);
}

function showStatus(message, type) {
    uploadStatus.textContent = message;
    uploadStatus.className = 'status-message';
    uploadStatus.classList.add(type);
    uploadStatus.style.display = 'block';
    
    // Hide after 5 seconds if it's a success message
    if (type === 'success') {
        setTimeout(() => {
            uploadStatus.style.display = 'none';
        }, 5000);
    }
}

function askQuestion() {
    const question = questionInput.value.trim();
    
    if (!question) {
        alert('Please enter a question.');
        return;
    }
    
    // Add user message to chat
    addMessageToChat('user', question);
    
    // Clear input
    questionInput.value = '';
    
    // Show loading indicator
    showLoading('Thinking...');
    
    // Send question to server with current settings
    fetch('http://127.0.0.1:5000/ask', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            question: question,
            model: settings.model,
            temperature: settings.temperature
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Server response: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        hideLoading();
        if (data.error) {
            addMessageToChat('bot', 'Error: ' + data.error);
        } else {
            addMessageToChat('bot', data.answer || 'No answer provided.');
        }
    })
    .catch(error => {
        hideLoading();
        console.error('Question error:', error);
        addMessageToChat('bot', 'Sorry, there was an error processing your question. Please try again.');
    });
}

function addMessageToChat(sender, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    // Format message content
    const formattedContent = formatMessageContent(content);
    messageDiv.innerHTML = formattedContent;
    
    // Add timestamp
    const timeSpan = document.createElement('div');
    timeSpan.className = 'message-time';
    timeSpan.textContent = new Date().toLocaleTimeString();
    messageDiv.appendChild(timeSpan);
    
    // Add to chat container
    chatContainer.appendChild(messageDiv);
    
    // Auto scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Save to chat history
    chatHistory.push({
        sender: sender,
        content: content,
        timestamp: new Date().toISOString()
    });
}

function formatMessageContent(content) {
    // Convert URLs to links
    content = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    
    // Convert markdown code blocks
    content = content.replace(/```(\w+)?\n([\s\S]*?)\n```/g, '<pre><code>$2</code></pre>');
    
    // Convert inline code
    content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Convert line breaks
    content = content.replace(/\n/g, '<br>');
    
    return content;
}

function showLoading(message) {
    loadingMessage.textContent = message || 'Processing...';
    loadingOverlay.style.display = 'flex';
    askButton.disabled = true;
    questionInput.disabled = true;
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
    askButton.disabled = false;
    questionInput.disabled = false;
    questionInput.focus();
}

function exportConversation() {
    if (chatHistory.length === 0) {
        alert('No conversation to export.');
        return;
    }
    
    let exportContent = '# PDF Q&A Conversation\n';
    exportContent += `Date: ${new Date().toLocaleString()}\n\n`;
    
    chatHistory.forEach(message => {
        const sender = message.sender === 'user' ? 'You' : 'Assistant';
        const timestamp = new Date(message.timestamp).toLocaleString();
        exportContent += `## ${sender} (${timestamp})\n${message.content}\n\n`;
    });
    
    // Create a blob and download link
    const blob = new Blob([exportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdf-qa-conversation-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}

function clearConversation() {
    if (chatHistory.length === 0) {
        return;
    }
    
    if (confirm('Are you sure you want to clear the current conversation?')) {
        chatContainer.innerHTML = '';
        chatHistory = [];
    }
}

function toggleSettings() {
    settingsPanel.classList.toggle('active');
}

function saveSettingsHandler() {
    // Get values from form
    settings.model = modelSelect.value;
    settings.temperature = parseFloat(temperatureSlider.value);
    
    // Save to localStorage
    localStorage.setItem('pdfQASettings', JSON.stringify(settings));
    
    // Give feedback and close panel
    alert('Settings saved!');
    toggleSettings();
}

function loadSettings() {
    const savedSettings = localStorage.getItem('pdfQASettings');
    if (savedSettings) {
        try {
            settings = JSON.parse(savedSettings);
            
            // Apply saved settings to form
            modelSelect.value = settings.model;
            temperatureSlider.value = settings.temperature;
        } catch (e) {
            console.error('Error loading settings', e);
        }
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    
    // Save preference
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
    } else {
        localStorage.setItem('darkMode', 'disabled');
    }
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+Enter to send question
    if (e.ctrlKey && e.key === 'Enter' && document.activeElement === questionInput) {
        askQuestion();
    }
    
    // Esc to close settings panel
    if (e.key === 'Escape' && settingsPanel.classList.contains('active')) {
        toggleSettings();
    }
});