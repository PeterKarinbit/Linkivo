# Document Processing API

This document outlines the document processing capabilities of the JobHunter backend, including file upload, text extraction, and AI analysis.

## Features

- **File Upload**: Support for PDF, DOCX, TXT, and Markdown files
- **Text Extraction**: Automatic extraction of text content from various file formats
- **AI Analysis**: Extraction of skills, experiences, and education using AI
- **Vector Search**: Semantic search across document content using embeddings
- **Document Management**: CRUD operations for user documents

## API Endpoints

### Upload a Document

```http
POST /api/v1/documents
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <file>
documentType: string (optional, default: 'other')
```

**Response**
```json
{
  "success": true,
  "data": {
    "_id": "document_id",
    "userId": "user_id",
    "originalName": "resume.pdf",
    "mimeType": "application/pdf",
    "documentType": "resume",
    "status": "processed",
    "structuredData": {
      "skills": [
        {"name": "JavaScript", "confidence": 0.9, "context": "Resume/CV content"}
      ],
      "experiences": [],
      "education": []
    },
    "createdAt": "2023-10-01T09:00:00.000Z",
    "updatedAt": "2023-10-01T09:00:05.000Z"
  }
}
```

### Get All Documents

```http
GET /api/v1/documents
Authorization: Bearer <token>
```

**Query Parameters**
- `documentType`: Filter by document type (optional)

### Get Document by ID

```http
GET /api/v1/documents/:id
Authorization: Bearer <token>
```

### Search Documents

```http
GET /api/v1/documents/search?query=search+term
Authorization: Bearer <token>
```

### Download Document File

```http
GET /api/v1/documents/:id/file
Authorization: Bearer <token>
```

### Delete Document

```http
DELETE /api/v1/documents/:id
Authorization: Bearer <token>
```

## Document Processing Pipeline

1. **File Upload**: File is received and saved to the server
2. **Text Extraction**: Text is extracted based on file type
   - PDF: Using pdf-parse
   - DOCX: Using mammoth
   - TXT/MD: Direct file read
3. **AI Analysis**: The extracted text is processed to extract:
   - Skills
   - Work experiences
   - Education
   - Other relevant information
4. **Vector Embedding**: The document content is converted to a vector embedding
5. **Storage**: All data is stored in MongoDB

## Setup

1. Install dependencies:
   ```bash
   npm install pdf-parse mammoth uuid @xenova/transformers
   ```

2. Create an uploads directory:
   ```bash
   mkdir -p uploads
   ```

3. Ensure MongoDB is running and properly configured in your `.env` file.

## Testing

Run the test script to verify document upload and processing:

```bash
node test-document-upload.js
```

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `UPLOAD_DIR`: Directory to store uploaded files (default: './uploads')
- `MAX_FILE_SIZE`: Maximum file size in bytes (default: 10MB)

## Security Considerations

- All uploads are authenticated
- File types are strictly validated
- File size is limited
- Sensitive data is not logged
- File paths are not directly exposed

## Future Enhancements

- Support for more file types
- More sophisticated AI analysis
- Batch processing of documents
- Integration with cloud storage (S3, GCS)
- Document comparison functionality
