import React, { useState, useEffect } from 'react';
import { FolderOpen, File, Plus, RefreshCw, Save, Upload, X } from 'lucide-react';

interface WorkspaceFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: WorkspaceFile[];
}

interface Workspace {
  id: string;
  name: string;
  files: WorkspaceFile[];
  lastSync?: string;
}

export const WorkspaceManager: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // Initialize default workspace
  useEffect(() => {
    const savedWorkspaces = localStorage.getItem('crew7_workspaces');
    if (savedWorkspaces) {
      const parsed = JSON.parse(savedWorkspaces);
      setWorkspaces(parsed);
      setActiveWorkspace(parsed[0] || null);
    } else {
      const defaultWorkspace: Workspace = {
        id: 'default',
        name: 'My Workspace',
        files: [
          {
            id: 'welcome',
            name: 'welcome.md',
            type: 'file',
            content: '# Welcome to ZYNIQ CREW7\n\nYour collaborative AI workspace is ready!\n\n## Getting Started\n\n1. Upload files or create new ones\n2. Organize your project structure\n3. Collaborate with AI agents\n\nHappy coding! 🚀'
          }
        ],
        lastSync: new Date().toISOString()
      };
      setWorkspaces([defaultWorkspace]);
      setActiveWorkspace(defaultWorkspace);
      localStorage.setItem('crew7_workspaces', JSON.stringify([defaultWorkspace]));
    }
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    // Simulate sync delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (activeWorkspace) {
      const updatedWorkspace = {
        ...activeWorkspace,
        lastSync: new Date().toISOString()
      };
      const updatedWorkspaces = workspaces.map(w => 
        w.id === activeWorkspace.id ? updatedWorkspace : w
      );
      setWorkspaces(updatedWorkspaces);
      setActiveWorkspace(updatedWorkspace);
      localStorage.setItem('crew7_workspaces', JSON.stringify(updatedWorkspaces));
    }
    
    setIsSyncing(false);
  };

  const handleCreateFile = () => {
    if (!newFileName.trim() || !activeWorkspace) return;
    
    const newFile: WorkspaceFile = {
      id: Date.now().toString(),
      name: newFileName,
      type: 'file',
      content: ''
    };
    
    const updatedWorkspace = {
      ...activeWorkspace,
      files: [...activeWorkspace.files, newFile]
    };
    
    const updatedWorkspaces = workspaces.map(w => 
      w.id === activeWorkspace.id ? updatedWorkspace : w
    );
    
    setWorkspaces(updatedWorkspaces);
    setActiveWorkspace(updatedWorkspace);
    localStorage.setItem('crew7_workspaces', JSON.stringify(updatedWorkspaces));
    setNewFileName('');
    setShowNewFileDialog(false);
  };

  const renderFileTree = (files: WorkspaceFile[]) => {
    return files.map(file => (
      <div key={file.id} className="pl-4 py-1.5 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group">
        <div className="flex items-center gap-2">
          {file.type === 'folder' ? (
            <FolderOpen className="w-4 h-4 text-[#ea2323]" />
          ) : (
            <File className="w-4 h-4 text-white/60" />
          )}
          <span className="text-sm text-white/90">{file.name}</span>
        </div>
        {file.children && (
          <div className="ml-2 border-l border-white/10">
            {renderFileTree(file.children)}
          </div>
        )}
      </div>
    ));
  };

  if (!activeWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#0a0a0a]">
      {/* File Tree Sidebar */}
      <div className="w-80 border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">{activeWorkspace.name}</h3>
            <button
              onClick={() => setShowNewFileDialog(true)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title="New File"
            >
              <Plus className="w-4 h-4 text-white/80" />
            </button>
          </div>
          
          {/* Sync Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 disabled:bg-white/5 rounded-lg transition-colors text-xs font-medium text-white/90"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync'}
            </button>
            <button
              onClick={handleSync}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              title="Save"
            >
              <Save className="w-3.5 h-3.5 text-white/80" />
            </button>
          </div>
          
          {activeWorkspace.lastSync && (
            <p className="text-xs text-white/40 mt-2">
              Last sync: {new Date(activeWorkspace.lastSync).toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* File Tree */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {renderFileTree(activeWorkspace.files)}
          </div>
        </div>

        {/* Upload Button */}
        <div className="p-4 border-t border-white/10">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm font-medium text-white/90">
            <Upload className="w-4 h-4" />
            Upload Files
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-gradient-to-br from-[#ea2323] to-[#ff2e2e] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Your Workspace is Ready</h3>
            <p className="text-white/60 mb-6">
              Create files, organize your project, and collaborate with AI agents in your personal workspace.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowNewFileDialog(true)}
                className="px-6 py-2.5 bg-[#ea2323] hover:bg-[#ff2e2e] rounded-xl text-sm font-semibold text-white transition-colors"
              >
                Create File
              </button>
              <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold text-white/90 transition-colors">
                Upload Files
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New File Dialog */}
      {showNewFileDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Create New File</h3>
              <button
                onClick={() => {
                  setShowNewFileDialog(false);
                  setNewFileName('');
                }}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFile()}
              placeholder="Enter filename..."
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#ea2323]/50 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNewFileDialog(false);
                  setNewFileName('');
                }}
                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold text-white/90 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFile}
                disabled={!newFileName.trim()}
                className="flex-1 px-4 py-2.5 bg-[#ea2323] hover:bg-[#ff2e2e] disabled:bg-white/5 disabled:text-white/40 rounded-xl text-sm font-semibold text-white transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
