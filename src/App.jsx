import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import FileSlot from './components/FileSlot';
import logoImg from './assets/logo.jpg';
import { translations } from './i18n';
import './App.css';

/** Idioma padrão: pt-BR */
const DEFAULT_LOCALE = 'pt-BR';

/** Estado inicial: dois slots vazios */
function createInitialSlots() {
  return [null, null];
}

export default function App() {
  const [locale, setLocale] = useState(DEFAULT_LOCALE);
  const [files, setFiles] = useState(createInitialSlots);
  const [isMerging, setIsMerging] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message: string }

  const t = translations[locale];

  // ---- Handlers ----

  function toggleLocale() {
    setLocale((prev) => (prev === 'pt-BR' ? 'en-US' : 'pt-BR'));
  }

  function handleFileChange(index, file) {
    setFiles((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
    setToast(null);
  }

  function addFileSlot() {
    setFiles((prev) => [...prev, null]);
  }

  function removeFileSlot(index) {
    if (files.length <= 2) return;
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // ---- Merge Logic ----

  async function mergePDFs() {
    const selectedFiles = files.filter(Boolean);

    if (selectedFiles.length < 2) {
      setToast({ type: 'error', message: t.errorMinFiles });
      return;
    }

    setIsMerging(true);
    setToast(null);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of selectedFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const pageIndices = pdf.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });

      // Converte para base64 data URL para evitar perda de contexto de user gesture
      // link.click() programático após await perde o user gesture no Chrome,
      // fazendo o browser ignorar o atributo `download` e usar o UUID do blob como nome.
      const reader = new FileReader();
      reader.onload = function () {
        const dataUrl = reader.result;
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'freejoinpdf_merged.pdf';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      reader.readAsDataURL(blob);

      const totalPages = mergedPdf.getPageCount();
      setToast({
        type: 'success',
        message: t.successMsg(totalPages, selectedFiles.length),
      });
    } catch (err) {
      console.error('[FreeJoinPDF] Erro ao unificar PDFs:', err);
      setToast({ type: 'error', message: t.errorGeneric });
    } finally {
      setIsMerging(false);
    }
  }

  // ---- Derived state ----
  const selectedCount = files.filter(Boolean).length;
  const canMerge = selectedCount >= 2 && !isMerging;

  return (
    <main className="app">

      {/* ---- Language Toggle (top-right, fixed) ---- */}
      <div className="lang-switcher" aria-label="Language selector">
        <button
          id="btn-lang"
          type="button"
          className="lang-btn"
          onClick={toggleLocale}
          aria-label={locale === 'pt-BR' ? 'Switch to English' : 'Mudar para Português'}
          title={locale === 'pt-BR' ? 'Switch to English' : 'Mudar para Português'}
        >
          <span className="lang-flag" aria-hidden="true">
            {locale === 'pt-BR' ? '🇧🇷' : '🇺🇸'}
          </span>
          <span className="lang-label">
            {locale === 'pt-BR' ? 'PT' : 'EN'}
          </span>
          <span className="lang-arrow" aria-hidden="true">⇄</span>
        </button>
      </div>

      <div className="card" role="main">

        {/* ---- Header ---- */}
        <header className="header">
          <div className="logo-wrapper">
            <img
              src={logoImg}
              alt={t.logoAlt}
              width="72"
              height="72"
            />
          </div>

          <h1 className="app-title">FreeJoinPDF</h1>
          <p className="app-subtitle">{t.subtitle}</p>

          <span className="privacy-badge" aria-label={t.privacyBadge}>
            <span className="privacy-indicator" aria-hidden="true" />
            {t.privacyBadge}
          </span>
        </header>

        {/* ---- File Slots ---- */}
        <section aria-label={t.filesSection}>
          <div className="files-section" role="list">
            {files.map((file, index) => (
              <div key={index} role="listitem">
                <FileSlot
                  index={index + 1}
                  file={file}
                  onFileChange={(f) => handleFileChange(index, f)}
                  onRemove={() => removeFileSlot(index)}
                  canRemove={files.length > 2}
                  labelSelect={t.selectFile}
                  labelHint={t.clickToSelect}
                  labelRemove={t.removeAriaLabel}
                />
              </div>
            ))}
          </div>

          {/* ---- Add more ---- */}
          <button
            id="btn-add-more"
            type="button"
            className="btn-add-file"
            onClick={addFileSlot}
            aria-label={t.addMoreAriaLabel}
          >
            <span className="btn-add-file-icon" aria-hidden="true">＋</span>
            {t.addMore}
          </button>
        </section>

        <div className="divider" role="separator" />

        {/* ---- Merge Button ---- */}
        <button
          id="btn-merge"
          type="button"
          className="btn-merge"
          onClick={mergePDFs}
          disabled={!canMerge}
          aria-busy={isMerging}
          aria-label={
            isMerging ? t.mergingAriaLabel : t.mergeAriaLabel(selectedCount)
          }
        >
          {isMerging ? (
            <>
              <span className="spinner" aria-hidden="true" />
              {t.merging}
            </>
          ) : (
            <>
              <span aria-hidden="true">🔗</span>
              {t.merge}
              {selectedCount >= 2 && (
                <span aria-hidden="true" style={{ opacity: 0.7, fontWeight: 400, fontSize: '0.85em' }}>
                  {t.mergeFiles(selectedCount)}
                </span>
              )}
            </>
          )}
        </button>

        {/* ---- Toast feedback ---- */}
        {toast && (
          <div
            className={`toast toast-${toast.type}`}
            role="alert"
            aria-live="polite"
          >
            {toast.message}
          </div>
        )}
      </div>

      {/* ---- Footer ---- */}
      <footer className="footer">
        <p>{t.footer}</p>
      </footer>
    </main>
  );
}
