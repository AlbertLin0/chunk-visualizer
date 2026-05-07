'use client';

import type { MouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTextSplitter } from '../hooks/useTextSplitter';
import { fromMarkdown, getContentSize } from '../libs/markdown';
import type { TextSplitterConfig } from '../libs/splitters/types';
import Toast from './Toast';


interface ChunkVisualizerProps {
  text: string;
  splitterId: string;
  algorithm: string;
  config: TextSplitterConfig;
  showTokens?: boolean;
}

// 

function ChunkVisualizer({
  text,
  splitterId,
  algorithm,
  config,
  showTokens = false,
}: ChunkVisualizerProps) {
  // Use the new hook for text splitting
  const { chunks : autoChunks} = useTextSplitter({
    text,
    splitterId,
    algorithm,
    config,
  });
  const [chunks, setChunks] = useState<string[]>([]);
  useEffect(() => {
    setChunks(autoChunks);

  }, [autoChunks]);
  // Toast state for copy feedback
  const [toast, setToast] = useState<{
    message: string;
    visible: boolean;
  }>({ message: '', visible: false });

  // Selection tooltip state
  const [selection, setSelection] = useState<{
    text: string;
    x: number;
    y: number;
    range: Range;
  } | null>(null);
  const visualizationRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<'options' | 'none'>(
    'options',
  );
  // Tokenized chunks state
  const [tokenizedChunks, setTokenizedChunks] = useState<string[][]>([]);
  const [isTokenizing, setIsTokenizing] = useState(false);

  // Milvus related state
  const [isConnected, setIsConnected] = useState(false);
  const [milvusStatus, setMilvusStatus] = useState<string>('');
  const [collectionName, setCollectionName] = useState<string>('chunk_test');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Milvus API handlers
  const handleConnectMilvus = async () => {
    try {
      setMilvusStatus('Connecting to Milvus...');
      const response = await fetch('/api/milvus/conn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        }),
      });
      if (response.ok) {
        setIsConnected(true);
        setMilvusStatus('Connected to Milvus successfully!');
      } else {
        const error = await response.text();
        setMilvusStatus(`Connection failed: ${error}`);
      }
    } catch (error) {
      setMilvusStatus(`Connection failed: ${(error as Error).message}`);
      console.error('Milvus connection error:', error);
    }
  };

  const handleDeleteCollection = async () => {
    try {
      setMilvusStatus(`Deleting collection: ${collectionName}...`);
      const response = await fetch('/api/milvus/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionName }),
      });
      if (response.ok) {
        setMilvusStatus(`Collection ${collectionName} deleted successfully!`);
      } else {
        const error = await response.text();
        setMilvusStatus(`Delete failed: ${error}`);
      }
    } catch (error) {
      setMilvusStatus(`Delete failed: ${(error as Error).message}`);
      console.error('Delete collection error:', error);
    }
  };

  const handleCreateCollection = async () => {
    try {
      setMilvusStatus(`Creating collection: ${collectionName}...`);
      const response = await fetch('/api/milvus/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionName }),
      });
      if (response.ok) {
        setMilvusStatus(`Collection ${collectionName} created successfully!`);
      } else {
        const error = await response.text();
        setMilvusStatus(`Create failed: ${error}`);
      }
    } catch (error) {
      setMilvusStatus(`Create failed: ${(error as Error).message}`);
      console.error('Create collection error:', error);
    }
  };

  const handleInsertChunks = async () => {
    if (chunks.length === 0) {
      setMilvusStatus('No chunks to insert');
      return;
    }
    try {
      setMilvusStatus('Inserting chunks...');
      const response = await fetch('/api/milvus/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionName,
          data: chunks.map((text) => ({ text })),
        }),
      });
      if (response.ok) {
        setMilvusStatus(`Inserted ${chunks.length} chunks successfully!`);
      } else {
        const error = await response.text();
        setMilvusStatus(`Insert failed: ${error}`);
      }
    } catch (error) {
      setMilvusStatus(`Insert failed: ${(error as Error).message}`);
      console.error('Insert chunks error:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setMilvusStatus('Please enter a search query');
      return;
    }
    try {
      setIsLoading(true);
      setMilvusStatus('Searching...');
      const response = await fetch('/api/milvus/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionName, text: searchQuery }),
      });
      if (response.ok) {
        const result = await response.json();
        console.log(result);
        const formattedResults = result.result
          .map((item: any, index: number) => {
            const score = item.score || 0;
            const text = item.text || 'No text';
            return `${index + 1}. Score: ${score.toFixed(4)}\n${text}\n\n`;
          })
          .join('');
        setSearchResults(formattedResults || 'No results found');
        setMilvusStatus('Search completed!');
      } else {
        const error = await response.text();
        setMilvusStatus(`Search failed: ${error}`);
        setSearchResults('');
      }
    } catch (error) {
      setMilvusStatus(`Search failed: ${(error as Error).message}`);
      setSearchResults('');
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate colors for chunks
  const generateColors = (count: number): string[] => {
    const colors = [
      'bg-blue-200 text-black',
      'bg-green-200 text-black',
      'bg-yellow-200 text-black',
      'bg-pink-200 text-black',
      'bg-purple-200 text-black',
      'bg-indigo-200 text-black',
      'bg-red-200 text-black',
      'bg-orange-200 text-black',
      'bg-teal-200 text-black',
      'bg-cyan-200 text-black',
    ];

    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    return result;
  };

  const colors = generateColors(chunks.length);
  function getChunkIndex(node: Node): number | null {
    const el =
      node.nodeType === 3
        ? node.parentElement
        : (node as HTMLElement);

    const span = el?.closest("[data-index]");
    if (!span) return null;

    return Number(span.getAttribute("data-index"));
  }
  function isEmptyChunk(chunk: string): boolean {
  // 使用正则表达式检测是否只包含空白字符（空格、换行、制表符等）
  return /^\s*$/.test(chunk);
}
  function handleApplySelectionAsChunk() {
    if (!selection) return;

    const { range, text } = selection;

    const startIndex = getChunkIndex(range.startContainer);
    const endIndex = getChunkIndex(range.endContainer);

    if (startIndex == null || endIndex == null) return;

    const startOffset = range.startOffset;
    const endOffset = range.endOffset;
    let newChunks: string[];
    // 🧠 单 chunk
    if (startIndex === endIndex) {
      const chunk = chunks[startIndex];

      const before = chunk.slice(0, startOffset);
      const selected = chunk.slice(startOffset, endOffset);
      const after = chunk.slice(endOffset);

      newChunks = [
        ...chunks.slice(0, startIndex),
        ...(before ? [before] : []),
        selected,
        ...(after ? [after] : []),
        ...chunks.slice(startIndex + 1),
      ];
    } else {
      // 🔥 跨 chunk merge
      const startChunk = chunks[startIndex];
      const endChunk = chunks[endIndex];

      const before = startChunk.slice(0, startOffset);
      const after = endChunk.slice(endOffset);

      newChunks = [
      ...chunks.slice(0, startIndex),
      ...(before ? [before] : []),
      text, // ⭐ 新 chunk
      ...(after ? [after] : []),
      ...chunks.slice(endIndex + 1),
    ];
  }
  // 🧹 将空白 chunk 的内容合并到附近的 chunk 中
  const mergedChunks = mergeEmptyChunks(newChunks);

  setChunks(mergedChunks);
  setSelection(null);
}

// 辅助函数：将空白 chunk 的内容合并到相邻 chunk
function mergeEmptyChunks(chunks: string[]): string[] {
  if (chunks.length === 0) return [];

  const result: string[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    // 如果是空白 chunk
    if (isEmptyChunk(chunk)) {
      // 如果不是第一个，合并到前一个 chunk
      if (i > 0) {
        result[result.length - 1] += chunk;
      }
      // 如果是第一个且不是最后一个，合并到下一个 chunk
      else if (i < chunks.length - 1) {
        // 先记录下一个 chunk，后面会更新
        continue;
      }
      // 如果是唯一的 chunk，保留它
      else {
        result.push(chunk);
      }
    } else {
      // 如果前一个是空白 chunk，将当前 chunk 与前一个的空白内容合并
      if (i > 0 && isEmptyChunk(chunks[i - 1]) && result.length > 0) {
        result[result.length - 1] += chunk;
      } else {
        result.push(chunk);
      }
    }
  }
  
  return result;
}

  // Tokenize chunks when showTokens is enabled
  useEffect(() => {
    if (!showTokens || chunks.length === 0) {
      setTokenizedChunks([]);
      setIsTokenizing(false);
      return;
    }

    const tokenizeAllChunks = async () => {
      setIsTokenizing(true);
      const results: string[][] = [];
      for (const chunk of chunks) {
        const tokens = await tokenizeChunk(chunk);
        results.push(tokens);
      }
      setTokenizedChunks(results);
      setIsTokenizing(false);
    };

    tokenizeAllChunks();
  }, [showTokens, chunks]);

  // Tokenize a chunk of text using tiktoken
  const tokenizeChunk = async (chunk: string): Promise<string[]> => {
    try {
      // Dynamically import tiktoken to avoid loading WASM module on initial render
      const { get_encoding } = await import('tiktoken');
      const encoding = get_encoding('cl100k_base'); // GPT-4 encoding
      const tokenIds = encoding.encode(chunk);
      const tokenStrings: string[] = [];

      for (let i = 0; i < tokenIds.length; i++) {
        const decodedBytes = encoding.decode(new Uint32Array([tokenIds[i]]));
        const decoded = new TextDecoder().decode(decodedBytes);
        tokenStrings.push(decoded);
      }

      encoding.free();
      return tokenStrings;
    } catch (error) {
      console.error('Error tokenizing chunk:', error);
      // Fallback: return the chunk as a single token
      return [chunk];
    }
  };

  // Handle text selection
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setSelection(null);
      return;
    }

    const selectedText = selection.toString();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Use viewport coordinates for fixed positioning
    const x = rect.left + rect.width / 2;
    const y = rect.top - 10; // 10px above selection

    setSelection({
      text: selectedText,
      x,
      y,
      range,
    });
  };

  // Clear selection when clicking outside
  const handleMouseDown = (e: MouseEvent) => {
    // Check if clicking on the tooltip itself
    const target = e.target as HTMLElement;
    if (!target.closest('.selection-tooltip')) {
      setSelection(null);
    }
  };

  // Monitor for selection changes globally
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setSelection(null);
      }
    };

    // Listen for selection changes
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  // Auto disconnect when page is unloaded
  useEffect(() => {
    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      if (isConnected) {
        // Cancel the event to show confirmation dialog (optional)
        event.preventDefault();
        event.returnValue = '';

        // Try to disconnect
        try {
          await fetch('/api/milvus/disconn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true, // Important: allows request to complete even if page is unloading
          });
        } catch (error) {
          console.error('Failed to disconnect:', error);
        }
      }
    };

    const handleUnload = async () => {
      if (isConnected) {
        try {
          await fetch('/api/milvus/disconn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true, // Important: allows request to complete even if page is unloading
          });
        } catch (error) {
          console.error('Failed to disconnect:', error);
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      // Cleanup event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [isConnected]);

  // Handle copy chunks to clipboard
  const handleCopyChunks = async () => {
    try {
      const chunksJson = JSON.stringify(chunks, null, 2);
      await navigator.clipboard.writeText(chunksJson);

      setToast({ message: 'Chunks copied to clipboard!', visible: true });

      // Hide toast after 3 seconds
      setTimeout(() => {
        setToast({ message: '', visible: false });
      }, 3000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = JSON.stringify(chunks, null, 2);
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      setToast({ message: 'Chunks copied to clipboard!', visible: true });

      setTimeout(() => {
        setToast({ message: '', visible: false });
      }, 3000);
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Chunk Visualization */}
      <div
        ref={visualizationRef}
        className="flex-1 overflow-y-auto relative"
        onMouseUp={handleMouseUp}
        onMouseDown={handleMouseDown}
      >
        {/* Toolbar container - ALWAYS show when there are chunks */}
        {chunks.length > 0 && (
          <div className="absolute top-0 right-0 flex gap-1 p-1.5 z-10">
            {/* View Mode Button */}
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'none' ? 'options' : 'none')}
              className="p-1.5 bg-white/70 dark:bg-gray-700/70 border border-gray-300/70 dark:border-gray-600/70 text-gray-700 dark:text-gray-200 rounded hover:bg-white dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm"
              title={viewMode === 'none' ? 'Expand' : 'Minimize'}
            >          
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {viewMode === 'none' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                )}
              </svg>
            </button>

            {/* Copy Chunks Button */}
            <button
              type="button"
              onClick={handleCopyChunks}
              className="p-1.5 bg-white/70 dark:bg-gray-700/70 border border-gray-300/70 dark:border-gray-600/70 text-gray-700 dark:text-gray-200 rounded hover:bg-white dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm"
              title="Copy chunks as JSON array"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        )}

        {/* Full chunks content - show when viewMode is 'options' */}
        {chunks.length > 0 && viewMode === 'options' && (
          <div className="leading-relaxed text-sm font-mono pt-8">
            {isTokenizing && showTokens && (
              <div className="absolute top-12 right-12 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg">
                Tokenizing...
              </div>
            )}
            {chunks.map((chunk, index) => {
              if (showTokens && tokenizedChunks[index]) {
                const tokens = tokenizedChunks[index];
                return (
                  <span
                    key={`${index}`}
                    className={`${colors[index]}`}
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {tokens.map((token, tokenIndex) => (
                      <span
                        key={`${index}-${tokenIndex}`}
                        style={{
                          borderRight:
                            tokenIndex < tokens.length - 1
                              ? '1px solid rgba(0, 0, 0, 0.3)'
                              : 'none',
                          paddingRight:
                            tokenIndex < tokens.length - 1 ? '1px' : '0',
                          whiteSpace: 'pre-wrap',
                          backgroundColor:
                            tokenIndex % 2 === 0
                              ? 'rgba(0, 0, 0,  0.05)'
                              : 'rgba(255, 255, 255, 0.15)',
                        }}
                      >
                        {token}
                      </span>
                    ))}
                  </span>
                );
              }

              return (
                <span
                  key={`${index}`}
                  data-index={index}
                  className={`${colors[index]} px-1 py-0.5`}
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {chunk}
                </span>
              );
            })}
          </div>
        )}

        {/* Partial chunks content - show first 3 chunks when viewMode is 'none' */}
        {chunks.length > 0 && viewMode === 'none' && (
          <div className="leading-relaxed text-sm font-mono pt-8">
            {chunks.slice(0, 2).map((chunk, index) => (
              <span
                key={`${index}`}
                data-index={index}
                className={`${colors[index]} px-1 py-0.5`}
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {chunk}
              </span>
            ))}
            {/* Show indicator if there are more chunks */}
            {chunks.length > 2 && (
              <span className="text-gray-400 dark:text-gray-500 ml-2">
                ... and {chunks.length - 2} more chunks
              </span>
            )}
          </div>
        )}

        {/* Empty state when no chunks */}
        {chunks.length === 0 && (
          <div className="text-gray-400 dark:text-gray-500 text-center py-8">
            Enter some text to see the chunks visualization
          </div>
        )}

        {/* Selection Tooltip */}
        {selection && (
          <div
            className="selection-tooltip fixed z-50 bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded shadow-lg"
            style={{
              left: `${selection.x}px`,
              top: `${selection.y}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="whitespace-nowrap mb-1">
              {selection.text.length} chars (
              {getContentSize(fromMarkdown(selection.text))} content)
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => {
                  handleApplySelectionAsChunk();
                  setSelection(null);
                }}
                className="hover:bg-gray-700 px-2 py-1 rounded text-left"
              >
                ✂️ Create Chunk
              </button>
            </div>
            <div
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full"
              style={{
                width: 0,
                height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: '4px solid rgb(55 65 81)',
              }}
            />
          </div>
        )}
      </div>

      {/* Milvus Operations Panel */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Milvus Operations
        </h3>

        {/* Status */}
        <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          Status: {milvusStatus || 'Not connected'}
        </div>

        {/* Collection Name Input */}
        <div className="flex gap-2 mb-3">
          <label className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Collection:
          </label>
          <input
            type="text"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Enter collection name"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={handleConnectMilvus}
            disabled={isConnected}
            className={`px-3 py-1.5 text-xs rounded transition-all ${isConnected
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
          >
            {isConnected ? 'Connected' : 'Connect'}
          </button>
          <button
            onClick={handleDeleteCollection}
            disabled={!isConnected}
            className={`px-3 py-1.5 text-xs rounded transition-all ${!isConnected
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white'}`}
          >
            Delete Collection
          </button>
          <button
            onClick={handleCreateCollection}
            disabled={!isConnected}
            className={`px-3 py-1.5 text-xs rounded transition-all ${!isConnected
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white'}`}
          >
            Create Collection
          </button>
          <button
            onClick={handleInsertChunks}
            disabled={!isConnected || chunks.length === 0}
            className={`px-3 py-1.5 text-xs rounded transition-all ${!isConnected || chunks.length === 0
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
          >
            Insert {chunks.length} Chunks
          </button>
        </div>

        {/* Search Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Vector Search
          </h4>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Enter search query..."
            />
            <button
              onClick={handleSearch}
              disabled={!isConnected || !searchQuery.trim() || isLoading}
              className={`px-4 py-1.5 text-xs rounded transition-all ${!isConnected || !searchQuery.trim() || isLoading
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
          <textarea
            readOnly
            value={searchResults}
            className="w-full h-48 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono resize-none"
            placeholder="Search results will appear here..."
          />
        </div>
      </div>
    </div>
  );
}

export default ChunkVisualizer;