# Gemini Project Overview: MarkPdfPublisher

## Description

MarkPdfPublisher (internally known as MarkLeaf) is a web-based tool that converts Markdown files into professional-looking PDFs. It uses a powerful combination of Pandoc and XeLaTeX to produce high-quality documents with customizable templates.

## Key Features

- **Dual Generation Modes**:
    - **Upload Mode**: A user-friendly web interface for uploading Markdown files and receiving a generated PDF.
    - **Local Path Mode**: An API-driven mode for trusted environments to generate PDFs directly from a file path on the server.
- **Premium Templates**: Comes with multiple templates, including `classic`, `consulting`, and the typographically-focused `Eisvogel`.
- **Customization**: Allows for the inclusion of a custom logo, and control over the table of contents generation and depth.
- **Live Preview**: Provides a quick HTML-based preview of the document before committing to a full PDF generation.
- **REST API**: Exposes its functionality through a simple API for easier integration into other workflows.

## Technologies Used

- **Backend**: Python with Flask
- **Frontend**: HTML, Bootstrap, and custom JavaScript
- **PDF Generation**: Pandoc and XeLaTeX
- **Database**: SQLite for job logging in development.

## Project Structure

- `Toolchain/app.py`: The core Flask application containing the web server, API endpoints, and business logic.
- `Toolchain/publish.sh`: The shell script responsible for orchestrating the PDF generation process with Pandoc.
- `Toolchain/Templates/`: Contains the LaTeX templates that define the look and feel of the generated PDFs.
- `Toolchain/static/`: All frontend assets, including JavaScript (`app.js`), CSS, and images.
- `README.md`: The main source of information for getting started with the project.
- `docs/`: Additional in-depth documentation covering architecture, security, and other topics.

## How to Run the Application

1.  **Prerequisites**: Ensure you have Python 3.11+, Pandoc, and a XeLaTeX distribution (like TeX Live or MacTeX) installed.
2.  **Start the Server**: From the project root, run the command:
    ```bash
    python Toolchain/main.py
    ```
3.  **Access the UI**: Open your web browser and navigate to `http://localhost:5000`.

## Key Functionalities

### Generate PDF via Web UI

1.  Open the web interface in your browser.
2.  In the "Upload Mode" section, upload your `.md` file.
3.  Optionally, upload a logo image (PNG, SVG, PDF, or JPG).
4.  Choose a template and configure the Table of Contents settings.
5.  Click the **Generate PDF** button to start the process and download the file.

### Generate PDF via API (Local Path Mode)

Send a `POST` request to the `/generate-by-path` endpoint with a JSON payload. This is intended for server-side integrations in trusted environments.

**Example Payload:**
```json
{
  "source_path": "/path/to/your/document.md",
  "logoPath": "/path/to/your/logo.png",
  "templateType": "consulting"
}
```
