import '../App.css';

/**
 * FileSlot — Campo de seleção de um arquivo PDF
 *
 * Props:
 *   index        {number}    — posição do slot (1-based para exibição)
 *   file         {File|null} — arquivo selecionado (null se vazio)
 *   onFileChange {(file: File) => void}
 *   onRemove     {() => void}
 *   canRemove    {boolean}   — false quando só existem 2 slots
 *   labelSelect  {string}    — texto "Selecionar arquivo PDF" (i18n)
 *   labelHint    {string}    — texto "Clique para escolher" (i18n)
 *   labelRemove  {string}    — texto aria "Remover arquivo" (i18n)
 */
export default function FileSlot({
  index,
  file,
  onFileChange,
  onRemove,
  canRemove,
  labelSelect = 'Selecionar arquivo PDF',
  labelHint = 'Clique para escolher',
  labelRemove = 'Remover arquivo',
}) {
  const inputId = `pdf-input-${index}`;

  function handleChange(e) {
    const selected = e.target.files?.[0];
    if (selected) onFileChange(selected);
  }

  return (
    <div className="file-slot">
      <input
        id={inputId}
        type="file"
        accept="application/pdf"
        className="visually-hidden"
        onChange={handleChange}
        aria-label={`${labelSelect} ${index}`}
      />

      <label
        htmlFor={inputId}
        className={`file-slot-label${file ? ' has-file' : ''}`}
      >
        {/* Número do slot */}
        <span className="file-slot-index" aria-hidden="true">
          {index}
        </span>

        {/* Info do arquivo */}
        <span className="file-slot-content">
          {file ? (
            <span className="file-slot-name" title={file.name}>
              {file.name}
            </span>
          ) : (
            <>
              <span className="file-slot-name" style={{ color: 'var(--color-text-secondary)' }}>
                {labelSelect}
              </span>
              <span className="file-slot-hint">{labelHint}</span>
            </>
          )}
        </span>

        {/* Ícone */}
        <span className="file-slot-icon" aria-hidden="true">
          {file ? '📄' : '📂'}
        </span>
      </label>

      {/* Botão remover */}
      <button
        type="button"
        className="file-remove-btn"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label={`${labelRemove} ${index}`}
        title={canRemove ? labelRemove : ''}
      >
        ✕
      </button>
    </div>
  );
}
