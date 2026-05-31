// Pretty-print raw HTML so it reads like a clean, nested email:
// block elements sit on their own indented lines, while text and inline
// elements (strong, a, br, …) stay on the same line as their parent.
//
// The formatter only normalizes whitespace *between* tags — text content is
// preserved verbatim — so it never changes how the email actually renders.

const INLINE = new Set([
  "a", "abbr", "b", "br", "code", "em", "i", "small",
  "span", "strong", "sub", "sup", "u", "mark", "font",
]);

const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img",
  "input", "link", "meta", "param", "source", "track", "wbr",
]);

function tagName(tag: string): string {
  const m = tag.match(/^<\/?\s*([a-zA-Z0-9]+)/);
  return m ? m[1].toLowerCase() : "";
}

const isOpen = (p: string) =>
  p.startsWith("<") && !p.startsWith("</") && !p.startsWith("<!");
const isClose = (p: string) => p.startsWith("</");
const pad = (depth: number) => "  ".repeat(Math.max(0, depth));

function formatNodes(parts: string[], depth: number, out: string[]): void {
  let i = 0;
  while (i < parts.length) {
    const p = parts[i];

    if (!isOpen(p)) {
      if (!isClose(p) && p.trim()) out.push(pad(depth) + p.trim());
      i++;
      continue;
    }

    const name = tagName(p);
    if (VOID.has(name) || p.endsWith("/>")) {
      out.push(pad(depth) + p);
      i++;
      continue;
    }

    // find the matching close tag, accounting for nesting of same-name tags
    let d = 1;
    let j = i + 1;
    for (; j < parts.length; j++) {
      const q = parts[j];
      if (isOpen(q) && tagName(q) === name && !(VOID.has(name) || q.endsWith("/>"))) {
        d++;
      } else if (isClose(q) && tagName(q) === name) {
        d--;
        if (d === 0) break;
      }
    }

    if (d !== 0) {
      // no matching close — emit the rest verbatim rather than corrupt it
      out.push(pad(depth) + parts.slice(i).join(""));
      return;
    }

    const inner = parts.slice(i + 1, j);
    const closeTag = parts[j];
    const hasBlockChild = inner.some(
      (q) => (isOpen(q) || isClose(q)) && !INLINE.has(tagName(q)),
    );

    if (!hasBlockChild) {
      // only text/inline inside → keep it all on one line
      out.push(pad(depth) + p + inner.join("") + closeTag);
    } else {
      out.push(pad(depth) + p);
      formatNodes(inner, depth + 1, out);
      out.push(pad(depth) + closeTag);
    }

    i = j + 1;
  }
}

export function formatHtml(html: string): string {
  const parts = html
    .replace(/>\s+</g, "><")
    .trim()
    .match(/<[^>]*>|[^<]+/g);
  if (!parts) return html.trim();
  const out: string[] = [];
  formatNodes(parts, 0, out);
  return out.join("\n");
}
