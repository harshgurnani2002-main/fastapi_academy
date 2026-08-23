'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Folder, FolderOpen, FileCode, Play, CheckCircle2, 
  Terminal, Layers, Globe, Search, Copy, Check, ChevronRight, ChevronDown,
  Maximize2, Minimize2, RefreshCw, X, Send, Sun, Moon, ExternalLink,
  Sparkles, Download, Code2, MonitorPlay
} from 'lucide-react';
import { ProjectData } from '@/lib/content/projectsData';
import { CodeHighlighter } from './CodeHighlighter';

interface VSCodeStudioProps {
  projectData: ProjectData;
  zipUrl: string;
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children?: TreeNode[];
  language?: string;
  lineCount?: number;
}

export function VSCodeStudio({ projectData, zipUrl }: VSCodeStudioProps) {
  // Theme state: light or dark mode
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Navigation & View States
  const [activeSidebarTab, setActiveSidebarTab] = useState<'explorer' | 'api' | 'tests' | 'arch'>('explorer');
  const [activeFile, setActiveFile] = useState<string>(projectData.defaultFile || 'src/main.py');
  const [openTabs, setOpenTabs] = useState<string[]>([projectData.defaultFile || 'src/main.py']);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'src': true,
    'src/api': true,
    'src/api/v1': true,
    'src/core': true,
    'src/domain': true,
    'src/repositories': true,
    'src/schemas': true,
    'src/services': true,
    'src/db': true,
    'tests': true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Terminal & Panel States
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [bottomTab, setBottomTab] = useState<'terminal' | 'test-output' | 'server-logs'>('test-output');
  
  // Test Runner State
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testRunProgress, setTestRunProgress] = useState(100);
  const [testResults] = useState(projectData.tests || []);

  // API Playground State
  const [selectedEndpointIndex, setSelectedEndpointIndex] = useState(0);
  const [requestBodyText, setRequestBodyText] = useState(
    projectData.endpoints[0]?.requestBody ? JSON.stringify(projectData.endpoints[0].requestBody, null, 2) : ''
  );
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(
    projectData.endpoints[0] ? {
      status: projectData.endpoints[0].status,
      timeMs: 14,
      correlationId: 'req_8f3a1290b',
      headers: {
        'content-type': 'application/json',
        'x-correlation-id': 'req_8f3a1290b',
        'x-process-time': '14.22ms'
      },
      data: projectData.endpoints[0].responseBody
    } : null
  );

  // Update endpoint body when endpoint changes
  const activeEndpoint = projectData.endpoints[selectedEndpointIndex] || projectData.endpoints[0];
  useEffect(() => {
    if (activeEndpoint) {
      setRequestBodyText(activeEndpoint.requestBody ? JSON.stringify(activeEndpoint.requestBody, null, 2) : '');
      setLastResponse({
        status: activeEndpoint.status,
        timeMs: Math.floor(Math.random() * 15) + 8,
        correlationId: 'req_' + Math.random().toString(36).substring(2, 11),
        headers: {
          'content-type': 'application/json',
          'x-correlation-id': 'req_' + Math.random().toString(36).substring(2, 11),
          'x-process-time': `${(Math.random() * 12 + 4).toFixed(2)}ms`
        },
        data: activeEndpoint.responseBody
      });
    }
  }, [selectedEndpointIndex, activeEndpoint]);

  // Open a file tab
  const handleOpenFile = (path: string) => {
    if (!openTabs.includes(path)) {
      setOpenTabs([...openTabs, path]);
    }
    setActiveFile(path);
    if (activeSidebarTab === 'api') {
      setActiveSidebarTab('explorer');
    }
  };

  // Close a file tab
  const handleCloseTab = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t !== path);
    setOpenTabs(newTabs);
    if (activeFile === path && newTabs.length > 0) {
      setActiveFile(newTabs[newTabs.length - 1]);
    }
  };

  // Copy active file code
  const handleCopyCode = () => {
    const file = projectData.files[activeFile];
    if (file) {
      navigator.clipboard.writeText(file.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Toggle folder open/close
  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  // Run tests animation
  const handleRunTests = () => {
    setIsRunningTests(true);
    setTestRunProgress(0);
    setBottomTab('test-output');
    setShowBottomPanel(true);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setTestRunProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsRunningTests(false);
      }
    }, 80);
  };

  // Send API request in playground
  const handleSendApiRequest = () => {
    setIsSendingRequest(true);
    setTimeout(() => {
      const isPostOrPut = activeEndpoint.method === 'POST' || activeEndpoint.method === 'PUT';
      let parsedBody = null;
      let errorOccurred = false;

      if (isPostOrPut && requestBodyText.trim()) {
        try {
          parsedBody = JSON.parse(requestBodyText);
        } catch {
          errorOccurred = true;
        }
      }

      const randomLatency = Math.floor(Math.random() * 18) + 9;
      const cid = 'req_' + Math.random().toString(36).substring(2, 11);

      if (errorOccurred) {
        setLastResponse({
          status: 422,
          timeMs: 4,
          correlationId: cid,
          headers: {
            'content-type': 'application/json',
            'x-correlation-id': cid,
            'x-process-time': '4.10ms'
          },
          data: {
            success: false,
            error: {
              code: 'REQUEST_VALIDATION_ERROR',
              message: 'Invalid JSON payload provided in request body.',
              details: [{ location: 'body', message: 'JSON decode error' }]
            }
          }
        });
      } else {
        setLastResponse({
          status: activeEndpoint.status,
          timeMs: randomLatency,
          correlationId: cid,
          headers: {
            'content-type': 'application/json',
            'x-correlation-id': cid,
            'x-process-time': `${randomLatency.toFixed(2)}ms`
          },
          data: isPostOrPut && parsedBody ? {
            ...activeEndpoint.responseBody,
            data: {
              ...(activeEndpoint.responseBody?.data || {}),
              ...parsedBody
            }
          } : activeEndpoint.responseBody
        });
      }
      setIsSendingRequest(false);
    }, 350);
  };

  // Build File Tree structure
  const fileTree = useMemo(() => {
    const root: TreeNode = { name: 'root', path: '', isFolder: true, children: [] };

    Object.entries(projectData.files).forEach(([filePath, fileInfo]) => {
      if (searchQuery && !filePath.toLowerCase().includes(searchQuery.toLowerCase())) {
        return;
      }

      const parts = filePath.split('/');
      let current = root;

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        const currentPath = parts.slice(0, index + 1).join('/');

        if (!current.children) current.children = [];
        let existing = current.children.find(c => c.name === part);

        if (!existing) {
          existing = {
            name: part,
            path: currentPath,
            isFolder: !isFile,
            children: isFile ? undefined : [],
            language: isFile ? fileInfo.language : undefined,
            lineCount: isFile ? fileInfo.code.split('\n').length : undefined
          };
          current.children.push(existing);
        }
        current = existing;
      });
    });

    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => {
        if (a.isFolder === b.isFolder) return a.name.localeCompare(b.name);
        return a.isFolder ? -1 : 1;
      });
      nodes.forEach(n => {
        if (n.children) sortNodes(n.children);
      });
    };

    if (root.children) sortNodes(root.children);
    return root.children || [];
  }, [projectData.files, searchQuery]);

  // Helper for File Icon
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'py') return <span className="text-blue-500 font-bold text-xs font-mono">py</span>;
    if (ext === 'json') return <span className="text-yellow-500 font-bold text-xs font-mono">{'{}'}</span>;
    if (ext === 'toml' || ext === 'ini') return <span className="text-emerald-500 font-bold text-xs font-mono">⚙</span>;
    if (ext === 'md') return <span className="text-orange-500 font-bold text-xs font-mono">M↓</span>;
    if (ext === 'yml' || ext === 'yaml') return <span className="text-purple-500 font-bold text-xs font-mono">Y</span>;
    if (fileName.toLowerCase() === 'dockerfile') return <span className="text-cyan-500 font-bold text-xs font-mono">🐳</span>;
    if (ext === 'example' || fileName.startsWith('.env')) return <span className="text-slate-500 font-bold text-xs font-mono">env</span>;
    return <FileCode className="w-3.5 h-3.5 text-slate-400" />;
  };

  // Render tree item recursively
  const renderTree = (nodes: TreeNode[], depth = 0) => {
    return (
      <div className="space-y-0.5 select-none font-sans">
        {nodes.map(node => {
          if (node.isFolder) {
            const isExpanded = expandedFolders[node.path] ?? false;
            return (
              <div key={node.path}>
                <button
                  onClick={() => toggleFolder(node.path)}
                  style={{ paddingLeft: `${depth * 14 + 10}px` }}
                  className={`w-full flex items-center py-1.5 text-xs rounded transition-colors group ${
                    theme === 'dark' 
                      ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white' 
                      : 'text-slate-700 hover:bg-slate-200/70 hover:text-slate-900 font-medium'
                  }`}
                >
                  <span className={`mr-1.5 transition-transform ${theme === 'dark' ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </span>
                  <span className="text-orange-500 mr-1.5 shrink-0">
                    {isExpanded ? <FolderOpen className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
                  </span>
                  <span className="truncate">{node.name}</span>
                </button>
                {isExpanded && node.children && renderTree(node.children, depth + 1)}
              </div>
            );
          }

          const isSelected = activeFile === node.path;
          return (
            <button
              key={node.path}
              onClick={() => handleOpenFile(node.path)}
              style={{ paddingLeft: `${depth * 14 + 26}px` }}
              className={`w-full flex items-center justify-between py-1.5 text-xs rounded transition-all ${
                isSelected 
                  ? theme === 'dark'
                    ? 'bg-orange-500/20 text-orange-400 font-semibold border-l-2 border-orange-500 pl-[24px]'
                    : 'bg-orange-100 text-orange-800 font-bold border-l-2 border-orange-600 pl-[24px]'
                  : theme === 'dark'
                    ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <span className="shrink-0">{getFileIcon(node.name)}</span>
                <span className="truncate">{node.name}</span>
              </div>
              {node.lineCount && (
                <span className={`text-[10px] mr-2 shrink-0 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                  {node.lineCount}L
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const currentFileContent = projectData.files[activeFile]?.code || '# Select a file from the explorer';
  const currentLanguage = projectData.files[activeFile]?.language || 'python';
  const fileLines = currentFileContent.split('\n');

  // Colors based on theme
  const isDark = theme === 'dark';

  return (
    <div className={`flex flex-col rounded-2xl overflow-hidden border shadow-2xl transition-all duration-300 ${
      isDark ? 'bg-[#1e1e1e] border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
    } ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full h-[780px] my-6'}`}>
      
      {/* 1. VS Code Top Window Header */}
      <div className={`px-4 py-2.5 flex items-center justify-between select-none border-b transition-colors ${
        isDark ? 'bg-[#181818] border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        {/* Left Mac Window Dots + Breadcrumbs */}
        <div className="flex items-center space-x-4">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/90 border border-red-600"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/90 border border-yellow-600"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/90 border border-green-600"></div>
          </div>
          <div className={`hidden sm:flex items-center space-x-2 text-xs font-mono ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            <span className="text-orange-500 font-bold">{projectData.slug}</span>
            <span>›</span>
            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{activeFile}</span>
          </div>
        </div>

        {/* Center Title */}
        <div className={`text-xs font-bold tracking-wide flex items-center space-x-2 ${
          isDark ? 'text-slate-200' : 'text-slate-800'
        }`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>FastAPI Studio • Chapter {projectData.chapterId}</span>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* THEME TOGGLE */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              isDark 
                ? 'bg-slate-800 text-yellow-400 border-slate-700 hover:bg-slate-700' 
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-sm'
            }`}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Theme`}
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-yellow-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            <span className="text-[11px] hidden sm:inline">{isDark ? 'Light Theme' : 'Dark Theme'}</span>
          </button>

          {/* RUN PROJECT ON WEB (NEW TAB) */}
          <a
            href={`/projects/${projectData.slug}/run`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-orange-500/20 hover:scale-[1.02]"
            title="Run interactive project with live Swagger UI docs and API client in a new tab"
          >
            <MonitorPlay className="w-3.5 h-3.5 fill-white" />
            <span>Run on Web</span>
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
          </a>

          {/* RUN TESTS BUTTON */}
          <button
            onClick={handleRunTests}
            disabled={isRunningTests}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
              isDark 
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30' 
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
            }`}
          >
            {isRunningTests ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />}
            <span>Run Tests ({projectData.tests?.length || 0})</span>
          </button>

          {/* DOWNLOAD ZIP */}
          <a
            href={zipUrl}
            download
            className={`hidden md:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              isDark 
                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' 
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>.zip</span>
          </a>

          {/* FULLSCREEN */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Main Studio Workspace (Activity Bar + Sidebar + Editor) */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Leftmost Activity Bar */}
        <div className={`w-12 border-r flex flex-col items-center py-3 space-y-4 shrink-0 select-none transition-colors ${
          isDark ? 'bg-[#121212] border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setActiveSidebarTab('explorer')}
            title="File Explorer (Files & Folders)"
            className={`p-2.5 rounded-xl transition-all relative ${
              activeSidebarTab === 'explorer' 
                ? isDark 
                  ? 'text-orange-400 bg-slate-800/90 shadow-sm' 
                  : 'text-orange-600 bg-white shadow-sm border border-slate-200 font-bold'
                : isDark 
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
            }`}
          >
            <Folder className="w-5 h-5" />
            {activeSidebarTab === 'explorer' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-orange-500 rounded-r"></span>
            )}
          </button>

          <button
            onClick={() => setActiveSidebarTab('api')}
            title="Interactive API Playground (Send live requests)"
            className={`p-2.5 rounded-xl transition-all relative ${
              activeSidebarTab === 'api' 
                ? isDark 
                  ? 'text-orange-400 bg-slate-800/90 shadow-sm' 
                  : 'text-orange-600 bg-white shadow-sm border border-slate-200 font-bold'
                : isDark 
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
            }`}
          >
            <Globe className="w-5 h-5" />
            {activeSidebarTab === 'api' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-orange-500 rounded-r"></span>
            )}
          </button>

          <button
            onClick={() => setActiveSidebarTab('tests')}
            title="Pytest Test Suite Runner"
            className={`p-2.5 rounded-xl transition-all relative ${
              activeSidebarTab === 'tests' 
                ? isDark 
                  ? 'text-orange-400 bg-slate-800/90 shadow-sm' 
                  : 'text-orange-600 bg-white shadow-sm border border-slate-200 font-bold'
                : isDark 
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            {activeSidebarTab === 'tests' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-orange-500 rounded-r"></span>
            )}
          </button>

          <button
            onClick={() => setActiveSidebarTab('arch')}
            title="Clean Architecture Layer Map"
            className={`p-2.5 rounded-xl transition-all relative ${
              activeSidebarTab === 'arch' 
                ? isDark 
                  ? 'text-orange-400 bg-slate-800/90 shadow-sm' 
                  : 'text-orange-600 bg-white shadow-sm border border-slate-200 font-bold'
                : isDark 
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-5 h-5" />
            {activeSidebarTab === 'arch' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-orange-500 rounded-r"></span>
            )}
          </button>

          {/* Quick External Run Link */}
          <div className="pt-4 border-t border-slate-300/40 w-full flex flex-col items-center">
            <a
              href={`/projects/${projectData.slug}/run`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open Web Sandbox & Swagger Docs in New Tab"
              className={`p-2.5 rounded-xl transition-all ${
                isDark 
                  ? 'text-emerald-400 hover:bg-emerald-500/20' 
                  : 'text-emerald-600 hover:bg-emerald-100'
              }`}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Primary Sidebar Content */}
        <div className={`w-72 border-r flex flex-col shrink-0 overflow-hidden transition-colors ${
          isDark ? 'bg-[#181818] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          
          {/* TAB 1: File Explorer */}
          {activeSidebarTab === 'explorer' && (
            <div className="flex flex-col h-full">
              <div className={`px-3.5 py-2.5 border-b flex items-center justify-between ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <span className={`text-[11px] font-extrabold tracking-wider uppercase ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>Files & Structure</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                }`}>
                  {Object.keys(projectData.files).length} files
                </span>
              </div>

              {/* Search filter input */}
              <div className={`p-2 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
                <div className="relative flex items-center">
                  <Search className={`w-3.5 h-3.5 absolute left-2.5 pointer-events-none ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter files (e.g. users, main)..."
                    className={`w-full rounded-lg px-2 pl-8 py-1.5 text-xs focus:outline-none transition-colors border ${
                      isDark 
                        ? 'bg-[#121212] border-slate-700 text-slate-200 placeholder-slate-500 focus:border-orange-500' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-orange-500'
                    }`}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tree View */}
              <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                {renderTree(fileTree)}
              </div>
            </div>
          )}

          {/* TAB 2: Interactive API Playground */}
          {activeSidebarTab === 'api' && (
            <div className="flex flex-col h-full">
              <div className={`px-3.5 py-2.5 border-b flex items-center justify-between ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <span className={`text-[11px] font-extrabold tracking-wider uppercase ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>API Endpoints</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-600 px-1.5 py-0.5 rounded font-bold">
                  FastAPI 3.1
                </span>
              </div>

              <div className="p-2 border-b border-slate-200/50">
                <a
                  href={`/projects/${projectData.slug}/run`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-1.5 px-2.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 border border-orange-500/30 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Open Full Swagger Docs ↗
                </a>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
                {projectData.endpoints.map((ep, idx) => {
                  const isSelected = selectedEndpointIndex === idx;
                  const methodColors: Record<string, string> = {
                    GET: isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-300',
                    POST: isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-300',
                    PUT: isDark ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-orange-100 text-orange-700 border-orange-300',
                    DELETE: isDark ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-100 text-red-700 border-red-300',
                  };

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedEndpointIndex(idx)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                        isSelected 
                          ? isDark
                            ? 'bg-slate-800 border-orange-500/60 shadow-md ring-1 ring-orange-500/30'
                            : 'bg-white border-orange-500 shadow-md ring-1 ring-orange-500/30'
                          : isDark
                            ? 'bg-[#121212]/70 border-slate-800 hover:bg-slate-800/50 text-slate-400'
                            : 'bg-white/70 border-slate-200 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${methodColors[ep.method] || 'bg-slate-200 text-slate-700'}`}>
                          {ep.method}
                        </span>
                        <span className={`text-xs font-mono font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {ep.path}
                        </span>
                      </div>
                      <p className={`text-[11px] line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {ep.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Pytest Runner */}
          {activeSidebarTab === 'tests' && (
            <div className="flex flex-col h-full">
              <div className={`px-3.5 py-2.5 border-b flex items-center justify-between ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <span className={`text-[11px] font-extrabold tracking-wider uppercase ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>Pytest Test Suite</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-600 px-1.5 py-0.5 rounded font-bold">
                  {testResults.length} Tests
                </span>
              </div>

              <div className={`p-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  onClick={handleRunTests}
                  disabled={isRunningTests}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center space-x-2 transition-colors shadow-md shadow-emerald-600/20"
                >
                  {isRunningTests ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                  <span>{isRunningTests ? 'Executing Pytest...' : 'Run All Test Cases'}</span>
                </button>

                {isRunningTests && (
                  <div className={`w-full h-1.5 rounded-full mt-3 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-100" 
                      style={{ width: `${testRunProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
                {testResults.map((t, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border transition-colors ${
                      isDark ? 'bg-[#121212]/80 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className={`text-xs font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{t.name}</span>
                      </div>
                      <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.duration}</span>
                    </div>
                    <p className={`text-[11px] mt-1 pl-5.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.description}</p>
                    <span className={`text-[10px] font-mono mt-1 block pl-5.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t.file}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Clean Architecture Layer Map */}
          {activeSidebarTab === 'arch' && (
            <div className="flex flex-col h-full">
              <div className={`px-3.5 py-2.5 border-b flex items-center justify-between ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <span className={`text-[11px] font-extrabold tracking-wider uppercase ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>Clean Architecture</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-600 px-1.5 py-0.5 rounded font-bold">
                  Hexagonal
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
                <p className={`text-xs leading-relaxed mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Click any layer to jump straight to its code in the editor:
                </p>

                {[
                  { title: '1. ASGI Framework & Lifespan', path: 'src/main.py', color: 'text-orange-500', desc: 'App factory, middleware chain, lifespan' },
                  { title: '2. HTTP API Routers', path: 'src/api/v1/users.py', color: 'text-blue-500', desc: 'Endpoint handlers & request mapping' },
                  { title: '3. Dependency Injection', path: 'src/core/dependencies.py', color: 'text-purple-500', desc: 'Async session & service providers' },
                  { title: '4. Service Business Layer', path: 'src/services/user_service.py', color: 'text-emerald-500', desc: 'Pure business logic & transactions' },
                  { title: '5. Repository Pattern', path: 'src/repositories/user_repo.py', color: 'text-amber-500', desc: 'Data access abstraction layer' },
                  { title: '6. Domain Entities', path: 'src/domain/models.py', color: 'text-cyan-500', desc: 'Framework-independent models' },
                  { title: '7. Async Database / ORM', path: 'src/db/session.py', color: 'text-pink-500', desc: 'SQLAlchemy 2.0 async sessions' },
                ].map((layer, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOpenFile(layer.path)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all group ${
                      isDark 
                        ? 'bg-[#121212] border-slate-800 hover:border-orange-500/60' 
                        : 'bg-white border-slate-200 hover:border-orange-500 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${layer.color}`}>{layer.title}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-500 transition-transform" />
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{layer.desc}</p>
                    <span className={`text-[10px] font-mono mt-1.5 block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{layer.path}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Center: Editor Area OR Interactive Playground View */}
        <div className={`flex-1 flex flex-col overflow-hidden transition-colors ${
          isDark ? 'bg-[#1e1e1e]' : 'bg-white'
        }`}>
          
          {/* Active Tabs Bar */}
          <div className={`flex items-center border-b overflow-x-auto select-none scrollbar-none transition-colors ${
            isDark ? 'bg-[#181818] border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            {openTabs.map(tabPath => {
              const fileName = tabPath.split('/').pop() || tabPath;
              const isActive = activeFile === tabPath && activeSidebarTab !== 'api';

              return (
                <div
                  key={tabPath}
                  onClick={() => {
                    setActiveFile(tabPath);
                    if (activeSidebarTab === 'api') setActiveSidebarTab('explorer');
                  }}
                  className={`flex items-center space-x-2 px-3.5 py-2 text-xs border-r cursor-pointer transition-colors shrink-0 group ${
                    isActive 
                      ? isDark 
                        ? 'bg-[#1e1e1e] text-white border-t-2 border-t-orange-500 font-semibold' 
                        : 'bg-white text-slate-900 border-t-2 border-t-orange-600 font-bold shadow-sm'
                      : isDark 
                        ? 'text-slate-400 hover:bg-[#1f1f1f] hover:text-slate-200 border-slate-800' 
                        : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 border-slate-200'
                  }`}
                >
                  <span>{getFileIcon(fileName)}</span>
                  <span>{fileName}</span>
                  <button
                    onClick={(e) => handleCloseTab(e, tabPath)}
                    className="p-0.5 rounded text-slate-400 hover:text-red-500 hover:bg-slate-200/50"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            {/* Quick API Tester Tab */}
            <button
              onClick={() => setActiveSidebarTab('api')}
              className={`flex items-center space-x-1.5 px-3 py-2 text-xs border-r transition-colors shrink-0 ${
                activeSidebarTab === 'api' 
                  ? isDark 
                    ? 'bg-[#1e1e1e] text-orange-400 border-t-2 border-t-orange-500 font-bold' 
                    : 'bg-white text-orange-600 border-t-2 border-t-orange-600 font-bold shadow-sm'
                  : isDark 
                    ? 'text-slate-400 hover:bg-[#1f1f1f] hover:text-slate-200 border-slate-800' 
                    : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 border-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-orange-500" />
              <span>API Playground</span>
            </button>
          </div>

          {/* Editor Body or API Tester Screen */}
          {activeSidebarTab === 'api' ? (
            /* API Playground Screen */
            <div className={`flex-1 flex flex-col overflow-y-auto p-6 space-y-6 ${
              isDark ? 'bg-[#141414]' : 'bg-slate-50'
            }`}>
              
              {/* Endpoint Request Bar */}
              <div className={`border rounded-2xl p-5 shadow-lg space-y-4 ${
                isDark ? 'bg-[#1e1e1e] border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <span className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider text-center ${
                    activeEndpoint.method === 'POST' ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' :
                    activeEndpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-600 border border-blue-500/30' :
                    'bg-orange-500/20 text-orange-600 border border-orange-500/30'
                  }`}>
                    {activeEndpoint.method}
                  </span>
                  <div className={`flex-1 rounded-lg px-3.5 py-2 font-mono text-xs border ${
                    isDark ? 'bg-[#121212] border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                  }`}>
                    http://localhost:8000{activeEndpoint.path}
                  </div>
                  <button
                    onClick={handleSendApiRequest}
                    disabled={isSendingRequest}
                    className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-orange-500/20 shrink-0"
                  >
                    {isSendingRequest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Send Request</span>
                  </button>
                </div>

                {/* Request Payload Editor for POST/PUT */}
                {(activeEndpoint.method === 'POST' || activeEndpoint.method === 'PUT') && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={`text-[11px] font-bold uppercase tracking-wider ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        Request Body (JSON)
                      </label>
                      <span className="text-[10px] text-slate-400">application/json</span>
                    </div>
                    <textarea
                      value={requestBodyText}
                      onChange={(e) => setRequestBodyText(e.target.value)}
                      rows={5}
                      className={`w-full rounded-xl p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 border ${
                        isDark 
                          ? 'bg-[#121212] border-slate-700 text-emerald-400' 
                          : 'bg-slate-50 border-slate-300 text-emerald-700 font-semibold'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Response Viewer */}
              {lastResponse && (
                <div className={`border rounded-2xl overflow-hidden shadow-lg flex flex-col ${
                  isDark ? 'bg-[#1e1e1e] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className={`px-4 py-3 border-b flex items-center justify-between ${
                    isDark ? 'bg-[#181818] border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Response</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        lastResponse.status < 300 
                          ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' 
                          : 'bg-red-500/20 text-red-600 border border-red-500/30'
                      }`}>
                        {lastResponse.status} OK
                      </span>
                      <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>⚡ {lastResponse.timeMs}ms</span>
                    </div>
                    
                    <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      CID: {lastResponse.correlationId}
                    </span>
                  </div>

                  {/* Headers strip */}
                  <div className={`px-4 py-2 border-b flex flex-wrap gap-3 text-[11px] font-mono ${
                    isDark ? 'bg-[#141414] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <div>x-correlation-id: <span className="font-bold">{lastResponse.correlationId}</span></div>
                    <div>x-process-time: <span className="font-bold">{lastResponse.headers['x-process-time']}</span></div>
                    <div>content-type: <span className="font-bold">application/json</span></div>
                  </div>

                  {/* JSON Body formatted with CodeHighlighter */}
                  <div className="overflow-x-auto">
                    <CodeHighlighter 
                      code={JSON.stringify(lastResponse.data, null, 2)} 
                      language="json" 
                      theme={theme}
                      showLineNumbers={false}
                    />
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* Code Editor Screen */
            <div className="flex-1 flex flex-col overflow-hidden relative">
              
              {/* Code Breadcrumb & Copy Button */}
              <div className={`px-4 py-2 flex items-center justify-between border-b text-xs transition-colors ${
                isDark ? 'bg-[#181818]/80 border-slate-800 text-slate-400' : 'bg-slate-100/90 border-slate-200 text-slate-600'
              }`}>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-medium">{activeFile}</span>
                  <span className="text-[10px] opacity-60">•</span>
                  <span className="text-[11px] opacity-80">{fileLines.length} lines</span>
                  <span className="text-[10px] opacity-60">•</span>
                  <span className="text-[10px] uppercase font-bold text-orange-500">{currentLanguage}</span>
                </div>
                
                <button
                  onClick={handleCopyCode}
                  className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                    isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
                  }`}
                  title="Copy full code"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[11px]">{copiedCode ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              {/* Code View with Crystal-Clear Syntax Highlighting */}
              <div className="flex-1 overflow-auto">
                <CodeHighlighter
                  code={currentFileContent}
                  language={currentLanguage}
                  theme={theme}
                  showLineNumbers={true}
                />
              </div>
            </div>
          )}

          {/* 3. Bottom Integrated Terminal / Dock */}
          {showBottomPanel && (
            <div className={`h-48 border-t flex flex-col shrink-0 transition-colors ${
              isDark ? 'bg-[#141414] border-slate-800' : 'bg-slate-900 text-slate-100 border-slate-800'
            }`}>
              <div className="bg-slate-950 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between select-none">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setBottomTab('test-output')}
                    className={`text-xs font-bold pb-0.5 transition-colors ${
                      bottomTab === 'test-output' ? 'text-orange-400 border-b-2 border-orange-500' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    TEST RESULTS ({projectData.tests?.length || 0} PASSED)
                  </button>
                  <button
                    onClick={() => setBottomTab('terminal')}
                    className={`text-xs font-bold pb-0.5 transition-colors ${
                      bottomTab === 'terminal' ? 'text-orange-400 border-b-2 border-orange-500' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    TERMINAL (Uvicorn)
                  </button>
                  <button
                    onClick={() => setBottomTab('server-logs')}
                    className={`text-xs font-bold pb-0.5 transition-colors ${
                      bottomTab === 'server-logs' ? 'text-orange-400 border-b-2 border-orange-500' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    SERVER LOGS
                  </button>
                </div>

                <button
                  onClick={() => setShowBottomPanel(false)}
                  className="text-slate-400 hover:text-slate-200"
                  title="Close panel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 p-3.5 font-mono text-xs overflow-y-auto bg-[#0a0f1d] text-slate-200 leading-5">
                {bottomTab === 'test-output' && (
                  <div className="space-y-1">
                    <div className="text-slate-400">rootdir: /app/projects/{projectData.slug}</div>
                    <div className="text-slate-400">configfile: pyproject.toml • plugins: anyio, asyncio, pytest-asyncio</div>
                    <div className="text-slate-300 my-1">collecting {projectData.tests?.length || 0} items ...</div>
                    
                    {projectData.tests?.map((t, idx) => {
                      const pct = Math.round(((idx + 1) / (projectData.tests?.length || 1)) * 100);
                      return (
                        <div key={idx} className="text-emerald-400 flex items-center justify-between">
                          <span>{t.file}::{t.name} PASSED</span>
                          <span className="text-slate-500 font-bold">[{pct}%]</span>
                        </div>
                      );
                    })}

                    <div className="mt-2 text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/30 flex items-center justify-between">
                      <span>==================== {projectData.tests?.length || 0} passed in 0.85s ====================</span>
                      <span className="text-xs bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-black">100% PASS</span>
                    </div>
                  </div>
                )}

                {bottomTab === 'terminal' && (
                  <div className="space-y-1 text-slate-200">
                    <div><span className="text-emerald-400 font-bold">dev@fastapi-academy</span>:<span className="text-sky-400">~/{projectData.slug}</span>$ uvicorn src.main:app --reload --host 0.0.0.0 --port 8000</div>
                    <div className="text-slate-400">INFO:     Will watch for changes in: ['/app']</div>
                    <div className="text-slate-400">INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)</div>
                    <div className="text-slate-400">INFO:     Started reloader process [31248] using WatchFiles</div>
                    <div className="text-slate-400">INFO:     Started server process [31250]</div>
                    <div className="text-slate-400">INFO:     Waiting for application startup.</div>
                    <div className="text-emerald-400">INFO:     [system] Database connection pool initialized & tables ready.</div>
                    <div className="text-emerald-400 font-bold">INFO:     Application startup complete. OpenAPI specs ready at /docs</div>
                  </div>
                )}

                {bottomTab === 'server-logs' && (
                  <div className="space-y-1 font-mono text-xs">
                    <div className="text-slate-300">2026-08-22 01:45:01 | INFO     | [req_9a41c0] | src.api.v1.health:liveness_probe:17 - Liveness check executed</div>
                    <div className="text-emerald-400">2026-08-22 01:45:02 | INFO     | [req_9a41c0] | src.core.middleware:dispatch:24 - GET /api/v1/health 200 OK (0.84ms)</div>
                    <div className="text-slate-300">2026-08-22 01:45:10 | INFO     | [req_bf88e1] | src.services.user_service:create_user:22 - Created user alice (ID: 1)</div>
                    <div className="text-emerald-400">2026-08-22 01:45:10 | INFO     | [req_bf88e1] | src.core.middleware:dispatch:24 - POST /api/v1/users 201 Created (14.22ms)</div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* 4. VS Code Status Bar (Bottom) */}
      <div className="bg-[#007acc] text-white px-3 py-1 flex items-center justify-between text-[11px] select-none font-medium">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <span>⎇</span>
            <span>main</span>
          </span>
          <span className="flex items-center space-x-1">
            <span>✓</span>
            <span>{projectData.tests?.length || 0} Tests Passing</span>
          </span>
          <span className="hidden sm:inline">Hexagonal / Clean Architecture</span>
        </div>

        <div className="flex items-center space-x-4">
          <a 
            href={`/projects/${projectData.slug}/run`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline flex items-center space-x-1 text-yellow-300 font-bold"
          >
            <span>🚀 Run on Web</span>
          </a>
          <span>Python 3.12</span>
          <span>UTF-8</span>
          <a
            href={zipUrl}
            download
            className="hover:underline flex items-center space-x-1"
          >
            <span>📦</span>
            <span>.zip</span>
          </a>
        </div>
      </div>

    </div>
  );
}
