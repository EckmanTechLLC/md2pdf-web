const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { mdToPdf } = require('./dist/index.js');

const app = express();
const PORT = 3737;

// Configure multer for multiple file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Serve static files (HTML UI)
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Generate title page
function generateTitlePage(docTitle, logoPath) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  let titlePage = '<div style="text-align: center; margin-top: 250px;">\n\n';

  // Add logo if provided
  if (logoPath) {
    const logoBase64 = fs.readFileSync(logoPath).toString('base64');
    const logoExt = path.extname(logoPath).substring(1);
    titlePage += `<img src="data:image/${logoExt};base64,${logoBase64}" style="max-width: 300px; max-height: 150px; margin-bottom: 50px;" />\n\n`;
  }

  // Add title
  titlePage += `# ${docTitle}\n\n`;

  // Add metadata
  titlePage += `<p style="font-size: 1.2em; margin-top: 30px;">Prepared by <strong>Eckman Tech LLC</strong></p>\n\n`;
  titlePage += `<p style="font-size: 1em; color: #666;">${today}</p>\n\n`;
  titlePage += '</div>\n\n';

  // Page break
  titlePage += '<div style="page-break-after: always;"></div>\n\n';

  return titlePage;
}

// Generate Table of Contents from markdown
function generateTOC(markdownContent) {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const headings = [];
  let match;

  while ((match = headingRegex.exec(markdownContent)) !== null) {
    const level = match[1].length;
    const text = match[2];
    const id = text.toLowerCase().replace(/[^\w]+/g, '-');
    headings.push({ level, text, id });
  }

  if (headings.length === 0) return '';

  let toc = '# Table of Contents\n\n';
  headings.forEach(({ level, text, id }) => {
    const indent = '  '.repeat(level - 1);
    toc += `${indent}- [${text}](#${id})\n`;
  });
  toc += '\n---\n\n';

  return toc;
}

// Custom CSS for better document styling
function getCustomCSS(pageBreakSections) {
  let css = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
  }

  /* Headings */
  h1, h2, h3, h4, h5, h6 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
    line-height: 1.25;
    color: #2c3e50;
  }

  h1 {
    font-size: 2.5em;
    border-bottom: 3px solid #3498db;
    padding-bottom: 0.3em;
    margin-top: 0;
  }

  h2 {
    font-size: 2em;
    border-bottom: 2px solid #7f8c8d;
    padding-bottom: 0.3em;
  }

  h3 {
    font-size: 1.5em;
    color: #34495e;
  }

  h4 {
    font-size: 1.25em;
  }

  /* Paragraphs */
  p {
    margin-bottom: 1em;
  }

  /* Lists */
  ul, ol {
    margin-bottom: 1em;
    padding-left: 2em;
  }

  li {
    margin-bottom: 0.25em;
  }

  /* Task lists */
  .task-list-item {
    list-style-type: none;
    margin-left: -1.5em;
  }

  .task-list-item input[type="checkbox"] {
    margin-right: 0.5em;
  }

  /* Code blocks */
  pre {
    background: #f4f4f4;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1em;
    overflow-x: auto;
    margin: 1em 0;
  }

  code {
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.9em;
  }

  /* Inline code */
  p code, li code {
    background: #f4f4f4;
    padding: 0.2em 0.4em;
    border-radius: 3px;
  }

  /* Links */
  a {
    color: #3498db;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  /* Tables */
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
  }

  th, td {
    border: 1px solid #ddd;
    padding: 8px 12px;
    text-align: left;
  }

  th {
    background: #f4f4f4;
    font-weight: 600;
  }

  tr:nth-child(even) {
    background: #f9f9f9;
  }

  /* Blockquotes */
  blockquote {
    border-left: 4px solid #3498db;
    margin: 1em 0;
    padding-left: 1em;
    color: #666;
    font-style: italic;
  }

  /* Horizontal rules */
  hr {
    border: none;
    border-top: 2px solid #ddd;
    margin: 2em 0;
  }

  /* Images */
  img {
    max-width: 100%;
    height: auto;
  }
  `;

  // Add page breaks for major sections if enabled
  if (pageBreakSections) {
    css += `
  /* Page breaks on H1 and H2 headings */
  h1, h2 {
    break-before: page;
    page-break-before: always;
  }

  h1:first-of-type, h2:first-of-type {
    break-before: auto;
    page-break-before: auto;
  }
    `;
  }

  return css;
}

// Generate header template
function generateHeaderTemplate(logoPath, customerName) {
  let headerHTML = '<style>';
  headerHTML += '.pdf-header { width: 100%; padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; font-size: 10px; }';
  headerHTML += '.pdf-header-logo { max-height: 50px; max-width: 200px; }';
  headerHTML += '.pdf-header-customer { font-style: italic; font-weight: normal; }';
  headerHTML += '</style>';
  headerHTML += '<div class="pdf-header">';

  // Left side - Company logo
  if (logoPath) {
    const logoBase64 = fs.readFileSync(logoPath).toString('base64');
    const logoExt = path.extname(logoPath).substring(1);
    headerHTML += `<img src="data:image/${logoExt};base64,${logoBase64}" class="pdf-header-logo" />`;
  } else {
    headerHTML += '<div></div>';
  }

  // Right side - Customer name
  if (customerName) {
    headerHTML += `<div class="pdf-header-customer">${customerName}</div>`;
  } else {
    headerHTML += '<div></div>';
  }

  headerHTML += '</div>';
  return headerHTML;
}

// Generate footer template
function generateFooterTemplate(customerName) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
    <style>
      .pdf-footer {
        width: 100%;
        padding: 10px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 10px;
        color: #666;
      }
      .pdf-footer a {
        color: #3498db;
        text-decoration: none;
      }
    </style>
    <div class="pdf-footer">
      <span>${today}</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      <span><a href="https://eckman-tech.com">Eckman Tech LLC</a></span>
    </div>
  `;
}

