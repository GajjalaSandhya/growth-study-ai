/**
 * Page-aware Document Chunking Service
 * Chunks page text into ~500-800 character segments with ~100 character overlap while preserving page boundaries.
 */
export const chunkDocument = (pages, documentName) => {
  const chunks = [];
  let globalChunkIndex = 1;

  const TARGET_CHUNK_SIZE = 600;
  const OVERLAP_SIZE = 100;

  for (const page of pages) {
    const pageNum = page.pageNumber || 1;
    const text = page.text ? page.text.trim() : "";

    if (!text) continue;

    // Short page: keep as single page-bounded chunk
    if (text.length <= 800) {
      chunks.push({
        chunkIndex: globalChunkIndex++,
        pageNumber: pageNum,
        documentName,
        text,
      });
      continue;
    }

    // Long page: split into overlapping chunks within page boundary
    let start = 0;
    while (start < text.length) {
      let end = start + TARGET_CHUNK_SIZE;

      if (end < text.length) {
        // Try to break at nearest space/word boundary
        const nextSpace = text.indexOf(" ", end);
        if (nextSpace !== -1 && nextSpace - end < 50) {
          end = nextSpace;
        }
      } else {
        end = text.length;
      }

      const chunkText = text.substring(start, end).trim();
      if (chunkText.length > 0) {
        chunks.push({
          chunkIndex: globalChunkIndex++,
          pageNumber: pageNum,
          documentName,
          text: chunkText,
        });
      }

      if (end >= text.length) break;

      start = end - OVERLAP_SIZE;
      if (start <= 0 || start >= text.length) break;
    }
  }

  return chunks;
};

export default chunkDocument;
