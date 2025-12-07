import React, { useState, useEffect, useRef } from 'react';
import { useTelemetry, LogEntry } from '../utils/logger';
import { X, Minimize2, Maximize2, Trash2, Copy, Bug, ChevronRight, Activity } from 'lucide-react';

const TeleConsole: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const { logs, clearLogs } = useTelemetry();
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Only show in DEV or if manually enabled
    const shouldShow = import.meta.env.DEV || localStorage.getItem('ENABLE_TELEMETRY') === 'true';

    useEffect(() => {
        if (isOpen && !isMinimized) {
            logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, isOpen, isMinimized]);

    if (!shouldShow) return null;

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-[9999] bg-black/80 border border-violet-500/30 text-violet-400 p-2 rounded-full hover:bg-violet-900/20 hover:scale-105 transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] backdrop-blur-sm"
                title="TeleConsole"
            >
                <Activity size={24} />
            </button>
        );
    }

    if (isMinimized) {
        return (
            <div className="fixed bottom-4 right-4 z-[9999] w-64 bg-black/90 border border-zinc-800 rounded-lg shadow-2xl flex items-center justify-between p-3 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <Activity size={16} className="text-violet-500 animate-pulse" />
                    <span className="text-xs font-mono text-zinc-400">{logs.length} events captured</span>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => setIsMinimized(false)} className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white">
                        <Maximize2 size={14} />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-red-500/20 rounded text-zinc-400 hover:text-red-400">
                        <X size={14} />
                    </button>
                </div>
            </div>
        );
    }

    const copyLogs = () => {
        const logText = logs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.category}] ${l.message} ${l.data ? JSON.stringify(l.data) : ''}`).join('\n');
        navigator.clipboard.writeText(logText);
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'error': return 'text-red-400 bg-red-400/10 border-red-400/20';
            case 'warn': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'success': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
            default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-[9999] w-[500px] h-[400px] bg-black/95 border border-zinc-800 rounded-lg shadow-2xl flex flex-col backdrop-blur-md overflow-hidden font-mono text-sm">
            {/* Header */}
            <div className="h-10 border-b border-zinc-800 flex items-center justify-between px-3 bg-zinc-900/50">
                <div className="flex items-center gap-2">
                    <Bug size={16} className="text-violet-500" />
                    <span className="font-bold text-zinc-300">TeleConsole</span>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-500 border border-zinc-700">v1.0</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={copyLogs} className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors" title="Copy All">
                        <Copy size={14} />
                    </button>
                    <button onClick={clearLogs} className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors" title="Clear">
                        <Trash2 size={14} />
                    </button>
                    <div className="w-px h-4 bg-zinc-700 mx-1" />
                    <button onClick={() => setIsMinimized(true)} className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors">
                        <Minimize2 size={14} />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-red-500/20 rounded text-zinc-400 hover:text-red-400 transition-colors">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Logs Area */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent space-y-1">
                {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
                        <Activity size={32} className="opacity-20" />
                        <p className="text-xs">Ready to capture events...</p>
                    </div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className={`group flex items-start gap-2 p-1.5 rounded border border-transparent hover:border-zinc-800 hover:bg-zinc-900/50 transition-all ${log.level === 'error' ? 'bg-red-900/10' : ''}`}>
                            <span className="text-xs text-zinc-600 shrink-0 mt-0.5">{log.timestamp}</span>
                            <span className={`text-[10px] px-1.5 rounded border uppercase shrink-0 mt-0.5 ${getLevelColor(log.level)}`}>
                                {log.level}
                            </span>
                            <span className="text-zinc-500 text-xs shrink-0 select-none">[{log.category}]</span>
                            <div className="flex-1 min-w-0 break-all">
                                <span className={`${log.level === 'error' ? 'text-red-300' : 'text-zinc-300'}`}>{log.message}</span>
                                {log.data && (
                                    <details className="mt-1">
                                        <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-400 flex items-center gap-1 select-none">
                                            <ChevronRight size={10} /> Data Payload
                                        </summary>
                                        <pre className="mt-1 text-[10px] text-zinc-500 bg-zinc-950 p-2 rounded overflow-x-auto border border-zinc-900">
                                            {JSON.stringify(log.data, null, 2)}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={logsEndRef} />
            </div>

            {/* Footer input (Optional for future: allow executing commands) */}
            <div className="h-8 border-t border-zinc-800 bg-zinc-900/30 flex items-center px-2">
                <span className="text-zinc-600 mr-2">{'>'}</span>
                <input
                    type="text"
                    placeholder="Filter logs or execute command..."
                    className="bg-transparent border-none outline-none text-xs text-zinc-400 w-full placeholder-zinc-700"
                    disabled
                />
            </div>
        </div>
    );
};

export default TeleConsole;
