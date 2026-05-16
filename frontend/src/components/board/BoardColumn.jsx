import { Plus } from 'lucide-react';

export default function BoardColumn({ title, count, accent, children, droppableProps, innerRef, isDraggingOver = false, placeholder, onAddTask }) {
  return (
    <section className={isDraggingOver ? 'board-column is-dragging-over' : 'board-column'}>
      <div className="board-column__header">
        <div className="board-column__title-wrap">
          <span className="board-column__status-dot" style={{ background: accent }} aria-hidden="true" />
          <h3 className="board-column__title">{title}</h3>
          <span className="board-column__count" aria-label={`${count} items in ${title}`}>{count}</span>
        </div>
        {onAddTask ? (
          <div className="board-column__actions">
            <button type="button" className="icon-button board-column__action" aria-label={`Add item to ${title}`} title="Shortcut: N" onClick={onAddTask}>
              <Plus size={14} />
            </button>
          </div>
        ) : null}
      </div>
      <div ref={innerRef} className="board-column__body" {...droppableProps}>
        {children}
        {placeholder}
      </div>
    </section>
  );
}
