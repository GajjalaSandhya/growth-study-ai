import fs from "fs";
import Project from "../models/Project.js";
import Space from "../models/Space.js";
import Material from "../models/Material.js";
import MaterialChunk from "../models/MaterialChunk.js";

/**
 * @route   GET /api/projects
 * @desc    Get all projects for current user (optional filter ?spaceId=...)
 * @access  Private
 */
export const getProjects = async (req, res, next) => {
  try {
    const query = { userId: req.user._id };

    if (req.query.spaceId) {
      query.spaceId = req.query.spaceId;
    }

    const projects = await Project.find(query).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/projects
 * @desc    Create a new project (verifies spaceId ownership)
 * @access  Private
 */
export const createProject = async (req, res, next) => {
  try {
    const { spaceId, name, description, subject, status } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Project name is required",
      });
    }

    if (!spaceId) {
      return res.status(400).json({
        success: false,
        message: "Space ID (spaceId) is required",
      });
    }

    // 1. Verify parent space exists and belongs to req.user._id
    const parentSpace = await Space.findOne({
      _id: spaceId,
      userId: req.user._id,
    });

    if (!parentSpace) {
      return res.status(404).json({
        success: false,
        message: "Parent Space not found or access denied",
      });
    }

    // 2. Create Project
    const project = await Project.create({
      userId: req.user._id,
      spaceId: parentSpace._id,
      name: name.trim(),
      description: description ? description.trim() : "",
      subject: subject ? subject.trim() : "General",
      status:
        status && ["in-progress", "completed", "needs-review"].includes(status)
          ? status
          : "in-progress",
    });

    // 3. Increment Space.projectCount
    parentSpace.projectCount += 1;
    parentSpace.lastActivity = new Date();
    await parentSpace.save();

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/projects/:id
 * @desc    Get single project details (strictly user-isolated)
 * @access  Private
 */
export const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project details
 * @access  Private
 */
export const updateProject = async (req, res, next) => {
  try {
    const { name, description, subject, status } = req.body;

    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (name !== undefined) project.name = name.trim();
    if (description !== undefined) project.description = description.trim();
    if (subject !== undefined) project.subject = subject.trim();
    if (status !== undefined && ["in-progress", "completed", "needs-review"].includes(status)) {
      project.status = status;
    }
    project.lastActivity = new Date();

    await project.save();

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/projects/:id
 * @desc    Safely delete project and cascade delete all nested materials, chunks & PDF files
 * @access  Private
 */
export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // 1. Find all materials belonging to this project and user
    const materials = await Material.find({
      projectId: project._id,
      userId: req.user._id,
    });

    // Delete physical PDF files from disk
    for (const mat of materials) {
      if (mat.filePath && fs.existsSync(mat.filePath)) {
        try {
          fs.unlinkSync(mat.filePath);
        } catch (unlinkErr) {
          // Log file deletion error but continue
        }
      }
    }

    // Delete MaterialChunks belonging to this project
    await MaterialChunk.deleteMany({ projectId: project._id, userId: req.user._id });

    // Delete materials from DB
    await Material.deleteMany({ projectId: project._id, userId: req.user._id });

    // 2. Decrement counters on parent Space if it exists
    const space = await Space.findOne({ _id: project.spaceId, userId: req.user._id });
    if (space) {
      space.projectCount = Math.max(0, space.projectCount - 1);
      space.materials = Math.max(0, space.materials - materials.length);
      space.lastActivity = new Date();
      await space.save();
    }

    // 3. Delete Project
    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: "Project and associated materials and chunks deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
