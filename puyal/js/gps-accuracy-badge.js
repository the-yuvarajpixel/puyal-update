// ============================================================================
// PUYAL — GPS Precision & Signal Strength Accuracy Visualization
// Renders responder-grade GPS confidence badges (4-bar signal meter, confidence
// score %, precision tier, radius in meters, and confidence progress bar) near
// user coordinates across Civilian & Admin SOS panels.
// ============================================================================
(function (global) {
  'use strict';

  function formatMeters(acc) {
    if (acc >= 1000) {
      return `±${(acc / 1000).toFixed(1)}km`;
    }
    if (acc >= 100) {
      return `±${Math.round(acc)}m`;
    }
    return `±${Number(acc).toFixed(acc % 1 === 0 ? 0 : 1)}m`;
  }

  function computeGpsAccuracyScore(accuracyMeters) {
    const raw = accuracyMeters === null || accuracyMeters === undefined || accuracyMeters === ''
      ? NaN
      : Number(accuracyMeters);

    if (!Number.isFinite(raw) || raw <= 0) {
      return {
        level: 'pending',
        label: 'Acquiring',
        score: 0,
        bars: 0,
        accuracyMeters: null,
        metersText: 'Locking…',
        summary: 'Acquiring GPS satellite lock — responder confidence pending'
      };
    }

    const acc = Math.max(0.5, parseFloat(raw.toFixed(1)));
    const metersText = formatMeters(acc);

    if (acc <= 10) {
      const score = Math.min(99, Math.max(94, Math.round(99 - (acc / 10) * 5)));
      return {
        level: 'pinpoint',
        label: 'Pinpoint',
        score,
        bars: 4,
        accuracyMeters: acc,
        metersText,
        summary: `Pinpoint GPS precision (${metersText}) — ${score}% responder location confidence`
      };
    }

    if (acc <= 25) {
      const score = Math.min(93, Math.max(82, Math.round(93 - ((acc - 10) / 15) * 11)));
      return {
        level: 'high',
        label: 'High',
        score,
        bars: 3,
        accuracyMeters: acc,
        metersText,
        summary: `High GPS precision (${metersText}) — ${score}% responder location confidence`
      };
    }

    if (acc <= 75) {
      const score = Math.min(81, Math.max(58, Math.round(81 - ((acc - 25) / 50) * 23)));
      return {
        level: 'moderate',
        label: 'Moderate',
        score,
        bars: 2,
        accuracyMeters: acc,
        metersText,
        summary: `Moderate GPS signal (${metersText}) — ${score}% responder location confidence`
      };
    }

    const score = Math.min(57, Math.max(20, Math.round(57 - Math.min(37, ((acc - 75) / 225) * 37))));
    return {
      level: 'low',
      label: 'Low',
      score,
      bars: 1,
      accuracyMeters: acc,
      metersText,
      summary: `Coarse GPS fix (${metersText}) — ${score}% responder confidence; verify nearby landmarks`
    };
  }

  function escapeAttr(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderSignalBarsSvg(activeBars, level) {
    const heights = [4, 7, 10, 13];
    const rects = heights.map((h, idx) => {
      const isLit = idx < activeBars;
      const x = idx * 4;
      const y = 14 - h;
      const cls = isLit ? 'gps-sig-bar active' : 'gps-sig-bar';
      return `<rect x="${x}" y="${y}" width="2.8" height="${h}" rx="0.9" class="${cls}" />`;
    }).join('');

    return `<svg class="gps-sig-bars ${level === 'pending' ? 'is-pending' : ''}" width="16" height="14" viewBox="0 0 16 14" aria-hidden="true">${rects}</svg>`;
  }

  function renderGpsAccuracyBadgeHtml(accuracyMeters, options = {}) {
    const {
      theme = 'light',
      compact = false,
      showMeter = true
    } = options;

    const info = computeGpsAccuracyScore(accuracyMeters);
    const themeClass = theme === 'dark' ? 'gps-acc-theme-dark' : 'gps-acc-theme-light';
    const compactClass = compact ? 'gps-acc-compact' : '';
    const scoreText = info.level === 'pending' ? 'GPS Lock…' : `${info.label} · ${info.score}%`;
    const ariaLabel = `GPS accuracy confidence: ${info.summary}`;

    const meterHtml = showMeter && !compact
      ? `<span class="gps-acc-meter" aria-hidden="true"><span class="gps-acc-meter-fill" style="width:${info.score}%"></span></span>`
      : '';

    return `
      <span
        class="gps-accuracy-badge gps-acc-${info.level} ${themeClass} ${compactClass}"
        role="status"
        data-accuracy-level="${info.level}"
        data-accuracy-score="${info.score}"
        data-accuracy-bars="${info.bars}"
        title="${escapeAttr(info.summary)}"
        aria-label="${escapeAttr(ariaLabel)}"
      >
        <span class="gps-acc-top">
          ${renderSignalBarsSvg(info.bars, info.level)}
          <span class="gps-acc-label">${escapeAttr(scoreText)}</span>
          <span class="gps-acc-radius">${escapeAttr(info.metersText)}</span>
        </span>
        ${meterHtml}
      </span>
    `.trim();
  }

  function updateGpsAccuracyBadge(target, accuracyMeters, options = {}) {
    const el = typeof target === 'string' ? document.getElementById(target) : target;
    if (!el) return null;
    const info = computeGpsAccuracyScore(accuracyMeters);
    el.innerHTML = renderGpsAccuracyBadgeHtml(accuracyMeters, options);
    return info;
  }

  const api = {
    computeGpsAccuracyScore,
    renderGpsAccuracyBadgeHtml,
    updateGpsAccuracyBadge
  };

  global.PuyalGpsAccuracy = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
