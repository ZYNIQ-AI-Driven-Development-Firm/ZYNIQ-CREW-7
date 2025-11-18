import React, { useState } from 'react';

export type FileNode = {
  path: string;
  name: string;
  type: 'file' | 'folder';
  language?: string;
  children?: FileNode[];
};

type FileTreePanelProps = {
  files: FileNode[];
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
};

const FILE_ICONS: Record<string, string> = {
  py: '🐍',
  ts: '📘',
  tsx: '⚛️',
  js: '📜',
  jsx: '⚛️',
  json: '📋',
  md: '📝',
  css: '🎨',
  html: '🌐',
  sql: '🗄️',
  yml: '⚙️',
  yaml: '⚙️',
  default: '📄',
};

const FOLDER_COLORS: Record<string, string> = {
  backend: '#3b82f6',
  frontend: '#a78bfa',
  tests: '#4cf5a1',
  infra: '#f59e0b',
  docs: '#8d96b3',
  default: '#64748b',
};

const getFileIcon = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return FILE_ICONS[ext] || FILE_ICONS.default;
};

const getFolderColor = (folderName: string): string => {
  const name = folderName.toLowerCase();
  return FOLDER_COLORS[name] || FOLDER_COLORS.default;
};

type FileTreeNodeProps = {
  node: FileNode;
  level: number;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
};

const FileTreeNode: React.FC<FileTreeNodeProps> = ({ node, level, selectedFile, onSelectFile }) => {
  const [isExpanded, setIsExpanded] = useState(level === 0);

  const handleClick = () => {
    if (node.type === 'folder') {
      setIsExpanded(!isExpanded);
    } else {
      onSelectFile(node.path);
    }
  };

  const isSelected = selectedFile === node.path;
  const folderColor = node.type === 'folder' ? getFolderColor(node.name) : undefined;

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${
          isSelected
            ? 'bg-[#E5484D]/20 border-l-2 border-[#E5484D]'
            : 'hover:bg-white/5'
        }`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        {node.type === 'folder' && (
          <svg
            className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            style={{ color: folderColor }}
          >
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        )}
        
        <span className="text-sm">
          {node.type === 'folder' ? (
            <span style={{ color: folderColor }}>
              {isExpanded ? '📂' : '📁'}
            </span>
          ) : (
            getFileIcon(node.name)
          )}
        </span>
        
        <span className={`text-sm ${isSelected ? 'text-white font-semibold' : 'text-[#8d96b3]'}`}>
          {node.name}
        </span>
        
        {node.type === 'folder' && node.children && (
          <span className="ml-auto text-xs text-[#64748b]">
            {node.children.length}
          </span>
        )}
      </button>

      {node.type === 'folder' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTreePanel: React.FC<FileTreePanelProps> = ({ files, selectedFile, onSelectFile }) => {
  if (files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center border-r border-white/10 bg-[#0a0f16] p-4">
        <div className="text-center">
          <div className="text-4xl mb-2">📁</div>
          <p className="text-sm text-[#8d96b3]">No artifacts available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-64 border-r border-white/10 bg-[#0a0f16] overflow-y-auto">
      <div className="sticky top-0 border-b border-white/10 bg-[#0d141c] px-3 py-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#8d96b3]">
          File Explorer
        </h3>
      </div>
      
      <div className="py-2">
        {files.map((node) => (
          <FileTreeNode
            key={node.path}
            node={node}
            level={0}
            selectedFile={selectedFile}
            onSelectFile={onSelectFile}
          />
        ))}
      </div>
    </div>
  );
};
