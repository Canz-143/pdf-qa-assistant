# PDF Q&A Assistant

## Overview

PDF Q&A Assistant is a web application that allows users to upload PDF documents and ask questions about their content. The system leverages AI-powered natural language processing to retrieve and answer queries based on the uploaded document.

## Features

- **Drag & Drop PDF Upload**: Easily upload PDF files via a user-friendly drag-and-drop interface.
- **AI-Powered Q&A**: Ask questions about your PDF, and receive intelligent answers.
- **PDF Preview**: View the uploaded PDF within the application.
- **Dark Mode Support**: Toggle between light and dark mode for better accessibility.
- **Export Conversations**: Save Q&A interactions for future reference.

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (PDF.js)
- **Backend**: Python (Flask)
- **AI Models**: LangChain with Ollama, FAISS vector search, and deepseek 1.5b

### Libraries:

- `pdf.js` for PDF rendering
- `Flask` for API backend
- `langchain` for AI-driven Q&A
- `FAISS` for efficient document retrieval

## Installation & Setup

### Prerequisites

Ensure you have the following installed:

- Python 3.8+
- Flask and required dependencies
- Node.js (optional, for frontend tweaks)

### Steps

1. Clone the repository:
    ```sh
    git clone https://github.com/your-username/pdf-qa-assistant.git
    cd pdf-qa-assistant
    ```

2. Install backend dependencies:
    ```sh
    pip install -r requirements.txt
    ```

3. Run the Flask backend:
    ```sh
    python app.py
    ```

4. Open index.html in a browser to access the frontend.

## Usage

1. Upload a PDF file using the drag-and-drop interface.
2. Wait for the AI to process the document.
3. Ask questions in the input field and get answers in real time.
4. Adjust settings (LLM model, temperature) as needed.
5. Export or clear conversations as required.