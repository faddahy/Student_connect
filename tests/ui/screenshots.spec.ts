import { expect, test } from "@playwright/test";
import path from "node:path";

const out = path.join(process.cwd(), "docs/verification");

async function shot(page: import("@playwright/test").Page, name: string, fullPage = false) {
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage });
}

test("main feed shows distribute, contribute, and a mimic ad", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1400 });
  await page.goto("/feed");
  const distribute = page.getByTestId("distribute-post").first();
  const contribute = page.getByTestId("contribute-post").first();
  await distribute.scrollIntoViewIfNeeded();
  await expect(distribute).toBeVisible();
  await expect(contribute.getByRole("button", { name: "Distribute" })).toBeDisabled();
  await expect(contribute.getByRole("button", { name: "Contribute" })).toBeDisabled();
  await expect(page.locator("video")).toHaveCount(0);
  await shot(page, "01-feed-distribute-contribute");
  await contribute.getByRole("button", { name: /Comments/ }).click();
  await expect(page.getByTestId("comment-ad").first()).toBeVisible();
  await page.getByTestId("mimic-ad").first().scrollIntoViewIfNeeded();
  await expect(page.getByTestId("mimic-ad").first()).toBeVisible();
  await shot(page, "02-feed-mimic-ad");
});

test("dating shows the 48 hour hold", async ({ page }) => {
  await page.goto("/discover");
  await expect(page.getByTestId("dating-hold")).toBeVisible();
  await expect(page.getByText("Not deducted")).toBeVisible();
  await shot(page, "03-dating-hold");
});

test("whot and ludo are playable", async ({ page }) => {
  await page.goto("/games/whot");
  await expect(page.getByTestId("whot-board")).toBeVisible();
  await expect(page.getByText("Pick 2")).toBeVisible();
  await shot(page, "04-whot");
  await page.goto("/games/ludo");
  await expect(page.getByTestId("ludo-board")).toBeVisible();
  await page.getByRole("button", { name: /Roll for/ }).click();
  await expect(page.getByText(/rolled/i)).toBeVisible();
  await shot(page, "05-ludo");
});

test("free members see one of every three anonymous notes", async ({ page }) => {
  await page.goto("/api/demo/persona?as=tunde&next=/anonymous");
  await expect(page.getByTestId("anon-locked").first()).toBeVisible();
  await expect(page.getByTestId("anon-open").first()).toBeVisible();
  const locked = await page.getByTestId("anon-locked").count();
  const open = await page.getByTestId("anon-open").count();
  expect(open).toBe(3);
  expect(locked).toBe(5);
  await shot(page, "06-anonymous-lock");
});

test("secret zone stays free of third-party ad scripts", async ({ page }) => {
  const scripts: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "script") scripts.push(request.url());
  });
  await page.goto("/secret");
  await expect(page.getByTestId("secret-gate")).toBeVisible();
  await page.getByRole("button", { name: "I am 18 or older" }).click();
  await expect(page.getByTestId("secret-room")).toBeVisible();
  await expect(page.getByText("700")).toBeVisible();
  const html = await page.content();
  expect(html).not.toMatch(/googlesyndication|adsbygoogle|doubleclick/i);
  expect(scripts.join(" ")).not.toMatch(/googlesyndication|doubleclick/i);
  await shot(page, "07-secret-zone");
});

test("admin can review receipts and ad pools", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByTestId("admin-transfers")).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve blue tick" }).first()).toBeVisible();
  await page.getByTestId("ad-performance").scrollIntoViewIfNeeded();
  await expect(page.getByText("CTR").first()).toBeVisible();
  await shot(page, "08-admin", true);
});
