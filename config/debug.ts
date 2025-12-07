// config/debug.ts

/**
 * Feature Flags for Debugging
 * Toggle these to true/false to control console noise.
 */
export const DEBUG_FLAGS = {
    AUTH: true,      // Authentication flows
    API: true,       // API calls / Supabase interactions
    UI: false,       // UI rendering / Animations
    AI: true,        // AI Service calls
    WEBSOCKET: false // Realtime subscriptions
};

/**
 * Granular Logger
 * Usage: debugLog('AUTH', 'User logged in', user);
 */
export const debugLog = (feature: keyof typeof DEBUG_FLAGS, message: string, data?: any) => {
    if (DEBUG_FLAGS[feature]) {
        console.log(`[${feature}] ${message}`, data || '');
    }
};
