import fs from "fs";
import Material from "../models/Material.js";
import MaterialChunk from "../models/MaterialChunk.js";
import Project from "../models/Project.js";
import Space from "../models/Space.js";
import { processMaterial } from "../services/processingPipeline.js";
import { logActivity } from "../services/activityService.js";

/**
 * @route   GET /api/projects/:projectId/materials
 * @desc    Get all materials for a project (verifies project ownership)
 * @access  Private
 */
export const getProjectMaterials = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // 1. Verify project exists and belongs to req.user._id
    const project = await Project.findOne({
      _id: projectId,
      userId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or access denied",
      });
    }

    const materials = await Material.find({
      projectId: project._id,
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: materials.length,
      materials,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/projects/:projectId/materials/upload
 * @desc    Upload PDF study material for a project & queue asynchronous text extraction
 * @access  Private
 */
export const uploadMaterial = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // 1. Verify project exists and belongs to req.user._id
    const project = await Project.findOne({
      _id: projectId,
      userId: req.user._id,
    });

    if (!project) {
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {}
      }
      return res.status(404).json({
        success: false,
        message: "Project not found or access denied",
      });
    }

    const sizeMb = parseFloat((req.file.size / (1024 * 1024)).toFixed(2)) || 0.01;

    // 2. Create Material with status: "processing", progress: 0
    const material = await Material.create({
      userId: req.user._id,
      projectId: project._id,
      name: req.file.originalname,
      filePath: req.file.path,
      storedFilename: req.file.filename,
      sizeMb: Math.max(0.01, sizeMb),
      pages: 0,
      status: "processing",
      progress: 0,
      error: null,
    });

    // 3. Update Project.materialCount
    project.materialCount += 1;
    project.lastActivity = new Date();
    await project.save();

    // 4. Update parent Space.materials count
    const space = await Space.findOne({ _id: project.spaceId, userId: req.user._id });
    if (space) {
      space.materials += 1;
      space.lastActivity = new Date();
      await space.save();
    }

    // 5. Automatically log material_upload real activity
    await logActivity({
      userId: req.user._id,
      projectId: project._id,
      activityType: "material_upload",
      conceptId: "general",
      durationSeconds: 0,
      metadata: { materialId: material._id, fileName: material.name },
    });

    // 6. Trigger non-blocking asynchronous PDF processing
    processMaterial(material._id).catch((err) => {
      console.error(`[MaterialController] Background processing trigger error: ${err.message}`);
    });

    res.status(201).json({
      success: true,
      message: "PDF uploaded successfully. Processing queued.",
      material,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {}
    }
    next(error);
  }
};

/**
 * @route   DELETE /api/materials/:id
 * @desc    Delete material document, child MaterialChunks, and physical PDF file from disk
 * @access  Private
 */
export const deleteMaterial = async (req, res, next) => {
  try {
    const material = await Material.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }

    // Delete physical file from disk
    if (material.filePath && fs.existsSync(material.filePath)) {
      try {
        fs.unlinkSync(material.filePath);
      } catch (unlinkErr) {
        // Log error but continue
      }
    }

    // Delete associated MaterialChunks from DB
    await MaterialChunk.deleteMany({ materialId: material._id, userId: req.user._id });

    // Update parent project counters
    const project = await Project.findOne({ _id: material.projectId, userId: req.user._id });
    if (project) {
      project.materialCount = Math.max(0, project.materialCount - 1);
      project.lastActivity = new Date();
      await project.save();

      // Update space counters
      const space = await Space.findOne({ _id: project.spaceId, userId: req.user._id });
      if (space) {
        space.materials = Math.max(0, space.materials - 1);
        space.lastActivity = new Date();
        await space.save();
      }
    }

    // Delete material record
    await material.deleteOne();

    res.status(200).json({
      success: true,
      message: "Material and associated chunks deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/materials/:id/retry
 * @desc    Retry material processing (resets status & triggers processMaterial)
 * @access  Private
 */
export const retryMaterial = async (req, res, next) => {
  try {
    const material = await Material.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }

    material.status = "processing";
    material.progress = 0;
    material.error = null;
    await material.save();

    // Trigger non-blocking background re-processing
    processMaterial(material._id).catch((err) => {
      console.error(`[MaterialController] Background retry trigger error: ${err.message}`);
    });

    res.status(200).json({
      success: true,
      message: "Material retry processing queued",
      material,
    });
  } catch (error) {
    next(error);
  }
};
