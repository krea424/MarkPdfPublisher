/**
 * MD-to-PDF Publisher JavaScript
 * Handles file uploads, form submission, and user interactions
 */

class PDFGenerator {
    constructor() {
        this.form = document.getElementById('uploadForm');
        this.markdownInput = document.getElementById('markdownFile');
        this.logoInput = document.getElementById('logoFile');
        this.generateBtn = document.getElementById('generateBtn');
        this.errorAlert = document.getElementById('errorAlert');
        this.successAlert = document.getElementById('successAlert');
        this.tocEnabledEl = document.getElementById('tocEnabled');
        this.tocDepthEl = document.getElementById('tocDepth');
        this.progressBar = document.getElementById('topProgress');
        this.toastContainer = document.getElementById('toastContainer');
        this.themeToggle = document.getElementById('themeToggle');
        this.paletteSelect = document.getElementById('paletteSelect');
        this.previewBtn = document.getElementById('previewBtn');
        this.previewPage = document.getElementById('previewPage');
        this.previewFrame = document.getElementById('previewFrame');
        this.bookToggle = document.getElementById('bookEffectToggle');
        this.advancedToggle = document.getElementById('advancedToggle');
        this.spreadToggle = document.getElementById('spreadToggle');
        this.zoomSelect = document.getElementById('zoomSelect');
        this.soundToggle = document.getElementById('soundToggle');
        // Toolbar buttons
        this.modeSimpleBtn = document.getElementById('modeSimpleBtn');
        this.modeAdvancedBtn = document.getElementById('modeAdvancedBtn');
        this.bookEffectBtn = document.getElementById('bookEffectBtn');
        this.spreadBtn = document.getElementById('spreadBtn');
        this.zoomOutBtn = document.getElementById('zoomOutBtn');
        this.zoomInBtn = document.getElementById('zoomInBtn');
        this.zoomLevelLabel = document.getElementById('zoomLevelLabel');
        this.soundBtn = document.getElementById('soundBtn');
        this.thumbsBtn = document.getElementById('thumbsBtn');
        this.prevPageBtn = document.getElementById('prevPageBtn');
        this.nextPageBtn = document.getElementById('nextPageBtn');
        this.flipPageIndicator = document.getElementById('flipPageIndicator');
        this.previewModal = document.getElementById('previewModal');
        this.thumbsBar = document.getElementById('thumbsBar');
        this.navHotspotLeft = document.getElementById('navHotspotLeft');
        this.navHotspotRight = document.getElementById('navHotspotRight');
        this.resetUiBtn = document.getElementById('resetUiBtn');
        
        this.flip = null; // flipbook state
        this.audioCtx = null;

        this.init();
    }

    // ===== Template Settings helpers =====
    initTemplateSettings() {
        this.updateTemplateSettingsVisibility();
        this.updateActiveTemplateBadge();
        const tpl = document.getElementById('templateType');
        if (tpl) tpl.addEventListener('change', () => { this.updateTemplateSettingsVisibility(); this.updateActiveTemplateBadge(); this.savePreferences(); });
        const dbtn = document.getElementById('eisvogelDefaultsBtn');
        if (dbtn) dbtn.addEventListener('click', () => this.restoreEisvogelDefaults());
    }

    updateActiveTemplateBadge() {
        const badge = document.getElementById('activeTemplateBadge');
        const el = document.getElementById('templateType');
        if (!badge || !el) return;
        const map = { consulting: 'Consulting', classic: 'Classic', eisvogel: 'Eisvogel' };
        badge.textContent = map[el.value] || '—';
    }

    updateTemplateSettingsVisibility() {
        const el = document.getElementById('templateType');
        const eis = document.getElementById('eisvogelSettings');
        const def = document.getElementById('defaultTemplateSettings');
        if (!el || !eis || !def) return;
        const isEis = el.value === 'eisvogel';
        eis.classList.toggle('d-none', !isEis);
        def.classList.toggle('d-none', isEis);
    }

    setupInstructionsToggle() {
        const collapseEl = document.getElementById('instructionsCollapse');
        const toggleBtn = document.getElementById('toggleInstructionsBtn');
        if (!collapseEl || !toggleBtn || !window.bootstrap) return;
        const saved = localStorage.getItem('mdpdf_instr');
        const wantCollapsed = saved === 'collapsed';
        if (wantCollapsed) {
            collapseEl.classList.remove('show');
            toggleBtn.setAttribute('aria-expanded', 'false');
            toggleBtn.innerHTML = '<i class="fas fa-chevron-down me-1"></i> Mostra';
        } else {
            toggleBtn.setAttribute('aria-expanded', 'true');
            toggleBtn.innerHTML = '<i class="fas fa-chevron-up me-1"></i> Nascondi';
        }
        collapseEl.addEventListener('shown.bs.collapse', () => {
            try { localStorage.setItem('mdpdf_instr', 'expanded'); } catch {}
            toggleBtn.innerHTML = '<i class="fas fa-chevron-up me-1"></i> Nascondi';
            toggleBtn.setAttribute('aria-expanded', 'true');
        });
        collapseEl.addEventListener('hidden.bs.collapse', () => {
            try { localStorage.setItem('mdpdf_instr', 'collapsed'); } catch {}
            toggleBtn.innerHTML = '<i class="fas fa-chevron-down me-1"></i> Mostra';
            toggleBtn.setAttribute('aria-expanded', 'false');
        });
    }

    normalizeLogoWidth(val) {
        if (!val) return '';
        let v = String(val).trim();
        if (/^\d+(\.\d+)?$/.test(v)) return v + 'mm';
        if (/^\d+(\.\d+)?\s*(mm|cm|in|pt)$/i.test(v)) return v.replace(/\s+/g, '');
        return null;
    }

    validateEisvogelSettings() {
        const tpl = document.getElementById('templateType');
        if (!tpl || tpl.value !== 'eisvogel') return true;
        let ok = true;
        const lw = document.getElementById('logoWidth');
        if (lw) {
            lw.classList.remove('is-invalid');
            const normalized = this.normalizeLogoWidth(lw.value);
            if (lw.value && normalized === null) { lw.classList.add('is-invalid'); ok = false; }
            else if (normalized) { lw.value = normalized; }
        }
        return ok;
    }

    restoreEisvogelDefaults() {
        const tp = document.getElementById('titlepageToggle');
        const lw = document.getElementById('logoWidth');
        const c1 = document.getElementById('titlepageColor');
        const c2 = document.getElementById('titlepageTextColor');
        const c3 = document.getElementById('titlepageRuleColor');
        const tc = document.getElementById('tocColor');
        const cl = document.getElementById('colorLinksToggle');
        if (tp) tp.checked = true;
        if (lw) { lw.value = '35mm'; lw.classList.remove('is-invalid'); }
        if (c1) c1.value = '#ffffff'; if (c2) c2.value = '#5f5f5f'; if (c3) c3.value = '#435488'; if (tc) tc.value = '#2e6bd3'; if (cl) cl.checked = true;
        this.savePreferences(); this.showToast('success', 'Eisvogel settings restored.');
    }

