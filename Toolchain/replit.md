# Overview

MD-to-PDF Publisher is a web application that provides a graphical interface for converting Markdown documents to professional PDFs using Pandoc and XeLaTeX. The application wraps an existing shell-based toolchain (`publish.sh`) with a modern web interface, allowing users to upload Markdown files and optional logos to generate branded PDF documents with covers, headers, footers, and table of contents.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built as a single-page application using vanilla JavaScript, HTML, and CSS with Bootstrap 5 for styling. The interface features:

- **File Upload Interface**: Drag-and-drop areas for Markdown files and logo uploads
- **Real-time Validation**: Client-side file type and size validation
- **Progress Feedback**: Visual indicators during PDF generation process
- **Responsive Design**: Bootstrap-based responsive layout with sidebar navigation

## Backend Architecture
The backend uses Flask (Python) with a simple request-response pattern:

- **Flask Web Framework**: Lightweight Python web framework handling HTTP requests
- **File Upload Management**: Werkzeug utilities for secure file handling
- **Temporary File System**: UUID-based temporary directories for isolation
- **Shell Script Integration**: Subprocess execution of existing `publish.sh` toolchain
- **Error Handling**: Comprehensive logging and error management

## PDF Generation Pipeline
The core conversion logic leverages existing shell-based toolchain:

- **Pandoc Integration**: Markdown to LaTeX conversion using Pandoc
- **XeLaTeX Processing**: LaTeX to PDF compilation with XeLaTeX engine
- **Template System**: Modular LaTeX templates for covers, headers/footers
- **Asset Management**: Logo integration and font handling

## Security Considerations
- **File Type Validation**: Whitelist-based file extension checking
- **Secure Filenames**: Werkzeug secure_filename for sanitization
- **Temporary Isolation**: UUID-based temporary directories per request
- **Size Limits**: 16MB maximum file upload size
- **Cleanup Process**: Automatic temporary file cleanup after processing

# External Dependencies

## System Dependencies
- **Pandoc**: Document conversion engine (Markdown to LaTeX)
- **XeLaTeX**: LaTeX to PDF compilation engine
- **TeX Distribution**: MacTeX or TeXLive for complete LaTeX functionality
- **System Fonts**: TeX Gyre Termes, TeX Gyre Heros, Inconsolata

## Python Dependencies
- **Flask**: Web framework for HTTP server
- **Werkzeug**: WSGI utilities and secure file handling
- **Standard Library**: os, logging, uuid, subprocess, shutil, pathlib

## Frontend Dependencies
- **Bootstrap 5**: CSS framework for responsive design
- **Font Awesome**: Icon library for UI elements
- **Vanilla JavaScript**: No additional frontend frameworks required

## Template Assets
- **LaTeX Templates**: default.tex, cover.tex, header_footer.tex
- **Brand Assets**: Company logos and styling elements
- **Font Files**: Custom typography for professional document appearance