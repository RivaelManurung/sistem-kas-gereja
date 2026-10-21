import { router } from '@inertiajs/react';

/**
 * App-wide feedback for every mutating request (POST/PUT/PATCH/DELETE), so no
 * page has to wire its own loading state: the button that triggered the
 * request shows a spinner, a status pill appears, and validation failures
 * surface as a toast even when the failing field is not rendered on screen.
 */

const TRIGGER_WINDOW_MS = 1500;
const TOAST_MS = 6000;

let lastTrigger: { el: HTMLElement; at: number } | null = null;
let pendingEl: HTMLElement | null = null;
let statusEl: HTMLElement | null = null;
let toastTimer: number | undefined;

function remember(el: Element | null) {
    const target = el?.closest<HTMLElement>('button, [role="menuitem"], a');
    if (target) lastTrigger = { el: target, at: Date.now() };
}

function statusPill(): HTMLElement {
    if (statusEl) return statusEl;
    statusEl = document.createElement('div');
    statusEl.setAttribute('role', 'status');
    statusEl.setAttribute('aria-live', 'polite');
    statusEl.className = 'pending-status';
    document.body.appendChild(statusEl);
    return statusEl;
}

function showStatus(text: string, tone: 'busy' | 'error') {
    const el = statusPill();
    window.clearTimeout(toastTimer);
    el.dataset.tone = tone;
    el.textContent = text;
    el.dataset.visible = 'true';
    if (tone === 'error') toastTimer = window.setTimeout(hideStatus, TOAST_MS);
}

function hideStatus() {
    if (statusEl) statusEl.dataset.visible = 'false';
}

function busyLabel(method: string) {
    return method === 'delete' ? 'Sedang menghapus…' : 'Sedang memproses…';
}

export function installPendingActions() {
    document.addEventListener('click', (e) => remember(e.target as Element), true);
    document.addEventListener('submit', (e) => remember((e as SubmitEvent).submitter), true);

    router.on('start', (event) => {
        const { method } = event.detail.visit;
        if (method === 'get') return;

        document.documentElement.dataset.pending = 'busy';
        if (lastTrigger && Date.now() - lastTrigger.at < TRIGGER_WINDOW_MS && lastTrigger.el.isConnected) {
            pendingEl = lastTrigger.el;
            pendingEl.dataset.pending = 'true';
            pendingEl.setAttribute('aria-busy', 'true');
        }
        showStatus(busyLabel(method), 'busy');
    });

    router.on('finish', () => {
        delete document.documentElement.dataset.pending;
        if (pendingEl) {
            delete pendingEl.dataset.pending;
            pendingEl.removeAttribute('aria-busy');
            pendingEl = null;
        }
        if (statusEl?.dataset.tone === 'busy') hideStatus();
    });

    router.on('error', (event) => {
        const first = Object.values(event.detail.errors)[0];
        showStatus(first ? `Belum tersimpan: ${first}` : 'Belum tersimpan. Periksa kembali isian Anda.', 'error');
    });

    router.on('exception', () => {
        showStatus('Terjadi kesalahan pada server. Coba lagi beberapa saat lagi.', 'error');
    });
}
