import os
import logging
import uuid
import subprocess
import shutil
from datetime import datetime
from pathlib import Path
from urllib.parse import quote as urlquote
from io import BytesIO

from flask import Flask, render_template, request, send_file, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from werkzeug.middleware.proxy_fix import ProxyFix
try:
    # When Toolchain is a package
    from .config import get_config
except Exception:
    # When running as plain scripts from Toolchain/
    from config import get_config

# Configure logging
logging.basicConfig(level=logging.DEBUG)

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

app = Flask(
    __name__,
    template_folder=str(BASE_DIR / "Templates"),
    static_folder=str(BASE_DIR / "static"),
)
app.config.from_object(get_config())
app.secret_key = app.config["SECRET_KEY"]
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# DB
db = SQLAlchemy(app)

# Configuration / constants
UPLOAD_FOLDER = app.config['UPLOAD_FOLDER']
ALLOWED_MARKDOWN_EXTENSIONS = {'md'}
ALLOWED_LOGO_EXTENSIONS = {'png', 'svg', 'pdf', 'jpg', 'jpeg'}


def get_app_version() -> str:
    """Read app version from VERSION file at repo root.
    Fallback to '0.0.0' if not available.
    """
    try:
        version_path = ROOT_DIR / 'VERSION'
        if version_path.exists():
            return version_path.read_text(encoding='utf-8').strip() or '0.0.0'
    except Exception as e:
        logging.warning(f"Could not read VERSION file: {e}")
    return '0.0.0'


@app.context_processor
def inject_app_version():
    return {"app_version": get_app_version()}


