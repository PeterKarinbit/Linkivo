class PDFGeneratorService {
  constructor() {
    this.templates = {
      modern: this.getModernTemplate(),
      executive: this.getExecutiveTemplate(),
      creative: this.getCreativeTemplate(),
      technical: this.getTechnicalTemplate()
    };
  }

  getModernTemplate() {
    return {
      name: 'Modern',
      fontFamily: 'Helvetica',
      primaryColor: '#2c3e50',
      secondaryColor: '#7f8c8d',
      fontSize: {
        header: 16,
        subheader: 12,
        body: 10
      }
    };
  }

  getExecutiveTemplate() {
    return {
      name: 'Executive',
      fontFamily: 'Times-Roman',
      primaryColor: '#34495e',
      secondaryColor: '#95a5a6',
      fontSize: {
        header: 18,
        subheader: 14,
        body: 11
      }
    };
  }

  getCreativeTemplate() {
    return {
      name: 'Creative',
      fontFamily: 'Avenir',
      primaryColor: '#e74c3c',
      secondaryColor: '#f1c40f',
      fontSize: {
        header: 20,
        subheader: 14,
        body: 10
      }
    };
  }

  getTechnicalTemplate() {
    return {
      name: 'Technical',
      fontFamily: 'Courier',
      primaryColor: '#2980b9',
      secondaryColor: '#3498db',
      fontSize: {
        header: 16,
        subheader: 12,
        body: 10
      }
    };
  }

  /**
   * Generate PDF from resume data
   */
  async generateResumePDF(resumeData, templateType = 'modern') {
    const template = this.templates[templateType];
    const doc = new PDFDocument();
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => Buffer.concat(buffers));

    // Add personal info
    doc.fontSize(16).text(resumeData.personalInfo.name);
    doc.fontSize(10).text(resumeData.personalInfo.email);
    doc.text(resumeData.personalInfo.phone);
    doc.text(resumeData.personalInfo.location);
    doc.moveDown();

    // Add summary
    doc.fontSize(12).text('Professional Summary');
    doc.fontSize(10).text(resumeData.summary);
    doc.moveDown();

    // Add skills
    doc.fontSize(12).text('Skills');
    doc.fontSize(10).list(resumeData.skills);

    doc.end();
    return new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(buffers))));
  }

  async generateCoverLetterPDF(coverLetterData) {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => Buffer.concat(buffers));

    // Add header
    doc.fontSize(10).text(coverLetterData.date, { align: 'right' });
    doc.moveDown();

    // Add recipient info
    doc.text(coverLetterData.recipientName);
    doc.text(coverLetterData.recipientTitle);
    doc.text(coverLetterData.companyName);
    doc.text(coverLetterData.companyAddress);
    doc.moveDown(2);

    // Add content
    doc.text(coverLetterData.content);
    doc.moveDown(2);

    // Add signature
    doc.text('Sincerely,');
    doc.moveDown();
    doc.text(coverLetterData.senderName);
    doc.text(coverLetterData.senderEmail);
    doc.text(coverLetterData.senderPhone);

    doc.end();
    return new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(buffers))));
  }
}

export default new PDFGeneratorService();