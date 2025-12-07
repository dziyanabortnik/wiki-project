const { ERRORS } = require('../constants/errorMessages');
const { handleWorkspaceNotFound } = require('../utils/errorHandlers');

class WorkspaceService {
  constructor(WorkspaceModel) {
    this.Workspace = WorkspaceModel;
  }

  async getAllWorkspaces() {
    try {
      return await this.Workspace.findAll({
        order: [['name', 'ASC']]
      });
    } catch (err) {
      console.error('Error fetching workspaces:', err);
      throw new Error(ERRORS.WORKSPACE_FETCH_FAILED);
    }
  }

  async getWorkspaceById(id) {
    try {
      const workspace = await this.Workspace.findByPk(id);
      handleWorkspaceNotFound(workspace, id);
      return workspace;
    } catch (err) {
      if (err.message === ERRORS.WORKSPACE_NOT_FOUND) {
        throw err;
      }
      throw new Error(ERRORS.WORKSPACE_FETCH_FAILED);
    }
  }
}

module.exports = WorkspaceService;