class Job(db.Model):
    __tablename__ = 'jobs'
    id = db.Column(db.String(36), primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    template_type = db.Column(db.String(32), nullable=False)
    toc_enabled = db.Column(db.Boolean, default=True)
    toc_depth = db.Column(db.Integer, default=3)
    status = db.Column(db.String(32), default='processing')
    error_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    finished_at = db.Column(db.DateTime, nullable=True)


with app.app_context():
    try:
        db.create_all()
    except Exception as e:
        logging.error(f"DB initialization error: {e}")

def allowed_file(filename, allowed_extensions):
    """Check if file has allowed extension"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

def create_temp_directory():
    """Create a unique temporary directory for this request"""
    temp_id = str(uuid.uuid4())
    temp_dir = os.path.join(UPLOAD_FOLDER, f'md_to_pdf_{temp_id}')
    os.makedirs(temp_dir, exist_ok=True)
    return temp_dir

def cleanup_temp_directory(temp_dir):
    """Remove temporary directory and all its contents"""
    try:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
            logging.info(f"Cleaned up temporary directory: {temp_dir}")
    except Exception as e:
        logging.error(f"Error cleaning up temporary directory {temp_dir}: {e}")

@app.route('/')
def index():
    """Main page with upload form"""
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate_pdf():
    """Handle PDF generation request"""
    temp_dir = None

    try:
        # Check if markdown file is present
        if 'markdownFile' not in request.files:
            return jsonify({'error': 'No markdown file provided'}), 400

        markdown_file = request.files['markdownFile']
        logo_file = request.files.get('logoFile')
        template_type = request.form.get('templateType', 'classic')  # Default to classic
        toc_enabled_raw = request.form.get('tocEnabled', 'true')
        toc_depth_raw = request.form.get('tocDepth', '3')

        # Validate template type
        if template_type not in ['classic', 'consulting', 'eisvogel']:
            template_type = 'classic'  # Default fallback

        # Normalize TOC prefs
        toc_enabled = str(toc_enabled_raw).lower() in {'1', 'true', 'on', 'yes'}
        try:
            toc_depth = int(toc_depth_raw)
        except (TypeError, ValueError):
            toc_depth = 3
        if toc_depth < 1 or toc_depth > 6:
            toc_depth = 3

        # Validate markdown file
        if markdown_file.filename == '':
            return jsonify({'error': 'No markdown file selected'}), 400

        if not allowed_file(markdown_file.filename, ALLOWED_MARKDOWN_EXTENSIONS):
            return jsonify({'error': 'Invalid markdown file format. Only .md files are allowed.'}), 400

        # Validate logo file if provided
        if logo_file and logo_file.filename != '':
            if not allowed_file(logo_file.filename, ALLOWED_LOGO_EXTENSIONS):
                return jsonify({'error': 'Invalid logo file format. Allowed formats: PNG, SVG, PDF, JPG, JPEG'}), 400

        # Create temporary directory
        temp_dir = create_temp_directory()
        logging.info(f"Created temporary directory: {temp_dir}")

        # Save markdown file
        markdown_filename = secure_filename(markdown_file.filename)
        markdown_path = os.path.join(temp_dir, markdown_filename)
        markdown_file.save(markdown_path)
        logging.info(f"Saved markdown file: {markdown_path}")

        # Prepare command arguments (resolve publish.sh relative to this file)
        script_path = str(BASE_DIR / 'publish.sh')
        cmd_args = ['/bin/bash', script_path, markdown_path]

        # Save logo file if provided and add to command
        logo_path = None
        if logo_file and logo_file.filename != '':
            logo_filename = secure_filename(logo_file.filename)
            logo_path = os.path.join(temp_dir, logo_filename)
            logo_file.save(logo_path)
            logging.info(f"Saved logo file: {logo_path}")
        else:
            # Use default logo if none is provided
            default_logo_path = BASE_DIR / "static" / "assets" / "logo_default.pdf"
            if default_logo_path.exists():
                logo_path = str(default_logo_path)
                logging.info(f"Using default logo: {logo_path}")

        if logo_path:
            cmd_args.extend(['--logo', logo_path])

        # Add template type to command
        cmd_args.extend(['--template', template_type])
        logging.info(f"Using template type: {template_type}")

        # Add TOC flags
        if toc_enabled:
            cmd_args.append('--toc')
            cmd_args.extend(['--toc-depth', str(toc_depth)])
        else:
            cmd_args.append('--no-toc')

        # Execute publish.sh script
        logging.info(f"Executing command: {' '.join(cmd_args)}")
        # Persist job
        job_id = str(uuid.uuid4())
        job = Job(
            id=job_id,
            filename=markdown_filename,
            template_type=template_type,
            toc_enabled=toc_enabled,
            toc_depth=toc_depth,
            status='processing',
        )
        try:
            db.session.add(job)
            db.session.commit()
        except Exception:
            db.session.rollback()
            logging.warning("Failed to persist job metadata; continuing")

        process = subprocess.Popen(
            cmd_args,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=temp_dir,
            text=True
        )

        try:
            stdout, stderr = process.communicate(timeout=300)  # 5 minute timeout
        except subprocess.TimeoutExpired:
            process.kill()
            stdout, stderr = process.communicate()
            if job:
                try:
                    job.status = 'timeout'
                    job.error_message = 'Conversion timed out'
                    job.finished_at = datetime.utcnow()
                    db.session.commit()
                except Exception:
                    db.session.rollback()
            return jsonify({'error': 'PDF generation timed out', 'details': 'The conversion process took too long and was terminated. Please try with a smaller document.'}), 500

        if process.returncode != 0:
            logging.error(f"Script execution failed with return code {process.returncode}")
            logging.error(f"STDERR: {stderr}")
            if job:
                try:
                    job.status = 'error'
                    job.error_message = (stderr or '').strip() or 'Unknown error'
                    job.finished_at = datetime.utcnow()
                    db.session.commit()
                except Exception:
                    db.session.rollback()
            return jsonify({'error': 'PDF generation failed', 'details': stderr.strip() if stderr else 'Unknown error occurred'}), 500

        # Find generated PDF file
        pdf_filename = markdown_filename.rsplit('.', 1)[0] + '.pdf'
        pdf_path = os.path.join(temp_dir, pdf_filename)

        if not os.path.exists(pdf_path):
            logging.error(f"Generated PDF not found at: {pdf_path}")
            return jsonify({
                'error': 'PDF generation completed but output file not found',
                'details': f'Expected file: {pdf_filename}'
            }), 500

        logging.info(f"PDF generated successfully: {pdf_path}")

        # Read PDF in memory to avoid race with cleanup
        with open(pdf_path, 'rb') as f:
            pdf_bytes = f.read()

        if job:
            try:
                job.status = 'success'
                job.finished_at = datetime.utcnow()
                db.session.commit()
            except Exception:
                db.session.rollback()

        # Send PDF file as attachment from memory
        resp = send_file(BytesIO(pdf_bytes), as_attachment=True, download_name=pdf_filename, mimetype='application/pdf')
        # RFC 5987 compliant headers for UTF-8 and special characters
        resp.headers['Content-Disposition'] = f'attachment; filename="{pdf_filename}"; filename*=UTF-8\'\'{urlquote(pdf_filename)}'
        return resp
    except Exception as e:
        logging.error(f"Unexpected error during PDF generation: {e}")
        return jsonify({
            'error': 'Internal server error',
            'details': str(e)
        }), 500

    finally:
        # Clean up temporary directory
        if temp_dir:
            cleanup_temp_directory(temp_dir)

@app.errorhandler(413)
def file_too_large(e):
    """Handle file size limit exceeded"""
    return jsonify({'error': 'File too large. Maximum size is 16MB.'}), 413

@app.errorhandler(500)
def internal_error(e):
    """Handle internal server errors"""
    return jsonify({'error': 'Internal server error occurred'}), 500


@app.route('/preview', methods=['POST'])
def preview_html():
    """Render a quick HTML preview of the uploaded Markdown (first page simulated client-side)."""
    temp_dir = None
    try:
        if 'markdownFile' not in request.files:
            return jsonify({'error': 'No markdown file provided'}), 400

        markdown_file = request.files['markdownFile']
        if markdown_file.filename == '':
            return jsonify({'error': 'No markdown file selected'}), 400
        if not allowed_file(markdown_file.filename, ALLOWED_MARKDOWN_EXTENSIONS):
            return jsonify({'error': 'Invalid markdown file format. Only .md files are allowed.'}), 400

        # TOC options (optional)
        toc_enabled_raw = request.form.get('tocEnabled', 'true')
        toc_depth_raw = request.form.get('tocDepth', '3')
        toc_enabled = str(toc_enabled_raw).lower() in {'1', 'true', 'on', 'yes'}
        try:
            toc_depth = int(toc_depth_raw)
        except (TypeError, ValueError):
            toc_depth = 3
        if toc_depth < 1 or toc_depth > 6:
            toc_depth = 3

        temp_dir = create_temp_directory()
        md_path = os.path.join(temp_dir, secure_filename(markdown_file.filename))
        markdown_file.save(md_path)

        # Build pandoc args to HTML5
        pandoc_cmd = ['pandoc', md_path, '-f', 'markdown', '-t', 'html5']
        if toc_enabled:
            pandoc_cmd.extend(['--toc', '--toc-depth', str(toc_depth)])

        process = subprocess.Popen(
            pandoc_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=temp_dir,
            text=True
        )
        try:
            stdout, stderr = process.communicate(timeout=60)
        except subprocess.TimeoutExpired:
            process.kill()
            stdout, stderr = process.communicate()
            return jsonify({'error': 'Preview timed out'}), 500

        if process.returncode != 0:
            logging.error(f"Pandoc preview failed: {stderr}")
            return jsonify({'error': 'Preview generation failed', 'details': stderr.strip()}), 500

        # Return raw HTML to be injected into preview container
        return jsonify({'html': stdout})
    except Exception as e:
        logging.error(f"Unexpected error during preview: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500
    finally:
        if temp_dir:
            cleanup_temp_directory(temp_dir)
@app.route('/preview-pdf', methods=['POST'])
def preview_pdf():
    """Render PDF preview and return inline PDF without attachment."""
    temp_dir = None
    try:
        if 'markdownFile' not in request.files:
            return jsonify({'error': 'No markdown file provided'}), 400

        markdown_file = request.files['markdownFile']
        logo_file = request.files.get('logoFile')
        template_type = request.form.get('templateType', 'classic')
        toc_enabled_raw = request.form.get('tocEnabled', 'true')
        toc_depth_raw = request.form.get('tocDepth', '3')

        if template_type not in ['classic', 'consulting', 'eisvogel']:
            template_type = 'classic'

        toc_enabled = str(toc_enabled_raw).lower() in {'1', 'true', 'on', 'yes'}
        try:
            toc_depth = int(toc_depth_raw)
        except (TypeError, ValueError):
            toc_depth = 3
        if toc_depth < 1 or toc_depth > 6:
            toc_depth = 3

        if markdown_file.filename == '':
            return jsonify({'error': 'No markdown file selected'}), 400
        if not allowed_file(markdown_file.filename, ALLOWED_MARKDOWN_EXTENSIONS):
            return jsonify({'error': 'Invalid markdown file format. Only .md files are allowed.'}), 400
        if logo_file and logo_file.filename != '' and not allowed_file(logo_file.filename, ALLOWED_LOGO_EXTENSIONS):
            return jsonify({'error': 'Invalid logo file format. Allowed formats: PNG, SVG, PDF, JPG, JPEG'}), 400

        temp_dir = create_temp_directory()
        markdown_filename = secure_filename(markdown_file.filename)
        markdown_path = os.path.join(temp_dir, markdown_filename)
        markdown_file.save(markdown_path)

        script_path = str(BASE_DIR / 'publish.sh')
        cmd_args = ['/bin/bash', script_path, markdown_path, '--template', template_type]

        logo_path = None
        if logo_file and logo_file.filename != '':
            logo_filename = secure_filename(logo_file.filename)
            logo_path = os.path.join(temp_dir, logo_filename)
            logo_file.save(logo_path)
            logging.info(f"Saved logo file for preview: {logo_path}")
        else:
            # Use default logo if none is provided
            default_logo_path = BASE_DIR / "static" / "assets" / "logo_default.pdf"
            if default_logo_path.exists():
                logo_path = str(default_logo_path)
                logging.info(f"Using default logo for preview: {logo_path}")

        if logo_path:
            cmd_args.extend(['--logo', logo_path])

        if toc_enabled:
            cmd_args.extend(['--toc', '--toc-depth', str(toc_depth)])
        else:
            cmd_args.append('--no-toc')

        process = subprocess.Popen(cmd_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=temp_dir, text=True)
        stdout, stderr = process.communicate(timeout=300)
        if process.returncode != 0:
            logging.error(f"Preview script failed: {stderr}")
            return jsonify({'error': 'Preview generation failed', 'details': stderr.strip() if stderr else 'Unknown error'}), 500

        pdf_filename = markdown_filename.rsplit('.', 1)[0] + '.pdf'
        pdf_path = os.path.join(temp_dir, pdf_filename)
        if not os.path.exists(pdf_path):
            return jsonify({'error': 'Preview PDF not found'}), 500
        with open(pdf_path, 'rb') as f:
            pdf_bytes = f.read()
        # Inline response (no attachment)
        resp = send_file(BytesIO(pdf_bytes), mimetype='application/pdf', download_name=pdf_filename, as_attachment=False)
        # RFC 5987 compliant headers for UTF-8 and special characters
        resp.headers['Content-Disposition'] = f'inline; filename="{pdf_filename}"; filename*=UTF-8\'\'{urlquote(pdf_filename)}'
        return resp
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Preview generation timed out'}), 500
    except Exception as e:
        logging.exception("Unexpected error in preview")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500
    finally:
        if temp_dir:
            cleanup_temp_directory(temp_dir)

@app.route('/generate-by-path', methods=['POST'])
def generate_by_path():
    """
    Generate PDF from an absolute path on the server.
    This is intended for local/controlled environments.
    Accepts JSON: {source_path, templateType?, tocEnabled?, tocDepth?, logoPath?}
    """
    if not request.is_json:
        return jsonify({'error': 'Invalid request: Content-Type must be application/json'}), 415

    data = request.get_json()
    source_path_str = data.get('source_path')

    if not source_path_str:
        return jsonify({'error': '`source_path` is required'}), 400

    # --- Security and Path Validation ---
    if not os.path.isabs(source_path_str):
        return jsonify({'error': '`source_path` must be an absolute path'}), 400

    source_path = Path(source_path_str).resolve()
    if not source_path.is_file():
        return jsonify({'error': f'Source file not found: {source_path}'}), 404

    if source_path.suffix.lower() != '.md':
        return jsonify({'error': 'Source file must be a .md file'}), 400

    source_dir = source_path.parent
    if not os.access(source_dir, os.R_OK) or not os.access(source_dir, os.W_OK):
        return jsonify({'error': f'Permission denied: cannot read/write to {source_dir}'}), 403

    # --- Get Parameters ---
    template_type = data.get('templateType', 'classic')
    toc_enabled = data.get('tocEnabled', True)
    toc_depth = data.get('tocDepth', 3)
    logo_path_str = data.get('logoPath')

    # --- Prepare publish.sh arguments ---
    script_path = str(BASE_DIR / 'publish.sh')
    cmd_args = ['/bin/bash', script_path, str(source_path)]
    cmd_args.extend(['--template', template_type])

    if toc_enabled:
        cmd_args.extend(['--toc', '--toc-depth', str(toc_depth)])
    else:
        cmd_args.append('--no-toc')

    if logo_path_str:
        if not os.path.isabs(logo_path_str):
            return jsonify({'error': '`logoPath` must be an absolute path'}), 400
        logo_path = Path(logo_path_str).resolve()
        if not logo_path.is_file():
            return jsonify({'error': f'Logo file not found: {logo_path}'}), 404
        cmd_args.extend(['--logo', str(logo_path)])

    # --- Execute ---
    try:
        # The script writes the PDF next to the source, so we run it from a temp dir
        # to avoid polluting the source directory with intermediate files.
        with subprocess.Popen(cmd_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True) as process:
            stdout, stderr = process.communicate(timeout=300)
            if process.returncode != 0:
                logging.error(f"Path-based generation failed: {stderr}")
                return jsonify({'error': 'PDF generation failed', 'details': stderr.strip()}), 500

        pdf_path = source_path.with_suffix('.pdf')
        return jsonify({'message': 'PDF generated successfully', 'pdf_path': str(pdf_path)})

    except subprocess.TimeoutExpired:
        return jsonify({'error': 'PDF generation timed out'}), 500
    except Exception as e:
        logging.exception("Unexpected error in generate_by_path")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500
