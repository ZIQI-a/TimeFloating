export function formatStopwatch(ms, showMs = true) {
    const totalMs = Number.isFinite(ms) ? Math.max(0, ms) : 0;
    const totalSec = Math.floor(totalMs / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    const centiseconds = Math.floor((totalMs % 1000) / 100);

    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    const base = hours > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;

    return showMs ? `${base}.${centiseconds}` : base;
}

export function formatCountdown({
    hours = 0,
    minutes = 0,
    seconds = 0,
    ms = 0,
    showMs = false,
    forceHours = false,
} = {}) {
    const hh = String(Math.max(0, hours)).padStart(2, "0");
    const mm = String(Math.max(0, minutes)).padStart(2, "0");
    const ss = String(Math.max(0, seconds)).padStart(2, "0");
    const centiseconds = Math.floor((Math.max(0, ms) % 1000) / 100);
    const hasHours = forceHours || hours > 0;
    const base = hasHours ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;

    return showMs ? `${base}.${centiseconds}` : base;
}

export function clampCountdownValue(value, max) {
    const normalized = Number.isFinite(value) ? value : 0;
    return Math.max(0, Math.min(max, normalized));
}
