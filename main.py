import os
import re
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from bs4 import BeautifulSoup
from langchain_community.document_loaders import RecursiveUrlLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

app = FastAPI(title="Multi-Site RAG Chatbot API",version="1.0.0",docs_url="/swagger")

# Enable CORS so any website or widget can make requests to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Setup Models & Vector Storage
# ---------------------------------------------------------------------------
PERSIST_DIRECTORY = "./multi_site_chroma_db"

embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-small-en-v1.5")
vectorstore = Chroma(persist_directory=PERSIST_DIRECTORY, embedding_function=embeddings)

llm = ChatNVIDIA(
    model="openai/gpt-oss-20b",
    api_key=os.getenv("NVIDIA_API_KEY"),
    temperature=0.6,
    top_p=1,
    max_tokens=4096,
)

prompt_template_old = ChatPromptTemplate.from_template(
    """You are an assistant answering questions about the website content.
Use ONLY the provided context. If the answer is not in the context, state that you do not know.

Context:
{context}

Question: {question}

Answer:"""
)

# prompt_template = ChatPromptTemplate.from_template(
#     """You are a helpful and polite website assistant.
# Answer user questions using ONLY the provided context. If the answer is not in the context, state that you do not know.

# Formatting guidelines:
# - Use clean, conversational language.
# - Format lists with simple bullet points or clear line breaks.
# - Do not clump all information into a single unbroken line.

# Context:
# {context}

# Question: {question}

# Answer:"""
# )


prompt_template = ChatPromptTemplate.from_template(
    """You are a helpful and polite assistant representing the website owner.
Answer user questions using the provided context.

Rules:
1. If the exact project type (like "matrimony", "e-commerce", etc.) or exact page count isn't explicitly listed, explain the base rates and relevant technologies (e.g., single-page, multi-page, Django backend, React) from the context.
2. Provide an estimate based on the closest matching services if possible, or explain that custom multi-page solutions can be discussed.
3. Encourage the user to contact directly for a personalized quote.
4. Only say you do not know if the context has no relevant services or contact information at all.

Context:
{context}

Question: {question}

Answer:"""
)

def bs4_extractor(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
        tag.decompose()
    return re.sub(r"\s+", " ", soup.get_text(separator=" ")).strip()

# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------
class IngestRequest(BaseModel):
    site_id: str          # e.g., "gautam_portfolio" or "client_a"
    root_url: str
    max_depth: Optional[int] = 3

class ChatRequest(BaseModel):
    site_id: str          # Tells the API which website's docs to search
    message: str

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.post("/api/crawl-and-index")
def crawl_and_index(req: IngestRequest):
    """Crawl a website and tag every chunk with site_id."""
    loader = RecursiveUrlLoader(
        url=req.root_url,
        max_depth=req.max_depth,
        extractor=bs4_extractor,
        prevent_outside=True,
        use_async=False,
    )
    raw_docs = loader.load()

    if not raw_docs:
        raise HTTPException(status_code=400, detail="Could not extract any content from the URL.")

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
    splits = text_splitter.split_documents(raw_docs)

    # Attach site_id to metadata for tenancy filtering
    for doc in splits:
        doc.metadata["site_id"] = req.site_id

    vectorstore.add_documents(splits)
    return {"status": "success", "site_id": req.site_id, "chunks_added": len(splits)}


@app.post("/api/chat")
def chat(req: ChatRequest):
    """Query Chroma filtered strictly by site_id."""
    # Filter documents by site_id so websites do not cross-contaminate
    retriever = vectorstore.as_retriever(
        search_kwargs={"k": 4, "filter": {"site_id": req.site_id}}
    )

    docs = retriever.invoke(req.message)
    if not docs:
        return {"reply": "I do not have any information indexed for this site yet."}

    context = "\n\n".join(doc.page_content for doc in docs)
    chain = prompt_template | llm | StrOutputParser()
    
    reply = chain.invoke({"context": context, "question": req.message})
    return {"reply": reply}