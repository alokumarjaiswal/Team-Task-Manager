import { useMemo, useState, useRef, useEffect } from 'react';

const fieldOptions = [
  { key: 'assignee', label: 'Assignee' },
  { key: 'description', label: 'Description' },
  { key: 'dueDate', label: 'Due date' },
  { key: 'labels', label: 'Labels' },
  { key: 'milestone', label: 'Milestone' },
  { key: 'comments', label: 'Comments' },
];

const groupByOptions = [
  { key: 'status', label: 'Status' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'label', label: 'Label' },
  { key: 'milestone', label: 'Milestone' },
];

const sortOptions = [
  { key: 'updatedAt', label: 'Updated' },
  { key: 'createdAt', label: 'Created' },
  { key: 'dueDate', label: 'Due date' },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
];

export default function FilterBar({
  search,
  onSearch,
  onNewItem,
  users = [],
  filterAssignee = '',
  onFilterAssignee,
  filterStatus = '',
  onFilterStatus,
  labelOptions = [],
  milestoneOptions = [],
  selectedLabels = [],
  onToggleLabel,
  selectedMilestones = [],
  onToggleMilestone,
  groupBy = 'status',
  onGroupByChange,
  sortKey = 'updatedAt',
  sortDir = 'desc',
  onSortChange,
  visibleFields = {},
  onToggleField,
  density = 'comfortable',
  onDensityChange,
  showCompleted = true,
  onShowCompletedChange,
  onClearFilters,
}) {
  const [openMenu, setOpenMenu] = useState(null);
  const actionsRef = useRef(null);

  useEffect(() => {
    if (!openMenu) return;
    const handler = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenu]);

  const activeCounts = useMemo(() => ({
    labels: selectedLabels.length,
    milestones: selectedMilestones.length,
    fields: Object.values(visibleFields).filter(Boolean).length,
  }), [selectedLabels.length, selectedMilestones.length, visibleFields]);

  const toggleMenu = (menuKey) => {
    setOpenMenu((current) => (current === menuKey ? null : menuKey));
  };

  const menuShellStyle = {
    position: 'absolute',
    top: '48px',
    left: 0,
    minWidth: '280px',
    maxWidth: '360px',
    background: 'var(--color-canvas-default)',
    border: '1px solid var(--color-border-default)',
    borderRadius: '12px',
    boxShadow: '0 12px 32px rgba(1, 4, 9, 0.12)',
    padding: '12px',
    zIndex: 20,
  };

  const menuListStyle = {
    display: 'grid',
    gap: '8px',
    marginTop: '10px',
  };

  const menuButtonStyle = (active) => ({
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 10px',
    borderRadius: '8px',
    border: active ? '1px solid var(--color-accent-emphasis)' : '1px solid var(--color-border-muted)',
    background: active ? 'rgba(31, 111, 235, 0.08)' : 'var(--color-canvas-default)',
    cursor: 'pointer',
  });

  const renderMenu = () => {
    if (!openMenu) return null;

    if (openMenu === 'labels') {
      return (
        <div style={menuShellStyle}>
          <div className="flex-between" style={{ gap: '12px' }}>
            <strong>Labels</strong>
            <button type="button" className="btn" onClick={() => setOpenMenu(null)}>Close</button>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Filter tasks by label.
          </div>
          <div style={menuListStyle}>
            {labelOptions.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No labels yet.</div>
            ) : labelOptions.map((label) => {
              const active = selectedLabels.includes(label);
              return (
                <button key={label} type="button" style={menuButtonStyle(active)} onClick={() => onToggleLabel(label)}>
                  <span>{label}</span>
                  <span>{active ? 'On' : 'Off'}</span>
                </button>
              );
            })}
          </div>
          <div className="flex-between" style={{ marginTop: '12px', gap: '8px' }}>
            <button type="button" className="btn" onClick={onClearFilters}>Clear filters</button>
            <button type="button" className="btn btn--primary" onClick={() => setOpenMenu(null)}>Done</button>
          </div>
        </div>
      );
    }

    if (openMenu === 'milestones') {
      return (
        <div style={menuShellStyle}>
          <div className="flex-between" style={{ gap: '12px' }}>
            <strong>Milestones</strong>
            <button type="button" className="btn" onClick={() => setOpenMenu(null)}>Close</button>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Filter tasks by milestone.
          </div>
          <div style={menuListStyle}>
            {milestoneOptions.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No milestones yet.</div>
            ) : milestoneOptions.map((milestone) => {
              const active = selectedMilestones.includes(milestone);
              return (
                <button key={milestone} type="button" style={menuButtonStyle(active)} onClick={() => onToggleMilestone(milestone)}>
                  <span>{milestone}</span>
                  <span>{active ? 'On' : 'Off'}</span>
                </button>
              );
            })}
          </div>
          <div className="flex-between" style={{ marginTop: '12px', gap: '8px' }}>
            <button type="button" className="btn" onClick={onClearFilters}>Clear filters</button>
            <button type="button" className="btn btn--primary" onClick={() => setOpenMenu(null)}>Done</button>
          </div>
        </div>
      );
    }

    if (openMenu === 'groupBy') {
      return (
        <div style={menuShellStyle}>
          <div className="flex-between" style={{ gap: '12px' }}>
            <strong>Group by</strong>
            <button type="button" className="btn" onClick={() => setOpenMenu(null)}>Close</button>
          </div>
          <div style={menuListStyle}>
            {groupByOptions.map((option) => {
              const active = groupBy === option.key;
              return (
                <button key={option.key} type="button" style={menuButtonStyle(active)} onClick={() => onGroupByChange(option.key)}>
                  <span>{option.label}</span>
                  <span>{active ? 'Selected' : ''}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (openMenu === 'sort') {
      return (
        <div style={menuShellStyle}>
          <div className="flex-between" style={{ gap: '12px' }}>
            <strong>Sort</strong>
            <button type="button" className="btn" onClick={() => setOpenMenu(null)}>Close</button>
          </div>
          <div style={menuListStyle}>
            {sortOptions.map((option) => {
              const active = sortKey === option.key;
              return (
                <button key={option.key} type="button" style={menuButtonStyle(active)} onClick={() => onSortChange(option.key)}>
                  <span>{option.label}</span>
                  <span>{active ? (sortDir === 'asc' ? '▲' : '▼') : ''}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (openMenu === 'fields') {
      return (
        <div style={menuShellStyle}>
          <div className="flex-between" style={{ gap: '12px' }}>
            <strong>Fields</strong>
            <button type="button" className="btn" onClick={() => setOpenMenu(null)}>Close</button>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Toggle which fields are shown in the board and table.
          </div>
          <div style={menuListStyle}>
            {fieldOptions.map((field) => {
              const active = Boolean(visibleFields[field.key]);
              return (
                <button key={field.key} type="button" style={menuButtonStyle(active)} onClick={() => onToggleField(field.key)}>
                  <span>{field.label}</span>
                  <span>{active ? 'Shown' : 'Hidden'}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (openMenu === 'viewOptions') {
      return (
        <div style={menuShellStyle}>
          <div className="flex-between" style={{ gap: '12px' }}>
            <strong>View options</strong>
            <button type="button" className="btn" onClick={() => setOpenMenu(null)}>Close</button>
          </div>
          <div style={menuListStyle}>
            <button type="button" style={menuButtonStyle(density === 'comfortable')} onClick={() => onDensityChange('comfortable')}>
              <span>Comfortable density</span>
              <span>{density === 'comfortable' ? 'Selected' : ''}</span>
            </button>
            <button type="button" style={menuButtonStyle(density === 'compact')} onClick={() => onDensityChange('compact')}>
              <span>Compact density</span>
              <span>{density === 'compact' ? 'Selected' : ''}</span>
            </button>
            <button type="button" style={menuButtonStyle(showCompleted)} onClick={() => onShowCompletedChange(!showCompleted)}>
              <span>Show completed tasks</span>
              <span>{showCompleted ? 'On' : 'Off'}</span>
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  const toolbarButtons = [
    { key: 'labels', label: 'Labels', active: selectedLabels.length > 0, count: activeCounts.labels },
    { key: 'milestones', label: 'Milestones', active: selectedMilestones.length > 0, count: activeCounts.milestones },
    { key: 'groupBy', label: 'Group by', active: groupBy !== 'status', count: groupBy !== 'status' ? 1 : 0 },
    { key: 'sort', label: `Sort: ${sortOptions.find((item) => item.key === sortKey)?.label || 'Updated'} ${sortDir === 'asc' ? '▲' : '▼'}`, active: sortKey !== 'updatedAt' || sortDir !== 'desc', count: 0 },
    { key: 'fields', label: 'Fields', active: activeCounts.fields !== fieldOptions.length, count: 0 },
    { key: 'viewOptions', label: 'View options', active: density !== 'comfortable' || !showCompleted, count: 0 },
  ];

  return (
    <div className="filter-bar">
      <input
        type="text"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        placeholder="Filter by keyword or by field"
        aria-label="Filter by keyword or by field"
        className="filter-bar__search"
      />
      <div className="filter-bar__actions" style={{ position: 'relative' }}>
        <select
          value={filterStatus}
          onChange={(e) => onFilterStatus && onFilterStatus(e.target.value)}
          aria-label="Filter by status"
          className="btn filter-bar__select"
        >
          <option value="">All statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <select
          value={filterAssignee}
          onChange={(e) => onFilterAssignee && onFilterAssignee(e.target.value)}
          aria-label="Filter by assignee"
          className="btn filter-bar__select"
        >
          <option value="">All assignees</option>
          {users.map((u) => (
            <option key={u._id} value={u._id}>{u.name}</option>
          ))}
        </select>

        {toolbarButtons.map((item) => (
          <button
            key={item.key}
            type="button"
            className={item.active ? 'btn is-active' : 'btn'}
            onClick={() => toggleMenu(item.key)}
            title={item.label}
          >
            {item.label}
            {item.count > 0 ? <span className="filter-bar__count">{item.count}</span> : null}
          </button>
        ))}

        <button type="button" className="btn btn--primary" onClick={onNewItem} title="Shortcut: N">
          New item
        </button>
        {renderMenu()}
      </div>
    </div>
  );
}
