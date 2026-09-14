import Material from "../models/Material.js";
import MaterialChunk from "../models/MaterialChunk.js";
import { extractPdfText } from "./pdfService.js";
import { chunkDocument } from "./chunkingService.js";
import { generateEmbedding } from "./embeddingService.js";
import logger from "../utils/logger.js";

// In-memory set tracking active processing operations to prevent concurrent duplicate processing
const activeProcessingSet = new Set();

/**
 * Asynchronous Material Processor
 * Handles PDF text extraction, page parsing, page-bounded chunking, vector embedding generation, and MaterialChunk storage.
 */
export const processMaterial = async (materialId) => {
  const matIdStr = materialId.toString();

  // 1. Prevent concurrent processing of the same material
  if (activeProcessingSet.has(matIdStr)) {
    logger.info(
      `[ProcessingPipeline] Material ${matIdStr} is already actively processing. Skipping duplicate execution.`,
    );
    return;
  }

  activeProcessingSet.add(matIdStr);

  try {
    // 2. Fetch Material & verify existence
    const material = await Material.findById(materialId);
    if (!material) {
      logger.warn(`[ProcessingPipeline] Material ${matIdStr} not found.`);
      activeProcessingSet.delete(matIdStr);
      return;
    }

    logger.info(
      `[ProcessingPipeline] Starting processing for Material: ${material.name} (${matIdStr})`,
    );

    // 3. Set status: "processing", progress: 20
    material.status = "processing";
    material.progress = 20;
    material.error = null;
    await material.save();

    // 4. Extract PDF Text & Page Boundaries
    const { totalPages, pages, totalTextLength } = await extractPdfText(material.filePath);

    // Update progress to 50%
    material.pages = totalPages;
    material.progress = 50;
    await material.save();

    // 5. Handle scanned / image-only / no-text PDFs
    if (totalTextLength < 20) {
      material.status = "failed";
      material.progress = 50;
      material.error =
        "No extractable text found in PDF document. Document may be scanned or image-only.";
      await material.save();
      logger.warn(
        `[ProcessingPipeline] Failed processing for ${matIdStr}: No extractable text found.`,
      );
      activeProcessingSet.delete(matIdStr);
      return;
    }

    // 6. Generate Page-Bounded Text Chunks
    const rawChunks = chunkDocument(pages, material.name);

    if (rawChunks.length === 0) {
      material.status = "failed";
      material.progress = 50;
      material.error = "Failed to generate text chunks from extracted PDF content.";
      await material.save();
      logger.warn(`[ProcessingPipeline] Failed processing for ${matIdStr}: Zero chunks generated.`);
      activeProcessingSet.delete(matIdStr);
      return;
    }

    // 7. Generate Vector Embeddings for Chunks
    const chunkDocuments = [];
    for (const chunk of rawChunks) {
      const embedding = await generateEmbedding(chunk.text);
      chunkDocuments.push({
        userId: material.userId,
        projectId: material.projectId,
        materialId: material._id,
        chunkIndex: chunk.chunkIndex,
        pageNumber: chunk.pageNumber,
        documentName: chunk.documentName,
        text: chunk.text,
        embedding,
      });
    }

    // 8. Safely remove any existing chunks for this material (handles retry cleanly)
    await MaterialChunk.deleteMany({ materialId: material._id });

    // 9. Store MaterialChunk documents in MongoDB
    await MaterialChunk.insertMany(chunkDocuments);

    // 10. Mark Material as ready with progress = 100
    material.status = "ready";
    material.progress = 100;
    material.error = null;
    await material.save();

    logger.info(
      `[ProcessingPipeline] Material ${matIdStr} successfully processed (${totalPages} pages, ${chunkDocuments.length} chunks with vector embeddings).`,
    );
  } catch (error) {
    logger.error(
      `[ProcessingPipeline] Processing error for Material ${matIdStr}: ${error.message}`,
    );
    try {
      const mat = await Material.findById(materialId);
      if (mat) {
        mat.status = "failed";
        mat.progress = mat.progress > 0 ? mat.progress : 0;
        mat.error = error.message || "An unexpected error occurred during PDF processing";
        await mat.save();
      }
    } catch (saveErr) {
      logger.error(
        `[ProcessingPipeline] Failed to update error status for ${matIdStr}: ${saveErr.message}`,
      );
    }
  } finally {
    activeProcessingSet.delete(matIdStr);
  }
};

/**
 * Recovery sweeper run on server startup
 * Resets any materials left stuck in "processing" state due to unexpected server restarts.
 */
export const recoverStalledProcessingJobs = async () => {
  try {
    const stalledMaterials = await Material.find({ status: "processing" });
    if (stalledMaterials.length > 0) {
      logger.info(
        `[ProcessingPipeline] Found ${stalledMaterials.length} stalled material(s) in processing state. Resetting status...`,
      );
      for (const mat of stalledMaterials) {
        mat.status = "failed";
        mat.error = "Processing interrupted by server restart. Please retry upload or re-process.";
        await mat.save();
      }
    }
  } catch (err) {
    logger.error(`[ProcessingPipeline] Stalled job recovery failed: ${err.message}`);
  }
};

export default processMaterial;
