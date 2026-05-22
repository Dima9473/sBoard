interface EventLogProps {
  lines: string[];
}

/** Лог pointer-событий и системных сообщений */
export function EventLog({ lines }: EventLogProps) {
  const text = lines.length > 0 ? lines.join('\n') : 'Ожидание pointerdown / pointerup…';

  return (
    <section className="log-panel">
      <h2>События</h2>
      <pre className="event-log">{text}</pre>
    </section>
  );
}