// Upload and convert endpoint
app.post('/convert', upload.fields([
  { name: 'markdown', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
  { name: 'customerLogo', maxCount: 1 }
]), async (req, res) => {
  if (!req.files || !req.files.markdown) {
    return res.status(400).json({ error: 'No markdown file uploaded' });
  }

  const markdownFile = req.files.markdown[0];
  const logoFile = req.files.logo ? req.files.logo[0] : null;
  const customerLogoFile = req.files.customerLogo ? req.files.customerLogo[0] : null;
  const customerName = req.body.customerName || '';
  const docTitle = req.body.docTitle || '';
  const pageBreakSections = req.body.pageBreakSections === 'true';
  const generateTOCOption = req.body.generateTOC === 'true';
  const showHeaderFooter = req.body.showHeaderFooter === 'true';
  const generateTitlePageOption = req.body.generateTitlePage === 'true';

  const inputPath = markdownFile.path;
  const outputPath = path.join('uploads', `${markdownFile.filename}.pdf`);

  try {
    // Read markdown content
    let markdownContent = fs.readFileSync(inputPath, 'utf8');

    // Generate title page if enabled
    if (generateTitlePageOption && docTitle) {
      const titlePage = generateTitlePage(docTitle, customerLogoFile ? customerLogoFile.path : null);
      markdownContent = titlePage + markdownContent;
    }

    // Generate TOC if enabled
    if (generateTOCOption) {
      const toc = generateTOC(markdownContent);
      markdownContent = toc + markdownContent;
    }

    // Write modified content back
    fs.writeFileSync(inputPath, markdownContent);

    // Prepare config
    const config = {
      dest: outputPath,
      launch_options: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      },
      css: getCustomCSS(pageBreakSections),
      marked_options: {
        gfm: true,  // GitHub Flavored Markdown (supports task lists)
        breaks: true,
        headerIds: true
      },
      pdf_options: {
        format: 'Letter',
        margin: {
          top: (showHeaderFooter || logoFile) ? '80px' : '40px',
          right: '40px',
          bottom: showHeaderFooter ? '60px' : '40px',
          left: '40px'
        },
        printBackground: true
      }
    };

    // Add header/footer if enabled
    if (showHeaderFooter || logoFile) {
      config.pdf_options.displayHeaderFooter = true;
      config.pdf_options.headerTemplate = generateHeaderTemplate(
        logoFile ? logoFile.path : null,
        customerName
      );
      config.pdf_options.footerTemplate = showHeaderFooter ?
        generateFooterTemplate(customerName) :
        '<div></div>';
    }

    // Convert markdown to PDF
    const pdf = await mdToPdf({ path: inputPath }, config);

    // Send PDF file
    const pdfBuffer = fs.readFileSync(pdf.filename);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
    res.send(pdfBuffer);

    // Cleanup temporary files
    setTimeout(() => {
      fs.unlink(inputPath, () => {});
      fs.unlink(pdf.filename, () => {});
      if (logoFile) {
        fs.unlink(logoFile.path, () => {});
      }
      if (customerLogoFile) {
        fs.unlink(customerLogoFile.path, () => {});
      }
    }, 1000);

  } catch (error) {
    console.error('Conversion error:', error);

    // Cleanup on error
    fs.unlink(inputPath, () => {});
    if (fs.existsSync(outputPath)) {
      fs.unlink(outputPath, () => {});
    }
    if (logoFile) {
      fs.unlink(logoFile.path, () => {});
    }
    if (customerLogoFile) {
      fs.unlink(customerLogoFile.path, () => {});
    }

    res.status(500).json({ error: 'Conversion failed', message: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`MD to PDF converter running on http://0.0.0.0:${PORT}`);
  console.log(`Access from your network at http://192.168.50.13:${PORT}`);
});
