import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "..");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(tsx|ts|jsx|js|css)$/.test(entry)) out.push(full);
  }
  return out;
}

const BANNED = [
  /adsbygoogle/i,
  /googlesyndication/i,
  /pagead2\.googlesyndication/i,
  /doubleclick/i,
  /NEXT_PUBLIC_ADSENSE/i,
  /<AdSlot[\s/>]/,
  /from\s+["']@\/components\/AdSlot["']/,
  /from\s+["']@\/components\/MimicAd["']/,
  /from\s+["']@\/components\/NetworkAds["']/,
];

describe("Secret Zone ad ban", () => {
  it("has no third-party or house ad imports on Secret Zone routes", () => {
    const files = walk(path.join(ROOT, "src/app/secret"));
    expect(files.length).toBeGreaterThan(0);
    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const pattern of BANNED) {
        if (pattern.test(text)) offenders.push(`${path.relative(ROOT, file)} matched ${pattern}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("keeps the network script behind the Secret Zone guard", () => {
    const network = readFileSync(path.join(ROOT, "src/components/NetworkAds.tsx"), "utf8");
    expect(network).toMatch(/allowsThirdPartyAds/);
    const root = readFileSync(path.join(ROOT, "src/app/layout.tsx"), "utf8");
    expect(root).not.toMatch(/googlesyndication/);
    expect(root).not.toMatch(/adsbygoogle/);
    const secretLayout = readFileSync(path.join(ROOT, "src/app/secret/layout.tsx"), "utf8");
    expect(secretLayout).not.toMatch(/NetworkAds/);
    expect(secretLayout).not.toMatch(/AdSlot/);
    expect(secretLayout).toMatch(/ad-free|no third-party ad/i);
  });
});
