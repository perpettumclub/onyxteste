import { useState, useEffect } from 'react';

// Event types
export type LogLevel = 'info' | 'warn' | 'error' | 'success';

export interface LogEntry {
    id: string;
    timestamp: string;
    level: LogLevel;
    category: string;
    message: string;
    data?: any;
}

// Custom Event for communication
const TELEMETRY_EVENT = 'telemetry-log';

class TelemetryLogger {
    private createEntry(level: LogLevel, category: string, message: string, data?: any): LogEntry {
        return {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            level,
            category,
            message,
            data
        };
    }

    private dispatch(entry: LogEntry) {
        // Only dispatch in development or if specifically enabled
        if (import.meta.env.DEV || localStorage.getItem('ENABLE_TELEMETRY') === 'true') {
            const event = new CustomEvent(TELEMETRY_EVENT, { detail: entry });
            window.dispatchEvent(event);

            // Also log to standard console for backup
            const style = 'color: #8b5cf6; font-weight: bold;'; // Violet color
            console.log(`%c[${entry.category}]`, style, entry.message, entry.data || '');
        }
    }

    log(category: string, message: string, data?: any) {
        this.dispatch(this.createEntry('info', category, message, data));
    }

    warn(category: string, message: string, data?: any) {
        this.dispatch(this.createEntry('warn', category, message, data));
    }

    error(category: string, message: string, error?: any) {
        this.dispatch(this.createEntry('error', category, message, error));
    }

    success(category: string, message: string, data?: any) {
        this.dispatch(this.createEntry('success', category, message, data));
    }
}

export const logger = new TelemetryLogger();

// Hook for the console component
export const useTelemetry = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);

    useEffect(() => {
        const handleLog = (event: Event) => {
            const customEvent = event as CustomEvent<LogEntry>;
            setLogs(prev => [...prev, customEvent.detail]);
        };

        window.addEventListener(TELEMETRY_EVENT, handleLog);
        return () => window.removeEventListener(TELEMETRY_EVENT, handleLog);
    }, []);

    const clearLogs = () => setLogs([]);

    return { logs, clearLogs };
};
