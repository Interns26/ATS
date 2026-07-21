from pathlib import Path
from pypdf import PdfReader
from docx import Document


def extract_pdf(path: str):

    reader = PdfReader(path)

    text = ""

    for page in reader.pages:
        text += page.extract_text() + "\n"

    return text


def extract_docx(path: str):

    doc = Document(path)

    return "\n".join(p.text for p in doc.paragraphs)


def extract_resume_text(path: str):

    ext = Path(path).suffix.lower()

    if ext == ".pdf":
        return extract_pdf(path)

    elif ext == ".docx":
        return extract_docx(path)

    else:
        raise ValueError("Unsupported file format.")