    init() {
        this.setupFileInputs();
        this.setupFormSubmission();
        this.setupDragAndDrop();
        this.loadPreferences();
        this.initTheme();
        this.initPalette();
        this.initTemplateSettings();
        this.setupInstructionsToggle();
        this.setupPreview();
        this.setupBookControls();
        this.setupToolbar();
        this.setupReset();
        this.setupRipples();
        this.setupTooltips();
    }

    setupFileInputs() {
        // Markdown file input
        this.markdownInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target, 'markdown');
        });

        // Logo file input
        this.logoInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target, 'logo');
        });

        // Upload area clicks
        document.getElementById('markdownUploadArea').addEventListener('click', () => {
            this.markdownInput.click();
        });

        document.getElementById('logoUploadArea').addEventListener('click', () => {
            this.logoInput.click();
        });

        // Remove file buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-file') || e.target.parentElement.classList.contains('remove-file')) {
                const fileInfo = e.target.closest('.file-info');
                const inputId = fileInfo.id.replace('FileInfo', 'File');
                this.removeFile(inputId);
            }
        });
    }

    setupFormSubmission() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.generatePDF();
        });

        // Keep depth disabled when TOC is off (cosmetic)
        if (this.tocEnabledEl && this.tocDepthEl) {
            const syncDepthState = () => {
                this.tocDepthEl.disabled = !this.tocEnabledEl.checked;
                this.savePreferences();
            };
            this.tocEnabledEl.addEventListener('change', syncDepthState);
            this.tocDepthEl.addEventListener('change', () => this.savePreferences());
            syncDepthState();
        }
        const templateEl = document.getElementById('templateType');
        if (templateEl) templateEl.addEventListener('change', () => this.savePreferences());
    }

    setupPreview() {
        if (!this.previewBtn) return;
        this.previewBtn.addEventListener('click', () => this.generatePreview());
    }

    setupBookControls() {
        // Persist toggle
        if (this.bookToggle) {
            try {
                const saved = localStorage.getItem('mdpdf_book');
                const initVal = saved ? saved === 'true' : true;
                this.bookToggle.checked = initVal;
            } catch {}
            this.bookToggle.addEventListener('change', () => {
                try { localStorage.setItem('mdpdf_book', this.bookToggle.checked ? 'true' : 'false'); } catch {}
                // If toggled while modal open, switch view
                const isOpen = this.previewModal && this.previewModal.classList.contains('show');
                if (isOpen && this.previewFrame && this.previewFrame.src) {
                    // Re-render using the last blob in iframe if available by refetching preview
                    this.generatePreview();
                }
            });
        }
        // Advanced toggle (switch between simple and advanced book mode)
        if (this.advancedToggle) {
            try {
                const saved = localStorage.getItem('mdpdf_advanced');
                this.advancedToggle.checked = saved ? saved === 'true' : false;
            } catch {}
            this.advancedToggle.addEventListener('change', () => {
                try { localStorage.setItem('mdpdf_advanced', this.advancedToggle.checked ? 'true' : 'false'); } catch {}
                this.updateControlsForMode();
                if (this.flip && this.previewModal.classList.contains('show')) {
                    const pdf = this.flip.pdf;
                    const keep = this.flip.current;
                    this.openFlipbook(pdf, keep);
                }
            });
        }
        this.updateControlsForMode();
        // Spread toggle
        if (this.spreadToggle) {
            try {
                const saved = localStorage.getItem('mdpdf_spread');
                this.spreadToggle.checked = saved ? saved === 'true' : false;
            } catch {}
            this.spreadToggle.addEventListener('change', () => {
                try { localStorage.setItem('mdpdf_spread', this.spreadToggle.checked ? 'true' : 'false'); } catch {}
                if (this.flip && this.previewModal.classList.contains('show')) {
                    // Re-open flipbook with spread setting
                    const pdf = this.flip.pdf;
                    const keep = this.flip.current;
                    this.openFlipbook(pdf, keep);
                }
            });
        }
        // Zoom control
        if (this.zoomSelect) {
            try {
                const saved = parseFloat(localStorage.getItem('mdpdf_zoom') || '1');
                if (!isNaN(saved)) this.zoomSelect.value = String(saved);
            } catch {}
            this.zoomSelect.addEventListener('change', () => {
                try { localStorage.setItem('mdpdf_zoom', this.zoomSelect.value); } catch {}
                if (this.flip && this.previewModal.classList.contains('show')) {
                    this.relayoutFlipbook();
                }
            });
        }
        // Handle resize
        window.addEventListener('resize', () => {
            if (this.flip && this.previewModal.classList.contains('show')) {
                clearTimeout(this._resizeT);
                this._resizeT = setTimeout(() => this.relayoutFlipbook(), 150);
            }
        });
        // Sound toggle
        if (this.soundToggle) {
            try { this.soundToggle.checked = (localStorage.getItem('mdpdf_sound') ?? 'true') !== 'false'; } catch {}
            this.soundToggle.addEventListener('change', () => {
                try { localStorage.setItem('mdpdf_sound', this.soundToggle.checked ? 'true' : 'false'); } catch {}
            });
        }
        // Nav buttons
        if (this.prevPageBtn) this.prevPageBtn.addEventListener('click', () => this.flipNavigate(-1));
        if (this.nextPageBtn) this.nextPageBtn.addEventListener('click', () => this.flipNavigate(1));
        if (this.navHotspotLeft) this.navHotspotLeft.addEventListener('click', () => this.flipNavigate(-1));
        if (this.navHotspotRight) this.navHotspotRight.addEventListener('click', () => this.flipNavigate(1));
        // Keyboard navigation while modal open
        document.addEventListener('keydown', (e) => {
            if (!this.previewModal || !this.previewModal.classList.contains('show')) return;
            if (!this.flip) return;
            if (e.key === 'ArrowRight') this.flipNavigate(1);
            if (e.key === 'ArrowLeft') this.flipNavigate(-1);
        });
    }

    setupDragAndDrop() {
        const uploadAreas = document.querySelectorAll('.upload-area');
        
        uploadAreas.forEach(area => {
            area.addEventListener('dragover', (e) => {
                e.preventDefault();
                area.classList.add('dragover');
            });

            area.addEventListener('dragleave', (e) => {
                e.preventDefault();
                area.classList.remove('dragover');
            });

            area.addEventListener('drop', (e) => {
                e.preventDefault();
                area.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    const file = files[0];
                    const inputId = area.id.replace('UploadArea', 'File');
                    const input = document.getElementById(inputId);
                    
                    // Validate file type
                    if (this.validateFile(file, inputId)) {
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        input.files = dataTransfer.files;
                        
                        const fileType = inputId === 'markdownFile' ? 'markdown' : 'logo';
                        this.handleFileSelect(input, fileType);
                    }
                }
            });
        });
    }

    validateFile(file, inputId) {
        const allowedTypes = {
            markdownFile: ['.md'],
            logoFile: ['.png', '.svg', '.pdf', '.jpg', '.jpeg']
        };

        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        const allowed = allowedTypes[inputId] || [];

        if (!allowed.includes(fileExtension)) {
            const fileTypeStr = inputId === 'markdownFile' ? 'Markdown (.md)' : 'image (PNG, SVG, PDF, JPG, JPEG)';
            this.showError(`Please select a valid ${fileTypeStr} file.`);
            return false;
        }

        // Check file size (16MB limit)
        const maxSize = 16 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showError('File size must be less than 16MB.');
            return false;
        }

        return true;
    }

    handleFileSelect(input, fileType) {
        const file = input.files[0];
        if (!file) return;

        if (!this.validateFile(file, input.id)) {
            input.value = '';
            return;
        }

        this.displayFileInfo(file, fileType);
        this.updateGenerateButton();
        this.hideError();
    }

    displayFileInfo(file, fileType) {
        const fileInfo = document.getElementById(`${fileType}FileInfo`);
        const fileName = fileInfo.querySelector('.file-name');
        const fileSize = fileInfo.querySelector('.file-size');
        
        fileName.textContent = file.name;
        if (fileSize) {
            fileSize.textContent = `(${this.humanFileSize(file.size)})`;
        }
        fileInfo.classList.remove('d-none');
    }

    removeFile(inputId) {
        const input = document.getElementById(inputId);
        const fileType = inputId.replace('File', '');
        const fileInfo = document.getElementById(`${fileType}FileInfo`);
        
        input.value = '';
        fileInfo.classList.add('d-none');
        this.updateGenerateButton();
    }

    humanFileSize(bytes) {
        const thresh = 1024;
        if (Math.abs(bytes) < thresh) {
            return bytes + ' B';
        }
        const units = ['KB','MB','GB','TB'];
        let u = -1;
        do {
            bytes /= thresh;
            ++u;
        } while (Math.abs(bytes) >= thresh && u < units.length - 1);
        return bytes.toFixed(bytes < 10 ? 1 : 0) + ' ' + units[u];
    }

    updateGenerateButton() {
        const hasMarkdown = this.markdownInput.files.length > 0;
        this.generateBtn.disabled = !hasMarkdown;
        if (this.previewBtn) this.previewBtn.disabled = !hasMarkdown;
    }

    async generatePDF() {
        try {
            this.setLoading(true);
            this.setProgress(true);
            this.hideError();
            this.hideSuccess();
            // Validate template-specific options (Eisvogel)
            const tplEl = document.getElementById('templateType');
            if (tplEl && tplEl.value === 'eisvogel') {
                if (!this.validateEisvogelSettings || !this.validateEisvogelSettings()) {
                    this.setProgress(false);
                    this.showError('Please correct the highlighted Eisvogel settings.');
                    this.showToast('error', 'Invalid Eisvogel settings.');
                    return;
                }
            }

            const formData = new FormData();
            
            // Add markdown file
            if (this.markdownInput.files[0]) {
                formData.append('markdownFile', this.markdownInput.files[0]);
            }
            
            // Add logo file if selected
            if (this.logoInput.files[0]) {
                formData.append('logoFile', this.logoInput.files[0]);
            }

            // Add template type selection
            const templateEl = document.getElementById('templateType');
            if (templateEl && templateEl.value) {
                formData.append('templateType', templateEl.value);
            }
            if (templateEl && templateEl.value === 'eisvogel') {
                const tp = document.getElementById('titlepageToggle');
                const lw = document.getElementById('logoWidth');
                if (tp && tp.checked) formData.append('titlepage', 'true');
                if (lw && lw.value.trim()) formData.append('logoWidth', lw.value.trim());
                const c1 = document.getElementById('titlepageColor');
                const c2 = document.getElementById('titlepageTextColor');
                const c3 = document.getElementById('titlepageRuleColor');
                const tc = document.getElementById('tocColor');
                const cl = document.getElementById('colorLinksToggle');
                if (c1 && c1.value) formData.append('titlepageColor', c1.value);
                if (c2 && c2.value) formData.append('titlepageTextColor', c2.value);
                if (c3 && c3.value) formData.append('titlepageRuleColor', c3.value);
                if (tc && tc.value) formData.append('tocColor', tc.value);
                if (cl && cl.checked) formData.append('colorLinks', 'true');
            }

            // Add TOC preferences
            if (this.tocEnabledEl) {
                formData.append('tocEnabled', this.tocEnabledEl.checked ? 'true' : 'false');
            }
            if (this.tocDepthEl && this.tocDepthEl.value) {
                formData.append('tocDepth', this.tocDepthEl.value);
            }

            const response = await fetch('/generate', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                // Handle successful PDF generation
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                
                // Create download link
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                
                // Get filename from response headers or use default
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = 'document.pdf';
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                    if (filenameMatch) {
                        filename = filenameMatch[1];
                    }
                }
                
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                
                // Cleanup
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                this.showSuccess('PDF generated successfully and download started!');
                this.showToast('success', 'PDF generated and downloaded.');
                
            } else {
                // Handle error response
                const errorData = await response.json();
                this.showError(errorData.error || 'An error occurred while generating the PDF.');
                
                if (errorData.details) {
                    console.error('PDF Generation Error Details:', errorData.details);
                }
                this.showToast('error', errorData.error || 'Failed to generate PDF.');
            }
            
        } catch (error) {
            console.error('Network or parsing error:', error);
            this.showError('A network error occurred. Please check your connection and try again.');
            this.showToast('error', 'Network error while generating PDF.');
        } finally {
            this.setLoading(false);
            this.setProgress(false);
        }
    }

    async generatePreview() {
        if (!this.markdownInput.files[0]) {
            this.showError('Please select a Markdown file to preview.');
            return;
        }

        try {
            this.setProgress(true);
            this.hideError();
            this.hideSuccess();
            // Toggle loading state on preview button
            const btnText = this.previewBtn.querySelector('.btn-text');
            const btnLoading = this.previewBtn.querySelector('.btn-loading');
            btnText.classList.add('d-none');
            btnLoading.classList.remove('d-none');

            // Validate template-specific options (Eisvogel)
            const tplEl = document.getElementById('templateType');
            if (tplEl && tplEl.value === 'eisvogel') {
                if (!this.validateEisvogelSettings || !this.validateEisvogelSettings()) {
                    this.setProgress(false);
                    btnText.classList.remove('d-none');
                    btnLoading.classList.add('d-none');
                    this.showError('Please correct the highlighted Eisvogel settings.');
                    this.showToast('error', 'Invalid Eisvogel settings.');
                    return;
                }
            }

            const formData = new FormData();
            formData.append('markdownFile', this.markdownInput.files[0]);
            // Include TOC prefs + template (consistency with PDF output)
            if (this.tocEnabledEl) formData.append('tocEnabled', this.tocEnabledEl.checked ? 'true' : 'false');
            if (this.tocDepthEl && this.tocDepthEl.value) formData.append('tocDepth', this.tocDepthEl.value);
            const templateEl = document.getElementById('templateType');
            if (templateEl && templateEl.value) formData.append('templateType', templateEl.value);
            if (templateEl && templateEl.value === 'eisvogel') {
                const tp = document.getElementById('titlepageToggle');
                const lw = document.getElementById('logoWidth');
                if (tp && tp.checked) formData.append('titlepage', 'true');
                if (lw && lw.value.trim()) formData.append('logoWidth', lw.value.trim());
                const c1 = document.getElementById('titlepageColor');
                const c2 = document.getElementById('titlepageTextColor');
                const c3 = document.getElementById('titlepageRuleColor');
                const tc = document.getElementById('tocColor');
                const cl = document.getElementById('colorLinksToggle');
                if (c1 && c1.value) formData.append('titlepageColor', c1.value);
                if (c2 && c2.value) formData.append('titlepageTextColor', c2.value);
                if (c3 && c3.value) formData.append('titlepageRuleColor', c3.value);
                if (tc && tc.value) formData.append('tocColor', tc.value);
                if (cl && cl.checked) formData.append('colorLinks', 'true');
            }
            if (this.logoInput.files[0]) formData.append('logoFile', this.logoInput.files[0]);

            const response = await fetch('/preview-pdf', { method: 'POST', body: formData });
            if (!response.ok) {
                let msg = 'Failed to render preview.';
                try { const data = await response.json(); if (data && data.error) msg = data.error; } catch {}
                this.showToast('error', msg);
                this.showError(msg);
                return;
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            // If book effect is enabled and pdf.js is available, render flipbook
            const useBook = this.bookToggle ? this.bookToggle.checked : false;
            if (useBook && window['pdfjsLib']) {
                try {
                    const worker = window.__PDFJS_WORKER__ || '/static/js/vendor/pdfjs/pdf.worker.min.js';
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = worker;
                    const buf = await blob.arrayBuffer();
                    const pdf = await window.pdfjsLib.getDocument({data: buf}).promise;
                    const keepPage = this.flip && this.flip.pdf ? this.flip.current : 1;
                    await this.openFlipbook(pdf, keepPage);
                    // Update badge
                    const badge = document.getElementById('previewPageCount');
                    if (badge) badge.textContent = `${this.flip.current} / ${pdf.numPages}`;
                    // Hide iframe, show flip container
                    if (this.previewFrame) this.previewFrame.classList.add('d-none');
                    if (this.previewPage) {
                        this.previewPage.classList.add('flip-mode');
                        this.previewPage.classList.remove('d-none');
                    }
                    this.toggleHotspots(true);
                } catch (err) {
                    console.warn('Flipbook render failed, fallback to iframe', err);
                    // Fallback to iframe
                    if (this.previewPage) this.previewPage.classList.add('d-none');
                    if (this.previewFrame) this.previewFrame.classList.remove('d-none');
                    if (this.previewFrame) this.previewFrame.src = url;
                    await this.updatePageCountFromBlob(blob);
                    this.toggleHotspots(false);
                }
            } else {
                if (useBook && !window['pdfjsLib']) {
                    this.showToast('error', 'Effetto libro non disponibile: PDF.js non caricato.');
                }
                // Render in iframe
                if (this.previewPage) {
                    this.previewPage.classList.remove('flip-mode');
                    this.previewPage.classList.add('d-none');
                }
                if (this.previewFrame) this.previewFrame.classList.remove('d-none');
                if (this.previewFrame) this.previewFrame.src = url;
                await this.updatePageCountFromBlob(blob);
                // Disable flip controls when not in book mode
                if (this.flipPageIndicator) this.flipPageIndicator.textContent = '–';
                if (this.prevPageBtn) this.prevPageBtn.disabled = true;
                if (this.nextPageBtn) this.nextPageBtn.disabled = true;
                this.toggleHotspots(false);
            }

            // Show modal
            const modalEl = document.getElementById('previewModal');
            if (modalEl && window.bootstrap) {
                const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.show();
            }
        } catch (e) {
            console.error(e);
            this.showToast('error', 'Preview error.');
            this.showError('Preview error.');
        } finally {
            this.setProgress(false);
            const btnText = this.previewBtn.querySelector('.btn-text');
            const btnLoading = this.previewBtn.querySelector('.btn-loading');
            btnText.classList.remove('d-none');
            btnLoading.classList.add('d-none');
        }
    }

    async updatePageCountFromBlob(blob) {
        try {
            if (!window['pdfjsLib']) return;
            const worker = window.__PDFJS_WORKER__ || '/static/js/vendor/pdfjs/pdf.worker.min.js';
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = worker;
            const buf = await blob.arrayBuffer();
            const pdf = await window.pdfjsLib.getDocument({data: buf}).promise;
            const pages = pdf.numPages;
            const badge = document.getElementById('previewPageCount');
            if (badge) badge.textContent = pages + (pages === 1 ? ' page' : ' pages');
        } catch (err) {
            console.warn('PDF.js page count failed', err);
        }
    }

    async openFlipbook(pdf, startPage) {
        // Prepare container DOM
        if (!this.previewPage) return;
        this.previewPage.classList.add('flip-mode');
        this.previewPage.innerHTML = `
            <div class="flipbook-container">
                <div class="flip-canvas-wrap" id="flipWrap">
                    <canvas id="flipCanvasBottom"></canvas>
                    <canvas id="flipCanvasTop" class="top"></canvas>
                    <div class="spine-shadow"></div>
                    <div class="flip-shadow"></div>
                </div>
            </div>
        `;
        const wrap = document.getElementById('flipWrap');
        const top = document.getElementById('flipCanvasTop');
        const bottom = document.getElementById('flipCanvasBottom');
        const shade = wrap.querySelector('.flip-shadow');

        // Compute layout
        const advanced = this.isAdvanced();
        const spread = advanced && this.spreadToggle ? !!this.spreadToggle.checked : false;
        const dpr = window.devicePixelRatio || 1;
        const zoom = (advanced && this.zoomSelect) ? parseFloat(this.zoomSelect.value || '1') : 1;
        const { baseVp, widthCSS, heightCSS, scale } = await this.computeLayout(pdf, spread, zoom);
        [top, bottom].forEach(c => {
            c.style.width = widthCSS + 'px';
            c.style.height = heightCSS + 'px';
            c.width = Math.round(widthCSS * dpr);
            c.height = Math.round(heightCSS * dpr);
        });

        // Determine start page (preserve previous if provided)
        const total = pdf.numPages;
        let start = parseInt(startPage || 1, 10);
        if (!Number.isFinite(start) || start < 1) start = 1;
        if (start > total) start = total;
        // If spread and start is even, normalize to show correct right page
        if (spread && start > 1 && start % 2 === 0) start = start - 1;

        // Initial render view
        await this.renderSpreadToCanvas(pdf, top, start, spread, scale, dpr);
        await this.renderSpreadToCanvas(pdf, bottom, start, spread, scale, dpr);

        // Save state
        this.flip = {
            pdf,
            current: start,
            total: total,
            wrap,
            top,
            bottom,
            shade,
            scale,
            dpr,
            cache: new Map()
        };
        this.updateFlipUI();

        // Click to navigate (right half = next, left half = prev)
        wrap.addEventListener('click', (e) => {
            const rect = wrap.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x > rect.width / 2) this.flipNavigate(1); else this.flipNavigate(-1);
        });
        // Basic swipe support
        let touchX = null;
        wrap.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
        wrap.addEventListener('touchend', (e) => {
            if (touchX == null) return;
            const dx = e.changedTouches[0].clientX - touchX;
            if (Math.abs(dx) > 40) {
                if (dx < 0) this.flipNavigate(1); else this.flipNavigate(-1);
            }
            touchX = null;
        }, { passive: true });

        // Drag-to-flip (mouse)
        let dragging = false; let startX = 0; let origin = 'left';
        const applyDrag = (dx) => {
            const rect = wrap.getBoundingClientRect();
            const half = rect.width / 2;
            const dir = origin === 'left' ? 1 : -1; // left origin -> prev, right origin -> next
            const norm = Math.max(-half, Math.min(half, dx)) / half; // -1..1
            const deg = norm * 160 * dir;
            this.flip.top.style.transformOrigin = origin + ' center';
            this.flip.top.style.transform = `rotateY(${deg}deg)`;
            if (this.flip.shade) this.flip.shade.style.opacity = String(Math.min(0.35, Math.abs(norm) * 0.35));
        };
        const resetDrag = () => {
            this.flip.top.style.transform = '';
            if (this.flip.shade) this.flip.shade.style.opacity = '0';
        };
        wrap.addEventListener('mousedown', (e) => {
            dragging = true; startX = e.clientX;
            const rect = wrap.getBoundingClientRect();
            origin = (e.clientX - rect.left) < rect.width / 2 ? 'right' : 'left';
            e.preventDefault();
        });
        window.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            applyDrag(e.clientX - startX);
        });
        window.addEventListener('mouseup', (e) => {
            if (!dragging) return; dragging = false;
            const dx = e.clientX - startX; const threshold = 60;
            resetDrag();
            if (Math.abs(dx) > threshold) {
                // Determine direction from origin
                if (origin === 'left') this.flipNavigate(1); else this.flipNavigate(-1);
            }
        });

        // Thumbnails
        if (advanced && this.thumbsBar) {
            await this.buildThumbnails(pdf);
            this.thumbsBar.classList.remove('d-none');
        } else if (this.thumbsBar) {
            this.thumbsBar.classList.add('d-none');
            this.thumbsBar.innerHTML = '';
        }

        // Pre-render next view
        const next = spread ? (start === 1 ? 2 : start + 2) : Math.min(total, start + 1);
        if (pdf.numPages >= next) this.preRenderToCache(next).catch(() => {});
    }

    async computeLayout(pdf, spread, zoom) {
        const first = await pdf.getPage(1);
        const baseVp = first.getViewport({ scale: 1 });
        const containerW = (this.previewFrame ? this.previewFrame.clientWidth : this.previewPage.clientWidth) - 32;
        const maxW = Math.min(1100, Math.max(480, containerW));
        const maxH = Math.min(window.innerHeight * 0.72, 1123);
        let scale = Math.min(maxW / (baseVp.width * (spread ? 2 : 1)), maxH / baseVp.height);
        scale = Math.max(0.5, Math.min(scale * (zoom || 1), 2));
        const widthCSS = Math.round(baseVp.width * scale * (spread ? 2 : 1));
        const heightCSS = Math.round(baseVp.height * scale);
        return { baseVp, widthCSS, heightCSS, scale };
    }

    async renderPDFPage(pdf, canvas, pageNum, scale, dpr) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: scale * dpr });
        const ctx = canvas.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport }).promise;
    }

    async renderSpreadToCanvas(pdf, canvas, current, spread, scale, dpr) {
        const ctx = canvas.getContext('2d');
        ctx.setTransform(1,0,0,1,0,0);
        ctx.clearRect(0,0,canvas.width,canvas.height);
        if (!spread) {
            return this.renderPDFPage(pdf, canvas, current, scale, dpr);
        }
        // Determine pages: cover page on right when current is 1 (odd shows on right)
        const right = (current % 2 === 1) ? current : current + 1;
        const left = right > 1 ? right - 1 : null;
        // Draw left
        const pageWidth = Math.round(canvas.width / 2);
        if (left && left <= this.flip.total) {
            await this.drawPageToContext(pdf, left, ctx, 0, pageWidth, scale, dpr);
        } else {
            // blank left (spine area shading managed by CSS)
        }
        // Draw right
        if (right <= this.flip.total) {
            await this.drawPageToContext(pdf, right, ctx, pageWidth, pageWidth, scale, dpr);
        }
    }

    async drawPageToContext(pdf, pageNum, ctx, offsetXpx, targetWidthPx, scale, dpr) {
        // Render on offscreen then blit for predictable sizing
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: scale * dpr });
        const off = document.createElement('canvas');
        off.width = Math.round(viewport.width);
        off.height = Math.round(viewport.height);
        await page.render({ canvasContext: off.getContext('2d'), viewport }).promise;
        const targetW = Math.round(targetWidthPx);
        const targetH = Math.round(off.height * (targetW / off.width));
        ctx.drawImage(off, Math.round(offsetXpx), 0, targetW, targetH);
    }

    async preRenderToCache(pageNum) {
        if (!this.flip || this.flip.cache.has(pageNum)) return;
        const c = document.createElement('canvas');
        // Match sizes
        c.width = this.flip.top.width;
        c.height = this.flip.top.height;
        c.style.width = this.flip.top.style.width;
        c.style.height = this.flip.top.style.height;
        const spread = this.spreadToggle ? !!this.spreadToggle.checked : false;
        await this.renderSpreadToCanvas(this.flip.pdf, c, pageNum, spread, this.flip.scale, this.flip.dpr);
        this.flip.cache.set(pageNum, c);
    }

    async flipNavigate(delta) {
        if (!this.flip) return;
        const advanced = this.isAdvanced();
        const spread = advanced && this.spreadToggle ? !!this.spreadToggle.checked : false;
        let step = spread ? (this.flip.current === 1 ? 1 : 2) : 1;
        const target = this.flip.current + (delta > 0 ? step : -step);
        if (target < 1 || target > this.flip.total) return;
        const forward = delta > 0;
        // Render target into bottom (use cache if available)
        const cached = this.flip.cache.get(target);
        if (cached) {
            const ctx = this.flip.bottom.getContext('2d');
            ctx.setTransform(1,0,0,1,0,0);
            ctx.clearRect(0,0,this.flip.bottom.width,this.flip.bottom.height);
            ctx.drawImage(cached, 0, 0, this.flip.bottom.width, this.flip.bottom.height);
        } else {
            await this.renderSpreadToCanvas(this.flip.pdf, this.flip.bottom, target, spread, this.flip.scale, this.flip.dpr);
        }
        // Animate current (top) away
        this.playFlipSound();
        const cls = forward ? 'flip-anim-next' : 'flip-anim-prev';
        this.flip.wrap.classList.remove('flip-anim-next', 'flip-anim-prev');
        // Force reflow to restart animation if repeated
        void this.flip.wrap.offsetWidth;
        this.flip.wrap.classList.add(cls);
        const onEnd = () => {
            this.flip.wrap.classList.remove(cls);
            // Swap canvases: bottom becomes new top
            this.flip.top.classList.remove('top');
            this.flip.bottom.classList.add('top');
            const tmp = this.flip.top;
            this.flip.top = this.flip.bottom;
            this.flip.bottom = tmp;
            this.flip.current = target;
            this.updateFlipUI();
            this.flip.top.removeEventListener('animationend', onEnd);
            // Pre-cache neighbor for smoother next flip
            const neighbor = forward ? Math.min(this.flip.total, this.flip.current + (spread ? (this.flip.current === 1 ? 1 : 2) : 1)) : Math.max(1, this.flip.current - (spread ? (this.flip.current <= 3 ? 1 : 2) : 1));
            this.preRenderToCache(neighbor).catch(() => {});
        };
        this.flip.top.addEventListener('animationend', onEnd);
    }

    updateFlipUI() {
        // Update indicator and buttons
        const advanced = this.isAdvanced();
        const spread = advanced && this.spreadToggle ? !!this.spreadToggle.checked : false;
        let label = `${this.flip.current} / ${this.flip.total}`;
        if (spread) {
            const right = (this.flip.current % 2 === 1) ? this.flip.current : this.flip.current + 1;
            const left = right > 1 ? right - 1 : null;
            label = left ? `${left}–${right} / ${this.flip.total}` : `${right} / ${this.flip.total}`;
        }
        if (this.flipPageIndicator) this.flipPageIndicator.textContent = label;
        const badge = document.getElementById('previewPageCount');
        if (badge) badge.textContent = label;
        if (this.prevPageBtn) this.prevPageBtn.disabled = this.flip.current <= 1;
        if (this.nextPageBtn) this.nextPageBtn.disabled = this.flip.current >= this.flip.total;
        // Highlight thumbnail
        if (advanced) this.highlightThumb();
    }

    playFlipSound() {
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            if (this.soundToggle && !this.soundToggle.checked) return;
            if (!this.audioCtx) this.audioCtx = new AC();
            const ctx = this.audioCtx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const lpf = ctx.createBiquadFilter();
            lpf.type = 'lowpass';
            lpf.frequency.value = 1200;
            osc.type = 'sawtooth';
            const t = ctx.currentTime;
            const baseF = 180 + Math.random()*60;
            osc.frequency.setValueAtTime(baseF, t);
            osc.frequency.exponentialRampToValueAtTime(baseF*3, t + 0.08);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
            osc.connect(lpf).connect(gain).connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.26);
        } catch {}
    }

    relayoutFlipbook() {
        if (!this.flip) return;
        const advanced = this.isAdvanced();
        const spread = advanced && this.spreadToggle ? !!this.spreadToggle.checked : false;
        const dpr = window.devicePixelRatio || 1;
        const zoom = (advanced && this.zoomSelect) ? parseFloat(this.zoomSelect.value || '1') : 1;
        this.computeLayout(this.flip.pdf, spread, zoom).then(({ widthCSS, heightCSS, scale }) => {
            [this.flip.top, this.flip.bottom].forEach(c => {
                c.style.width = widthCSS + 'px';
                c.style.height = heightCSS + 'px';
                c.width = Math.round(widthCSS * dpr);
                c.height = Math.round(heightCSS * dpr);
            });
            this.flip.scale = scale;
            // Re-render current on both
            this.renderSpreadToCanvas(this.flip.pdf, this.flip.top, this.flip.current, spread, this.flip.scale, this.flip.dpr);
            this.renderSpreadToCanvas(this.flip.pdf, this.flip.bottom, this.flip.current, spread, this.flip.scale, this.flip.dpr);
        });
    }

    isAdvanced() {
        return this.advancedToggle ? !!this.advancedToggle.checked : false;
    }

    updateControlsForMode() {
        const advanced = this.isAdvanced();
        if (this.spreadToggle) this.spreadToggle.disabled = !advanced;
        if (this.zoomSelect) this.zoomSelect.disabled = !advanced;
        if (!advanced && this.thumbsBar) { this.thumbsBar.classList.add('d-none'); this.thumbsBar.innerHTML = ''; }
        const modeEl = document.getElementById('previewModeLabel');
        if (modeEl) modeEl.textContent = advanced ? 'Avanzata' : 'Semplice';
        // Toolbar visual states
        if (this.modeSimpleBtn && this.modeAdvancedBtn) {
            this.modeSimpleBtn.classList.toggle('active', !advanced);
            this.modeAdvancedBtn.classList.toggle('active', advanced);
        }
        if (this.spreadBtn) this.spreadBtn.disabled = !advanced;
        if (this.zoomOutBtn) this.zoomOutBtn.disabled = !advanced;
        if (this.zoomInBtn) this.zoomInBtn.disabled = !advanced;
        if (this.thumbsBtn) this.thumbsBtn.disabled = !advanced;
        // Zoom label sync
        if (this.zoomLevelLabel && this.zoomSelect) {
            const val = parseFloat(this.zoomSelect.value || '1');
            this.zoomLevelLabel.textContent = Math.round(val * 100) + '%';
        }
    }

    setupToolbar() {
        // Restore saved states
        try {
            const adv = localStorage.getItem('mdpdf_advanced');
            if (this.advancedToggle) this.advancedToggle.checked = adv ? adv === 'true' : false;
            const book = localStorage.getItem('mdpdf_book');
            if (this.bookToggle) this.bookToggle.checked = book ? book === 'true' : true;
            const sound = localStorage.getItem('mdpdf_sound');
            if (this.soundToggle) this.soundToggle.checked = (sound ?? 'true') !== 'false';
            const thumbs = localStorage.getItem('mdpdf_thumbs') === 'true';
            if (this.thumbsBar && thumbs) this.thumbsBar.classList.remove('d-none');
        } catch {}

        const setActive = (btn, active) => btn && btn.classList.toggle('active', !!active);
        const refreshBookBtn = () => setActive(this.bookEffectBtn, this.bookToggle ? this.bookToggle.checked : false);
        const refreshSoundBtn = () => setActive(this.soundBtn, this.soundToggle ? this.soundToggle.checked : true);
        const refreshSpreadBtn = () => setActive(this.spreadBtn, this.spreadToggle ? this.spreadToggle.checked : false);

        // Mode buttons
        if (this.modeSimpleBtn) this.modeSimpleBtn.addEventListener('click', () => {
            if (this.advancedToggle) this.advancedToggle.checked = false;
            try { localStorage.setItem('mdpdf_advanced', 'false'); } catch {}
            this.updateControlsForMode();
            if (this.flip && this.previewModal.classList.contains('show')) this.openFlipbook(this.flip.pdf, this.flip.current);
        });
        if (this.modeAdvancedBtn) this.modeAdvancedBtn.addEventListener('click', () => {
            if (this.advancedToggle) this.advancedToggle.checked = true;
            try { localStorage.setItem('mdpdf_advanced', 'true'); } catch {}
            this.updateControlsForMode();
            if (this.flip && this.previewModal.classList.contains('show')) this.openFlipbook(this.flip.pdf, this.flip.current);
        });

        // Book effect
        if (this.bookEffectBtn) this.bookEffectBtn.addEventListener('click', () => {
            if (this.bookToggle) this.bookToggle.checked = !this.bookToggle.checked;
            try { localStorage.setItem('mdpdf_book', this.bookToggle.checked ? 'true' : 'false'); } catch {}
            refreshBookBtn();
            const isOpen = this.previewModal && this.previewModal.classList.contains('show');
            if (isOpen) this.generatePreview();
        });
        refreshBookBtn();

        // Spread
        if (this.spreadBtn) this.spreadBtn.addEventListener('click', () => {
            if (!this.isAdvanced()) return;
            if (this.spreadToggle) this.spreadToggle.checked = !this.spreadToggle.checked;
            try { localStorage.setItem('mdpdf_spread', this.spreadToggle.checked ? 'true' : 'false'); } catch {}
            refreshSpreadBtn();
            if (this.flip && this.previewModal.classList.contains('show')) this.openFlipbook(this.flip.pdf, this.flip.current);
        });
        refreshSpreadBtn();

        // Zoom
        const zoomSteps = [0.75, 1, 1.25, 1.5];
        const clampZoom = (v) => zoomSteps.reduce((prev, curr) => Math.abs(curr - v) < Math.abs(prev - v) ? curr : prev, 1);
        const setZoom = (v) => {
            if (!this.isAdvanced() || !this.zoomSelect) return;
            const nv = clampZoom(v);
            this.zoomSelect.value = String(nv);
            try { localStorage.setItem('mdpdf_zoom', String(nv)); } catch {}
            if (this.zoomLevelLabel) this.zoomLevelLabel.textContent = Math.round(nv * 100) + '%';
            this.relayoutFlipbook();
        };
        if (this.zoomOutBtn) this.zoomOutBtn.addEventListener('click', () => setZoom(parseFloat(this.zoomSelect.value || '1') - 0.25));
        if (this.zoomInBtn) this.zoomInBtn.addEventListener('click', () => setZoom(parseFloat(this.zoomSelect.value || '1') + 0.25));
        if (this.zoomLevelLabel && this.zoomSelect) this.zoomLevelLabel.textContent = Math.round(parseFloat(this.zoomSelect.value || '1') * 100) + '%';

        // Sound
        if (this.soundBtn) this.soundBtn.addEventListener('click', () => {
            if (this.soundToggle) this.soundToggle.checked = !this.soundToggle.checked;
            try { localStorage.setItem('mdpdf_sound', this.soundToggle.checked ? 'true' : 'false'); } catch {}
            refreshSoundBtn();
        });
        refreshSoundBtn();

        // Thumbnails
        if (this.thumbsBtn) this.thumbsBtn.addEventListener('click', () => {
            if (!this.isAdvanced() || !this.thumbsBar) return;
            const show = this.thumbsBar.classList.contains('d-none');
            this.thumbsBar.classList.toggle('d-none');
            try { localStorage.setItem('mdpdf_thumbs', show ? 'true' : 'false'); } catch {}
        });
        if (this.thumbsBar) {
            const thumbsOn = (localStorage.getItem('mdpdf_thumbs') === 'true');
            this.thumbsBar.classList.toggle('d-none', !thumbsOn);
        }
    }

    async buildThumbnails(pdf) {
        if (!this.thumbsBar) return;
        this.thumbsBar.innerHTML = '';
        const maxThumbs = pdf.numPages; // render all; adjust if needed
        for (let i = 1; i <= maxThumbs; i++) {
            const item = document.createElement('div');
            item.className = 'thumb-item';
            const cnv = document.createElement('canvas');
            cnv.className = 'thumb';
            const page = await pdf.getPage(i);
            const vp = page.getViewport({ scale: 0.2 });
            cnv.width = Math.round(vp.width);
            cnv.height = Math.round(vp.height);
            await page.render({ canvasContext: cnv.getContext('2d'), viewport: vp }).promise;
            cnv.addEventListener('click', () => this.jumpToPage(i));
            cnv.setAttribute('data-page', String(i));
            item.appendChild(cnv);
            const num = document.createElement('span');
            num.className = 'thumb-num';
            num.textContent = String(i);
            item.appendChild(num);
            this.thumbsBar.appendChild(item);
        }
        this.highlightThumb();
    }

    highlightThumb() {
        if (!this.thumbsBar || !this.flip) return;
        const spread = this.spreadToggle ? !!this.spreadToggle.checked : false;
        const right = spread ? ((this.flip.current % 2 === 1) ? this.flip.current : this.flip.current + 1) : this.flip.current;
        this.thumbsBar.querySelectorAll('.thumb').forEach(el => el.classList.remove('selected'));
        const el = this.thumbsBar.querySelector(`.thumb[data-page="${right}"]`);
        if (el) el.classList.add('selected');
    }

    async jumpToPage(pageNum) {
        if (!this.flip) return;
        const spread = this.spreadToggle ? !!this.spreadToggle.checked : false;
        const target = spread ? (pageNum % 2 === 1 ? pageNum : pageNum - 1) : pageNum;
        // Render directly without flip animation
        await this.renderSpreadToCanvas(this.flip.pdf, this.flip.top, target, spread, this.flip.scale, this.flip.dpr);
        await this.renderSpreadToCanvas(this.flip.pdf, this.flip.bottom, target, spread, this.flip.scale, this.flip.dpr);
        this.flip.current = target;
        this.updateFlipUI();
        // Pre-cache neighbor
        const neighbor = Math.min(this.flip.total, this.flip.current + (spread ? 2 : 1));
        this.preRenderToCache(neighbor).catch(() => {});
    }

    setLoading(isLoading) {
        const btnText = this.generateBtn.querySelector('.btn-text');
        const btnLoading = this.generateBtn.querySelector('.btn-loading');
        
        if (isLoading) {
            btnText.classList.add('d-none');
            btnLoading.classList.remove('d-none');
            this.generateBtn.disabled = true;
        } else {
            btnText.classList.remove('d-none');
            btnLoading.classList.add('d-none');
            this.updateGenerateButton();
        }
    }

    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        this.errorAlert.classList.remove('d-none');
        
        // Scroll to error
        this.errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    hideError() {
        this.errorAlert.classList.add('d-none');
    }

    showSuccess(message) {
        const successMessage = document.getElementById('successMessage');
        successMessage.textContent = message;
        this.successAlert.classList.remove('d-none');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideSuccess();
        }, 5000);
    }

    hideSuccess() {
        this.successAlert.classList.add('d-none');
    }

    // Theme handling
    initTheme() {
        const saved = localStorage.getItem('mdpdf_theme');
        let theme = saved || '';
        if (!theme) {
            // Respect system if nothing saved
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            theme = prefersDark ? 'dark' : 'light';
        }
        this.applyTheme(theme);
        if (this.themeToggle) {
            this.themeToggle.checked = theme === 'dark';
            this.themeToggle.addEventListener('change', () => {
                const t = this.themeToggle.checked ? 'dark' : 'light';
                this.applyTheme(t);
                try { localStorage.setItem('mdpdf_theme', t); } catch {}
            });
        }
    }

    applyTheme(theme) {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.setAttribute('data-theme', 'dark');
        } else {
            root.removeAttribute('data-theme');
        }
    }

    // Palette handling
    initPalette() {
        const saved = localStorage.getItem('mdpdf_palette') || 'consulting';
        this.applyPalette(saved);
        if (this.paletteSelect) {
            this.paletteSelect.value = saved;
            this.paletteSelect.addEventListener('change', () => {
                const val = this.paletteSelect.value || 'consulting';
                this.applyPalette(val);
                try { localStorage.setItem('mdpdf_palette', val); } catch {}
            });
        }
    }
    applyPalette(palette) {
        const root = document.documentElement;
        const allowed = new Set(['consulting','neutral','executive']);
        root.setAttribute('data-palette', allowed.has(palette) ? palette : 'consulting');
    }

    setupReset() {
        if (!this.resetUiBtn) return;
        this.resetUiBtn.addEventListener('click', () => this.resetUI());
    }
    resetUI() {
        try {
            localStorage.removeItem('mdpdf_prefs');
            localStorage.removeItem('mdpdf_theme');
            localStorage.removeItem('mdpdf_palette');
        } catch {}
        const templateEl = document.getElementById('templateType');
        if (templateEl) templateEl.value = 'classic';
        if (this.tocEnabledEl) this.tocEnabledEl.checked = true;
        if (this.tocDepthEl) this.tocDepthEl.value = '3';
        if (this.themeToggle) this.themeToggle.checked = false;
        this.applyTheme('light');
        this.applyPalette('consulting');
        this.removeFile('markdownFile');
        this.removeFile('logoFile');
        this.showToast('success', 'UI reset to defaults.');
    }

    setupRipples() {
        const addRipple = (btn) => {
            btn.addEventListener('click', (e) => {
                const rect = btn.getBoundingClientRect();
                const ripple = document.createElement('span');
                const size = Math.max(rect.width, rect.height);
                ripple.className = 'ripple';
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
                ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
                btn.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            });
        };
        document.querySelectorAll('.btn-primary, .btn-outline-secondary').forEach(addRipple);
    }

    // Preferences
    savePreferences() {
        try {
            const prefs = {
                templateType: document.getElementById('templateType')?.value || 'classic',
                tocEnabled: this.tocEnabledEl ? !!this.tocEnabledEl.checked : true,
                tocDepth: this.tocDepthEl ? String(this.tocDepthEl.value || '3') : '3',
                titlepage: document.getElementById('titlepageToggle')?.checked || false,
                logoWidth: document.getElementById('logoWidth')?.value || '',
                titlepageColor: document.getElementById('titlepageColor')?.value || '',
                titlepageTextColor: document.getElementById('titlepageTextColor')?.value || '',
                titlepageRuleColor: document.getElementById('titlepageRuleColor')?.value || '',
                tocColor: document.getElementById('tocColor')?.value || '',
                colorLinks: document.getElementById('colorLinksToggle')?.checked || false,
            };
            localStorage.setItem('mdpdf_prefs', JSON.stringify(prefs));
        } catch {}
    }

    loadPreferences() {
        try {
            const raw = localStorage.getItem('mdpdf_prefs');
            if (!raw) return;
            const prefs = JSON.parse(raw);
            const templateEl = document.getElementById('templateType');
            if (templateEl && prefs.templateType) templateEl.value = prefs.templateType;
            if (this.tocEnabledEl && typeof prefs.tocEnabled === 'boolean') this.tocEnabledEl.checked = prefs.tocEnabled;
            if (this.tocDepthEl && prefs.tocDepth) this.tocDepthEl.value = String(prefs.tocDepth);
            // Eisvogel specifics
            const tp = document.getElementById('titlepageToggle'); if (tp && typeof prefs.titlepage === 'boolean') tp.checked = prefs.titlepage;
            const lw = document.getElementById('logoWidth'); if (lw && typeof prefs.logoWidth === 'string') lw.value = prefs.logoWidth;
            const c1 = document.getElementById('titlepageColor'); if (c1 && prefs.titlepageColor) c1.value = prefs.titlepageColor;
            const c2 = document.getElementById('titlepageTextColor'); if (c2 && prefs.titlepageTextColor) c2.value = prefs.titlepageTextColor;
            const c3 = document.getElementById('titlepageRuleColor'); if (c3 && prefs.titlepageRuleColor) c3.value = prefs.titlepageRuleColor;
            const tc = document.getElementById('tocColor'); if (tc && prefs.tocColor) tc.value = prefs.tocColor;
            const cl = document.getElementById('colorLinksToggle'); if (cl && typeof prefs.colorLinks === 'boolean') cl.checked = prefs.colorLinks;
        } catch {}
    }

    // Progress bar
    setProgress(active) {
        if (!this.progressBar) return;
        if (active) {
            this.progressBar.classList.remove('d-none');
            this.progressBar.setAttribute('aria-hidden', 'false');
        } else {
            this.progressBar.classList.add('d-none');
            this.progressBar.setAttribute('aria-hidden', 'true');
        }
    }

    // Toasts
    showToast(type, message) {
        if (!this.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `app-toast ${type}`;
        toast.innerHTML = `
            <div class="d-flex align-items-start gap-2">
                <div class="icon pt-1">${type === 'success' ? '✅' : '⚠️'}</div>
                <div class="flex-grow-1">
                    <div class="title">${type === 'success' ? 'Success' : 'Attention'}</div>
                    <div class="message">${message}</div>
                </div>
            </div>
        `;
        this.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('fade');
            setTimeout(() => toast.remove(), 300);
        }, 3800);
    }

    toggleHotspots(show) {
        const isBook = this.bookToggle ? this.bookToggle.checked : false;
        const effective = !!show && !!isBook;
        const left = document.getElementById('navHotspotLeft');
        const right = document.getElementById('navHotspotRight');
        if (left) left.classList.toggle('d-none', !effective);
        if (right) right.classList.toggle('d-none', !effective);
    }

    setupTooltips() {
        if (window.bootstrap) {
            document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
                bootstrap.Tooltip.getOrCreateInstance(el);
            });
        }
        document.addEventListener('shown.bs.modal', (e) => {
            if (e.target && window.bootstrap) {
                e.target.querySelectorAll?.('[data-bs-toggle="tooltip"]').forEach(el => {
                    bootstrap.Tooltip.getOrCreateInstance(el);
                });
            }
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PDFGenerator();
});
