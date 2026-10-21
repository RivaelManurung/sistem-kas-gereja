import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { route as routeFn } from 'ziggy-js';
import { initializeTheme } from './hooks/use-appearance';
import { installPendingActions } from './lib/pending-actions';

declare global {
    const route: typeof routeFn;
    interface Window {
        __brand?: { name: string };
    }
}

const appName = window.__brand?.name || 'Kas Gereja';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#d4a03a',
        delay: 150,
    },
});

// This will set light / dark mode on load...
initializeTheme();
installPendingActions();
