import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { projectAPI } from '../../services/api';
import ViewSwitcher from './ViewSwitcher';
import FilterBar from './FilterBar';
import KebabMenu from '../shared/KebabMenu';

const notifyProjectsChanged = () => {
  window.dispatchEvent(new CustomEvent('projects:changed'));
};

export default function ProjectHeader({
  project,
  user,
  view,
  onViewChange,
  search,
  onSearch,
  onNewItem,
  users,
  filterAssignee,
  onFilterAssignee,
  filterStatus,
  onFilterStatus,
  labelOptions,
  milestoneOptions,
  selectedLabels,
  onToggleLabel,
  selectedMilestones,
  onToggleMilestone,
  groupBy,
  onGroupByChange,
  sortKey,
  sortDir,
  onSortChange,
  visibleFields,
  onToggleField,
  density,
  onDensityChange,
  showCompleted,
  onShowCompletedChange,
  onClearFilters,
  onDelete,
}) {
  const [saving, setSaving] = useState(false);
  const lastSavedName = useRef(project?.name || 'Project');

  const canEdit = Boolean(user && (user.role === 'admin' || String(user._id) === String(project?.createdBy)));

  const handleTitleBlur = async (e) => {
    const newName = e.currentTarget.textContent.trim();
    if (!newName || newName === lastSavedName.current) return;
    if (!project?._id) return;
    setSaving(true);
    try {
      await projectAPI.update(project._id, { name: newName });
      lastSavedName.current = newName;
      toast.success('Project name saved');
      notifyProjectsChanged();
    } catch {
      // Revert displayed text to last saved value
      e.currentTarget.textContent = lastSavedName.current;
      toast.error('Failed to save project name');
    } finally {
      setSaving(false);
    }
  };

  return (
    <header className="project-header-shell">
      <div className="project-header-shell__title-block">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1
            className="project-header-shell__title"
            contentEditable={canEdit}
            suppressContentEditableWarning aria-disabled={!canEdit}
          >
            {project?.name || 'Project'}
          </h1>
          {canEdit && onDelete && (
            <KebabMenu
              ariaLabel="Project actions"
              items={[
                { label: 'Delete project', onClick: onDelete, danger: true },
              ]}
            />
          )}
        </div>
        {saving && (
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
            Saving…
          </span>
        )}
        <p className="project-header-shell__description">
          {project?.description || 'Track work in a GitHub-style project workspace.'}
        </p>
      </div>
      <div className="project-header-shell__controls">
        <ViewSwitcher value={view} onChange={onViewChange} />
        <FilterBar
          search={search}
          onSearch={onSearch}
          onNewItem={onNewItem}
          users={users}
          filterAssignee={filterAssignee}
          onFilterAssignee={onFilterAssignee}
          filterStatus={filterStatus}
          onFilterStatus={onFilterStatus}
          labelOptions={labelOptions}
          milestoneOptions={milestoneOptions}
          selectedLabels={selectedLabels}
          onToggleLabel={onToggleLabel}
          selectedMilestones={selectedMilestones}
          onToggleMilestone={onToggleMilestone}
          groupBy={groupBy}
          onGroupByChange={onGroupByChange}
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={onSortChange}
          visibleFields={visibleFields}
          onToggleField={onToggleField}
          density={density}
          onDensityChange={onDensityChange}
          showCompleted={showCompleted}
          onShowCompletedChange={onShowCompletedChange}
          onClearFilters={onClearFilters}
        />
      </div>
    </header>
  );
}

