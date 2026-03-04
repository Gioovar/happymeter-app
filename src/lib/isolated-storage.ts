/**
 * src/lib/isolated-storage.ts
 * 
 * Helper utility to ensure LocalStorage keys are isolated per PWA context.
 * This prevents data intended for the OPS app from leaking or interfering with the RPS or Dashboard app,
 * solving the issue of shared domains mixing up states.
 */

type AppContext = 'ops' | 'rps' | 'main';

// Determine context based on the current window path
function getAppContext(): AppContext {
    if (typeof window === 'undefined') return 'main';
    const path = window.location.pathname;
    if (path.startsWith('/ops')) return 'ops';
    if (path.startsWith('/rps')) return 'rps';
    return 'main';
}

function getPrefix(): string {
    const context = getAppContext();
    if (context === 'main') return 'hm_';
    return `${context}_`;
}

export const isolatedStorage = {
    setItem: (key: string, value: string) => {
        if (typeof window === 'undefined') return;
        const prefixedKey = `${getPrefix()}${key}`;
        window.localStorage.setItem(prefixedKey, value);
    },

    getItem: (key: string): string | null => {
        if (typeof window === 'undefined') return null;
        const prefixedKey = `${getPrefix()}${key}`;
        return window.localStorage.getItem(prefixedKey);
    },

    removeItem: (key: string) => {
        if (typeof window === 'undefined') return;
        const prefixedKey = `${getPrefix()}${key}`;
        window.localStorage.removeItem(prefixedKey);
    },

    // Allows reading specific context keys if explicitly requested, but defaults to current context
    setItemWithExplicitContext: (context: AppContext, key: string, value: string) => {
        if (typeof window === 'undefined') return;
        const prefix = context === 'main' ? 'hm_' : `${context}_`;
        window.localStorage.setItem(`${prefix}${key}`, value);
    },

    getItemWithExplicitContext: (context: AppContext, key: string): string | null => {
        if (typeof window === 'undefined') return null;
        const prefix = context === 'main' ? 'hm_' : `${context}_`;
        return window.localStorage.getItem(`${prefix}${key}`);
    }
};
