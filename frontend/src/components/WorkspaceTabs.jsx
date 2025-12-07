import { allWorkspaces } from '../constants/workspaces';

// Component for workspace filtering tabs
export default function WorkspaceTabs({ currentWorkspace, onWorkspaceChange }) {
  return (
    <div className="workspace-tabs">
      {allWorkspaces.map(workspace => (
        <button
          key={workspace.id || 'all'}
          className={`tab ${currentWorkspace === workspace.id ? 'active' : ''}`}
          onClick={() => onWorkspaceChange(workspace.id)}
        >
          {workspace.name}
        </button>
      ))}
    </div>
  );
}
