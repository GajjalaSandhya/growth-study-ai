import fs from "fs";
import Space from "../models/Space.js";
import Project from "../models/Project.js";
import Material from "../models/Material.js";
import MaterialChunk from "../models/MaterialChunk.js";

/**
 * @route   GET /api/spaces
 * @desc    Get all study spaces for current user
 * @access  Private
 */
export const getSpaces = async (req, res, next) => {
  try {
    const spaces = await Space.find({ userId: req.user._id }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: spaces.length,
      spaces,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/spaces
 * @desc    Create a new study space
 * @access  Private
 */
export const createSpace = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Space name is required",
      });
    }

    const space = await Space.create({
      userId: req.user._id,
      name: name.trim(),
      description: description ? description.trim() : "",
      icon: icon ? icon.trim() : "Folder",
    });

    res.status(201).json({
      success: true,
      message: "Space created successfully",
      space,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/spaces/:id
 * @desc    Get single space details (strictly user-isolated)
 * @access  Private
 */
export const getSpaceById = async (req, res, next) => {
  try {
    const space = await Space.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!space) {
      return res.status(404).json({
        success: false,
        message: "Space not found",
      });
    }

    res.status(200).json({
      success: true,
      space,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/spaces/:id
 * @desc    Update space details
 * @access  Private
 */
export const updateSpace = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;

    const space = await Space.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!space) {
      return res.status(404).json({
        success: false,
        message: "Space not found",
      });
    }

    if (name !== undefined) space.name = name.trim();
    if (description !== undefined) space.description = description.trim();
    if (icon !== undefined) space.icon = icon.trim();
    space.lastActivity = new Date();

    await space.save();

    res.status(200).json({
      success: true,
      message: "Space updated successfully",
      space,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/spaces/:id
 * @desc    Safely delete space and cascade delete all nested projects, materials & chunks
 * @access  Private
 */
export const deleteSpace = async (req, res, next) => {
  try {
    const space = await Space.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!space) {
      return res.status(404).json({
        success: false,
        message: "Space not found",
      });
    }

    // 1. Find all projects belonging to this space and user
    const projects = await Project.find({ spaceId: space._id, userId: req.user._id });
    const projectIds = projects.map((p) => p._id);

    // 2. Find all materials belonging to these projects and user
    if (projectIds.length > 0) {
      const materials = await Material.find({
        projectId: { $in: projectIds },
        userId: req.user._id,
      });

      // Delete physical PDF files from disk
      for (const mat of materials) {
        if (mat.filePath && fs.existsSync(mat.filePath)) {
          try {
            fs.unlinkSync(mat.filePath);
          } catch (unlinkErr) {
            // Log file deletion issue but proceed with DB cleanup
          }
        }
      }

      // Delete MaterialChunks belonging to these projects
      await MaterialChunk.deleteMany({ projectId: { $in: projectIds }, userId: req.user._id });

      // Delete materials from DB
      await Material.deleteMany({ _id: { $in: materials.map((m) => m._id) } });

      // Delete projects from DB
      await Project.deleteMany({ _id: { $in: projectIds } });
    }

    // 3. Delete space from DB
    await space.deleteOne();

    res.status(200).json({
      success: true,
      message: "Space and all associated projects, materials, and chunks deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
