/** Clipboard and share helpers that degrade gracefully where browser APIs are missing or blocked. */

/** Copies text, falling back to a hidden textarea when the async Clipboard API is unavailable. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or not focused; try the legacy path below.
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

export function canShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/** Opens the native share sheet. Resolves false if sharing is unsupported or dismissed. */
export async function shareLink(url: string): Promise<boolean> {
  if (!canShare()) return false;
  try {
    await navigator.share({ title: 'LinkZip short link', url });
    return true;
  } catch {
    return false;
  }
}
