import packageJson from '../../../package.json';
import { chunkSizeOptions } from './options';
import type { ConfigOption, TextSplitter, TextSplitterConfig } from './types';

/**
 * Manual text splitter implementation
 * Supports adding and removing chunks manually
 */
export class ManualSplitter implements TextSplitter {
  readonly id = 'manual';
  readonly name = 'Manual';
  readonly version = '1.0.0';
  readonly algorithms = ['manual'] as const;

  splitText(text: string, config: TextSplitterConfig): string[] {
    const { chunkSize = 200 } = config;
    
    // Simple chunking by chunkSize for initial split
    const chunks: string[] = [];
    let currentIndex = 0;
    
    while (currentIndex < text.length) {
      const endIndex = Math.min(currentIndex + chunkSize, text.length);
      // Try to split at whitespace for better chunking
      const whitespaceIndex = text.lastIndexOf(' ', endIndex);
      const splitIndex = whitespaceIndex > currentIndex ? whitespaceIndex : endIndex;
      
      chunks.push(text.substring(currentIndex, splitIndex).trim());
      currentIndex = splitIndex + 1;
    }
    
    return chunks;
  }

  getAlgorithmConfig(): ConfigOption[] {
    return [chunkSizeOptions];
  }

  addChunk(text: string, selectedText: string, existingChunks: string[]): string[] {
    if (!selectedText.trim()) return existingChunks;
    
    // Find where the selected text is in the original text
    const selectedIndex = text.indexOf(selectedText);
    if (selectedIndex === -1) return existingChunks;
    
    // Create new chunks: before selection, selected text, after selection
    const newChunks: string[] = [];
    let lastEnd = 0;
    
    for (const chunk of existingChunks) {
      const chunkIndex = text.indexOf(chunk, lastEnd);
      if (chunkIndex === -1) continue;
      
      const chunkEnd = chunkIndex + chunk.length;
      
      // If chunk is before selection
      if (chunkEnd <= selectedIndex) {
        newChunks.push(chunk);
      }
      // If chunk contains selection
      else if (chunkIndex < selectedIndex && chunkEnd > selectedIndex) {
        // Add part before selection
        const partBefore = text.substring(chunkIndex, selectedIndex).trim();
        if (partBefore) newChunks.push(partBefore);
        // Add selected text as new chunk
        newChunks.push(selectedText.trim());
        // Add part after selection
        const partAfter = text.substring(selectedIndex + selectedText.length, chunkEnd).trim();
        if (partAfter) newChunks.push(partAfter);
      }
      // If chunk is after selection
      else if (chunkIndex >= selectedIndex + selectedText.length) {
        newChunks.push(chunk);
      }
      
      lastEnd = chunkEnd;
    }
    
    // If no existing chunks, just add the selected text
    if (newChunks.length === 0) {
      newChunks.push(selectedText.trim());
    }
    
    return newChunks;
  }

  removeChunk(text: string, selectedText: string, existingChunks: string[]): string[] {
    if (!selectedText.trim()) return existingChunks;
    
    // Remove chunks that contain the selected text
    return existingChunks.filter(chunk => !chunk.includes(selectedText.trim()));
  }
}