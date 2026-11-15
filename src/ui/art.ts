export function icon(name: string, size = 22) {
  const paths: Record<string, string> = {
    fish: '<path d="M5 12c4-7 10-7 15 0-5 7-11 7-15 0L2 8v8z"/><path d="M16 11h.01"/>',
    book: '<path d="M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-3-1-6-2-10 1v15"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="m10 2-.7 3-2.2 1-2.8-1-2 3 2 2.5v3L2.3 16l2 3 2.8-1 2.2 1 .7 3h4l.7-3 2.2-1 2.8 1 2-3-2-2.5v-3l2-2.5-2-3-2.8 1-2.2-1L14 2z"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    hook: '<path d="M14 3v12a5 5 0 0 1-10 0v-4l4 3"/><circle cx="14" cy="3" r="1.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    moon: '<path d="M19 15A8 8 0 0 1 9 4a8 8 0 1 0 10 11Z"/>',
    sail: '<path d="M12 3v14H3L12 3Zm3 4 6 10h-6M2 20q5 3 10 0 5 3 10 0"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    volume: '<path d="m11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.fish}</svg>`;
}

export function fishArt(color: string, silhouette = false) {
  return `<svg class="fish-art" viewBox="0 0 260 130" role="img" aria-label="Illustrated placeholder fish">
    <ellipse cx="134" cy="112" rx="74" ry="5" fill="#173f46" opacity=".06"/>
    <path d="M184 60 237 35l-7 30 7 30-53-22" fill="${color}" stroke="#355751" stroke-width="2.5"/>
    <path d="M109 40 137 19l20 29m-55 36 29 24 18-20" fill="${color}" stroke="#355751" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M26 65C63 22 151 19 200 65c-49 46-137 43-174 0Z" fill="${color}" stroke="#355751" stroke-width="2.5"/>
    ${silhouette ? '' : '<path d="M38 73c47 24 108 23 148-1-33 35-108 37-148 1Z" fill="#fff6d9" opacity=".45"/><path d="M79 42q16 23 0 46m45-28 28 9-25 14" fill="none" stroke="#355751" stroke-width="2" opacity=".6"/><circle cx="53" cy="61" r="5" fill="#213e3b"/><circle cx="51" cy="59" r="1.5" fill="#fff5d8"/><path d="M29 68h15" stroke="#355751" stroke-width="2"/>'}
  </svg>`;
}

