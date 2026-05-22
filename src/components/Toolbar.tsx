interface ToolbarProps {
  sceneLabel: string;
  disabled: boolean;
  onRandom: () => void;
  onPrevScene: () => void;
  onNextScene: () => void;
  onExportPdf: () => void;
}

/** Панель кнопок управления сценой */
export function Toolbar({
  sceneLabel,
  disabled,
  onRandom,
  onPrevScene,
  onNextScene,
  onExportPdf,
}: ToolbarProps) {
  return (
    <section className="toolbar">
      <button type="button" className="btn btn-primary" disabled={disabled} onClick={onRandom}>
        Случайная фигура / линия
      </button>
      <button type="button" className="btn" disabled={disabled} onClick={onPrevScene}>
        ← Сцена
      </button>
      <button type="button" className="btn" disabled={disabled} onClick={onNextScene}>
        Сцена →
      </button>
      <button type="button" className="btn btn-accent" disabled={disabled} onClick={onExportPdf}>
        Экспорт в PDF (вектор)
      </button>
      <span className="scene-label">{sceneLabel || 'Загрузка…'}</span>
    </section>
  );
}
