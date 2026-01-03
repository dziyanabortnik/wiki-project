const express = require("express");
const router = express.Router();
const WorkspaceService = require("../services/workspaceService");
const { Workspace } = require("../models");
const { HTTP_STATUS } = require("../constants/errorMessages");

const workspaceService = new WorkspaceService(Workspace);

router.get("/", async (req, res, next) => {
  try {
    const workspaces = await workspaceService.getAllWorkspaces();
    res.status(HTTP_STATUS.OK).json(workspaces);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const workspace = await workspaceService.getWorkspaceById(req.params.id);
    res.status(HTTP_STATUS.OK).json(workspace);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
