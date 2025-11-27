// Mapping of workspace IDs to display names
export const workspaceNames = {
  'uncategorized': 'Uncategorized',
  'nature': 'Nature & Science', 
  'culture': 'Culture & Arts',
  'tech': 'Technology',
  'education': 'Education'
};

// Helper function to get workspace name by ID
export const getWorkspaceName = (workspaceId) => {
  if (!workspaceId) return workspaceNames['uncategorized'];
  return workspaceNames[workspaceId] || workspaceId;
};

export const allWorkspaces = [
  { 
    id: null,
    name: 'All Articles'
  },
  { 
    id: 'uncategorized',
    name: workspaceNames['uncategorized']
  },
  { 
    id: 'nature',
    name: workspaceNames['nature']
  },
  { 
    id: 'culture',
    name: workspaceNames['culture']
  },
  { 
    id: 'tech',
    name: workspaceNames['tech']
  },
  { 
    id: 'education',
    name: workspaceNames['education']
  }
];
