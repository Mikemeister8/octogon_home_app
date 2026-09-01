import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lrmqhoygbalfhvtxlmsk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxybXFob3lnYmFsZmh2dHhsbXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTUxNDcsImV4cCI6MjA4NzY5MTE0N30.4YB3r69G2GuOD5DvgHnZH-hEofShJe1LMbjiTpgGnek';

// supabase-js has no built-in request timeout. A hung network call — a
// wedged token refresh after the tab was hidden for hours, a flaky mobile
// handoff between wifi and data — leaves that request pending forever, and
// since every button's "loading" flag only clears in a try/finally around
// the await, a hang like that shows up as "I tapped it and it's just stuck
// thinking." This applies to every request the client makes (REST, Auth,
// Storage), so a hang anywhere becomes a normal rejected promise instead —
// which every call site already knows how to recover from — rather than an
// unbounded wait with no way out short of reloading the whole app.
// Exported so any outer timeout wrapped around a Supabase call (AppContext's
// withTimeout) can be derived from this instead of picking its own number —
// an outer timeout tighter than this one fires first on a request that was
// merely slow, not stuck, turning a would-have-succeeded save into an
// artificial failure. That's a bug on its own, not just lost protection.
export const REQUEST_TIMEOUT_MS = 15000;
const fetchWithTimeout: typeof fetch = (input, init = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    if (init.signal) {
        if (init.signal.aborted) controller.abort();
        else init.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
    return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
};

// (GoTrueClient already refreshes the token on tab visibility restore on its
// own — it registers that listener internally as long as autoRefreshToken is
// left at its default. Duplicating it here would just fight the library's
// own bookkeeping; the actual gap was that a hung request — including that
// very refresh — never timed out, which fetchWithTimeout above now fixes.)
export const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { fetch: fetchWithTimeout },
});
