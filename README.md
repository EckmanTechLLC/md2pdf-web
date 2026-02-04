# MD2PDF Web Interface

A web-based markdown-to-PDF converter with custom branding and document generation features.

## Overview

This project provides a user-friendly web interface for converting Markdown documents to professionally formatted PDFs with support for:

- Custom company and customer branding
- Title page generation
- Table of contents
- Headers and footers with logos
- Live preview
- Syntax highlighting
- Auto-save functionality

## Features

- **Live Preview**: See your PDF as you type with instant updates
- **Custom Branding**:
  - Company logo in header
  - Customer logo on title page
  - Customer name in header
- **Document Options**:
  - Optional title page generation
  - Automatic table of contents
  - Page breaks on H1 sections
  - Custom headers and footers
- **Browser-based**: No installation required for end users
- **Auto-save**: Your work is automatically saved to browser localStorage

## Installation

```bash
# Install dependencies
npm install

# Start the server (development)
node server.js

# Or install as a systemd service (production)
sudo cp md2pdf.service /etc/systemd/system/
sudo systemctl enable md2pdf
sudo systemctl start md2pdf
```

The web interface will be available at `http://localhost:3000`

## Usage

1. Open the web interface in your browser
2. Enter or paste your Markdown content
3. Optionally upload company and customer logos
4. Enter customer name and document title
5. Configure document options (TOC, title page, headers/footers)
6. Click "Generate PDF" to preview
7. Click "Download PDF" to save

Your settings and content are automatically saved and will be restored when you reload the page.

## API

You can also use the conversion API directly:

```bash
POST /convert
Content-Type: multipart/form-data

Parameters:
- markdown: Markdown file
- logo: Company logo image (optional)
- customerLogo: Customer logo image (optional)
- customerName: Customer name for header (optional)
- docTitle: Document title for title page (optional)
- pageBreakSections: true/false
- generateTOC: true/false
- showHeaderFooter: true/false
- generateTitlePage: true/false
```

## Credits

Based on [md-to-pdf](https://github.com/simonhaenisch/md-to-pdf) by Simon Hänisch.

### Changes from Original

- Added Express-based web server with REST API
- Created web UI with live PDF preview
- Added dual logo support (company + customer)
- Implemented custom header/footer templates
- Added title page generation with customer branding
- Added table of contents generation
- Implemented browser localStorage for auto-save
- Added real-time word count and status updates

## License

MIT License - see [license](./license) file for details.

Original work Copyright (c) Simon Hänisch
Modified work Copyright (c) 2024-2026 Eckman Tech LLC

## Author

**Matt Eckman**
Eckman Tech LLC
matt@eckman-tech.com
https://eckman-tech.com

## Support

For issues, questions, or contributions, please contact matt@eckman-tech.com
