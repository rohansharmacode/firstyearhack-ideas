// Tiny DOM helpers so the UI has no framework dependency.

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, string> & { class?: string } = {},
  ...children: (Node | string | null | undefined | false)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) if (c != null && c !== false) node.append(c);
  return node;
}

/** Parse a trusted, static HTML/SVG snippet. Never pass user input here. */
export function html(markup: string): DocumentFragment {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content;
}

/** Fade a screen out, then remove it. */
export function leave(node: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    node.classList.add('kr-leaving');
    const done = () => {
      node.remove();
      resolve();
    };
    node.addEventListener('animationend', done, { once: true });
    setTimeout(done, 400); // reduced-motion / no animation fallback
  });
}

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const fmtTime = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
