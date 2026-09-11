import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import FileSlot from './components/FileSlot';
import logoImg from './assets/logo.jpg';
import './App.css';



/**
 * Estado inicial: dois slots vazios
 */
function createInitialSlots() {
  return [null, null];
}

export default function App() {
  const [files, setFiles] = useState(createInitialSlots);
  const [isMerging, setIsMerging] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message: string }

  // ---- Handlers ----

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
      setToast({
        type: 'error',
        message: 'Selecione pelo menos 2 arquivos PDF para unificar.',
      });
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
        link.download = 'freejoinpdf_unificado.pdf';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      reader.readAsDataURL(blob);

      const totalPages = mergedPdf.getPageCount();
      setToast({
        type: 'success',
        message: `✅ PDF unificado com sucesso! ${totalPages} páginas • ${selectedFiles.length} arquivos`,
      });
    } catch (err) {
      console.error('[FreeJoinPDF] Erro ao unificar PDFs:', err);
      setToast({
        type: 'error',
        message: 'Erro ao unificar os PDFs. Verifique se os arquivos são válidos e tente novamente.',
      });
    } finally {
      setIsMerging(false);
    }
  }

  // ---- Derived state ----
  const selectedCount = files.filter(Boolean).length;
  const canMerge = selectedCount >= 2 && !isMerging;

  return (
    <main className="app">
      <div className="card" role="main">

        {/* ---- Header ---- */}
        <header className="header">
          <div className="logo-wrapper">
            <img
              src={logoImg}
              alt="FreeJoinPDF logo — dois documentos sendo unidos"
              width="72"
              height="72"
            />
          </div>

          <h1 className="app-title">FreeJoinPDF</h1>
          <p className="app-subtitle">
            Unifique múltiplos PDFs em segundos, direto no seu navegador
          </p>

          <span className="privacy-badge" aria-label="Processamento 100% local">
            <span className="privacy-indicator" aria-hidden="true" />
            100% local — seus arquivos não saem do seu dispositivo
          </span>
        </header>

        {/* ---- File Slots ---- */}
        <section aria-label="Arquivos para unificar">
          <div className="files-section" role="list">
            {files.map((file, index) => (
              <div key={index} role="listitem">
                <FileSlot
                  index={index + 1}
                  file={file}
                  onFileChange={(f) => handleFileChange(index, f)}
                  onRemove={() => removeFileSlot(index)}
                  canRemove={files.length > 2}
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
            aria-label="Adicionar mais um arquivo PDF"
          >
            <span className="btn-add-file-icon" aria-hidden="true">＋</span>
            Adicionar mais arquivos
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
            isMerging
              ? 'Unificando PDFs, aguarde...'
              : `Unificar ${selectedCount > 0 ? selectedCount : ''} PDFs e fazer download`
          }
        >
          {isMerging ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Unificando PDFs…
            </>
          ) : (
            <>
              <span aria-hidden="true">🔗</span>
              Unificar PDFs
              {selectedCount >= 2 && (
                <span aria-hidden="true" style={{ opacity: 0.7, fontWeight: 400, fontSize: '0.85em' }}>
                  ({selectedCount} arquivos)
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
        <p>Feito com ❤️ • Gratuito, sem anúncios, sem rastreamento</p>
      </footer>
    </main>
  );
}
