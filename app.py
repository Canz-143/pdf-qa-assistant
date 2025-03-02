import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain.chains import RetrievalQA
from langchain.vectorstores import FAISS
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.document_loaders import PyPDFLoader
from langchain.llms import Ollama

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load AI model
llm = Ollama(model="deepseek-r1:1.5b")

# Function to process PDF
def process_pdf(file_path):
    loader = PyPDFLoader(file_path)
    docs = loader.load()

    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vector_store = FAISS.from_documents(docs, embeddings)

    return RetrievalQA.from_chain_type(llm=llm, retriever=vector_store.as_retriever())

qa_chain = None  # Initially no PDF uploaded

@app.route("/upload", methods=["POST"])
def upload_pdf():
    global qa_chain

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    try:
        qa_chain = process_pdf(file_path)
        return jsonify({"message": "File uploaded and processed successfully"}), 200
    except Exception as e:
        print(f"Error processing PDF: {str(e)}")
        return jsonify({"error": f"Error processing PDF: {str(e)}"}), 500

@app.route("/ask", methods=["POST"])
def ask_question():
    global qa_chain

    if qa_chain is None:
        return jsonify({"error": "No PDF uploaded yet. Please upload a PDF first."}), 400

    data = request.get_json()
    question = data.get("question", "").strip()

    if not question:
        return jsonify({"error": "No question provided"}), 400

    try:
        response = qa_chain.run(question)

        if hasattr(response, "content"):
            response = response.content

        return jsonify({"answer": response}), 200
    except Exception as e:
        print(f"Error answering question: {str(e)}")
        return jsonify({"error": f"Error answering question: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True)
