export default function ViewSwitcher({ value, onChange }) {
  const items = [
    { key: 'board', label: 'Board' },
    { key: 'table', label: 'Table' },
    { key: 'roadmap', label: 'Roadmap' },
  ];

  return (
    <div className="view-switcher" role="tablist" aria-label="Project views">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={value === item.key}
          className={value === item.key ? 'view-switcher__tab is-active' : 'view-switcher__tab'}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
