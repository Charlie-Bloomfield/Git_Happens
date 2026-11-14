const ownerPattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const repoPattern = /^[A-Za-z0-9._-]{1,100}$/;

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
  if (parts.length !== 2 || !ownerPattern.test(parts[0]) || !repoPattern.test(parts[1]) || parts[1] === "." || parts[1] === "..") return null;
  return `${parts[0]}/${parts[1]}`;
}
