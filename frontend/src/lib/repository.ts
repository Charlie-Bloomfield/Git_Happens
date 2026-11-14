const segment = /^[A-Za-z0-9](?:[A-Za-z0-9._-]{0,98}[A-Za-z0-9])?$/;

export function parseRepository(input: string): string | null {
  let value = input.trim();

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "github.com") return null;
      value = url.pathname.replace(/^\/+|\/+$/g, "");
    } catch {
      return null;
    }
  }

  const parts = value.replace(/\.git$/i, "").split("/");
  if (parts.length !== 2 || !parts.every((part) => segment.test(part))) return null;
  return `${parts[0]}/${parts[1]}`;
}
