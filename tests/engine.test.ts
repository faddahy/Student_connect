import { describe, expect, it } from "vitest";
import {
  acceptLiveCapture,
  allocateRevenue,
  allowsThirdPartyAds,
  anonymousVisibility,
  blockView,
  canInteractWithWrapper,
  canOpenDistributionChannel,
  canSendAnonymous,
  capForeignPriceUsd,
  coldStartAudience,
  DATE_FEE_NGN,
  earningEligibility,
  evaluateViewerEligibility,
  feedAllowsMedia,
  FORM_WEIGHT,
  insertInlineAds,
  interactionTargetId,
  leafScore,
  lengthPoints,
  otherFeaturePrice,
  paidPlayPayout,
  placeDateHold,
  POOL_SHARES,
  quoteWithdrawal,
  reopenOnFreshInterest,
  repostPermissions,
  resolveDateHold,
  rollChannel,
  secretZoneSplit,
  SOURCE_WEIGHT,
  stakeLadder,
  subscriptionQuote,
  VIEWER_ACTIVITY,
  VIEWER_SURFACE_SHARE,
  viewerActivityScore,
  viewerSurfaceBudgets,
  watWindow,
  WITHDRAWAL_MIN_USD,
} from "../src/lib/engine";

describe("leaf scoring", () => {
  it("uses form × source × follower × length", () => {
    const score = leafScore({
      form: "like",
      source: "organic",
      isFollower: true,
      content: "text",
    });
    expect(score).toBeCloseTo(0.2 * 0.65 * 0.6 * 1, 10);
  });

  it("zeros fake traffic", () => {
    expect(
      leafScore({ form: "share", source: "fake", isFollower: true, content: "video", lengthPoints: 5 }),
    ).toBe(0);
  });

  it("keeps text, post, and live at 1 point and clamps video/book to 1–5", () => {
    expect(lengthPoints("text")).toBe(1);
    expect(lengthPoints("post", 4)).toBe(1);
    expect(lengthPoints("live", 9)).toBe(1);
    expect(lengthPoints("video", 5)).toBe(5);
    expect(lengthPoints("book", 0)).toBe(1);
    expect(lengthPoints("book", 9)).toBe(5);
    expect(FORM_WEIGHT).toEqual({ like: 0.2, comment: 0.3, share: 0.3, view: 0.2 });
    expect(SOURCE_WEIGHT.paid).toBe(0.35);
  });

  it("scores a non-follower paid comment on a 3-point video", () => {
    expect(
      leafScore({ form: "comment", source: "paid", isFollower: false, content: "video", lengthPoints: 3 }),
    ).toBeCloseTo(0.3 * 0.35 * 0.4 * 3, 10);
  });
});

describe("WAT windows, channels, and cold start", () => {
  it("buckets posts by WAT hour and accounts by WAT day", () => {
    const now = new Date("2026-11-26T22:30:00.000Z");
    const post = watWindow(now, "post");
    const account = watWindow(now, "account");
    expect(post.start.toISOString()).toBe("2026-11-26T22:00:00.000Z");
    expect(post.end.toISOString()).toBe("2026-11-26T23:00:00.000Z");
    expect(account.start.toISOString()).toBe("2026-11-25T23:00:00.000Z");
    expect(account.end.toISOString()).toBe("2026-11-26T23:00:00.000Z");
  });

  it("rolls an online channel forward and closes an offline one after the boundary", () => {
    const openedAt = new Date("2026-11-26T22:00:00.000Z");
    const later = new Date("2026-11-26T23:05:00.000Z");
    const online = rollChannel(
      { windowKind: "post", openedAt, online: true, closed: false, freshInterest: false },
      later,
    );
    expect(online.closed).toBe(false);
    expect(online.openedAt.toISOString()).toBe("2026-11-26T23:00:00.000Z");

    const offline = rollChannel(
      { windowKind: "post", openedAt, online: false, closed: false, freshInterest: false },
      later,
    );
    expect(offline.closed).toBe(true);
    expect(offline.freshInterest).toBe(false);
  });

  it("refuses a distribution channel on unlike and reopens on a like", () => {
    expect(canOpenDistributionChannel(false)).toBe(false);
    const closed = {
      windowKind: "post" as const,
      openedAt: new Date("2026-11-26T22:00:00.000Z"),
      online: false,
      closed: true,
      freshInterest: false,
    };
    const now = new Date("2026-11-26T23:10:00.000Z");
    const stillClosed = reopenOnFreshInterest(closed, now, false);
    expect(stillClosed.closed).toBe(true);
    const reopened = reopenOnFreshInterest(closed, now, true);
    expect(reopened.closed).toBe(false);
    expect(reopened.freshInterest).toBe(true);
    expect(reopened.openedAt.toISOString()).toBe("2026-11-26T23:00:00.000Z");
  });

  it("caps a zero-follower cold start at 100 matched online users", () => {
    expect(coldStartAudience(0, 250)).toBe(100);
    expect(coldStartAudience(0, 40)).toBe(40);
    expect(coldStartAudience(5, 250)).toBe(5);
  });
});

describe("metric allocation v2.1", () => {
  it("filters eligibility before paying creator and viewer pools", () => {
    expect(POOL_SHARES).toEqual({ creator: 0.5, viewer: 0.2, faddahy: 0.3 });
    const both = allocateRevenue(1000, { creator: true, viewers: true });
    expect(both).toMatchObject({ creator: 500, viewer: 200, faddahy: 300, withheld: 0 });
    const noCreator = allocateRevenue(1000, { creator: false, viewers: true });
    expect(noCreator.creator).toBe(0);
    expect(noCreator.viewer).toBe(200);
    expect(noCreator.faddahy).toBe(300);
    expect(noCreator.withheld).toBe(500);
    const noViewer = allocateRevenue(1000, { creator: true, viewers: false });
    expect(noViewer.viewer).toBe(0);
    expect(noViewer.withheld).toBe(200);
  });

  it("rescales the viewer pool 2/7 post, 3/7 video, 2/7 live and applies metric 4", () => {
    expect(VIEWER_SURFACE_SHARE.post + VIEWER_SURFACE_SHARE.video + VIEWER_SURFACE_SHARE.live).toBeCloseTo(1);
    const budgets = viewerSurfaceBudgets(200);
    expect(budgets.post).toBeCloseTo(200 * (2 / 7));
    expect(budgets.video).toBeCloseTo(200 * (3 / 7));
    expect(budgets.live).toBeCloseTo(200 * (2 / 7));
    expect(VIEWER_ACTIVITY).toEqual({ view: 0.6, share: 0.25, comment: 0.1, like: 0.05 });
    const score = viewerActivityScore({ views: 10, shares: 4, comments: 2, likes: 8 }, "video");
    const activity = 10 * 0.6 + 4 * 0.25 + 2 * 0.1 + 8 * 0.05;
    expect(score).toBeCloseTo(activity * (3 / 7));
  });

  it("requires 1 hour every day, 7 hours, 90% viewed, and 10 qualifying items", () => {
    const ok = evaluateViewerEligibility({
      hoursPerDay: [1, 1, 1, 1, 1, 1, 1],
      itemsViewed: 18,
      itemsAvailable: 20,
      qualifyingItems: 10,
    });
    expect(ok.eligible).toBe(true);

    const makeup = evaluateViewerEligibility({
      hoursPerDay: [2, 2, 2, 2, 2, 2, 0],
      itemsViewed: 20,
      itemsAvailable: 20,
      qualifyingItems: 12,
    });
    expect(makeup.eligible).toBe(false);
    expect(makeup.reasons.join(" ")).toMatch(/cannot be made up/i);

    const shortWatch = evaluateViewerEligibility({
      hoursPerDay: [1, 1, 1, 1, 1, 1, 1],
      itemsViewed: 17,
      itemsAvailable: 20,
      qualifyingItems: 10,
    });
    expect(shortWatch.eligible).toBe(false);

    const fewItems = evaluateViewerEligibility({
      hoursPerDay: [1, 1, 1, 1, 1, 1, 1],
      itemsViewed: 9,
      itemsAvailable: 10,
      qualifyingItems: 9,
    });
    expect(fewItems.eligible).toBe(false);
  });
});

describe("regional pricing and withdrawals", () => {
  it("prices Nigeria, other Africa, and foreign plans", () => {
    expect(subscriptionQuote("nigeria", "monthly")).toMatchObject({ amount: 1000, currency: "NGN", coversFastTrack: false });
    expect(subscriptionQuote("nigeria", "fast_track")).toMatchObject({ amount: 3000, coversFastTrack: true });
    expect(subscriptionQuote("africa", "yearly")).toMatchObject({ amount: 10000, currency: "NGN", coversFastTrack: true });
    expect(otherFeaturePrice("africa")).toEqual({ amount: 1000, currency: "NGN" });
    expect(subscriptionQuote("foreign", "yearly")).toMatchObject({ amount: 10, currency: "USD", coversFastTrack: true });
    expect(capForeignPriceUsd(4)).toBe(10);
    expect(capForeignPriceUsd(25)).toBe(25);
    expect(otherFeaturePrice("foreign").amount).toBe(10);
  });

  it("holds Nigerian monthly earning for 3 months and fast-track for 30 active days", () => {
    const monthly = earningEligibility({
      region: "nigeria",
      plan: "monthly",
      verified: true,
      straightPremiumMonths: 2,
    });
    expect(monthly.eligible).toBe(false);
    expect(monthly.monthsRemaining).toBe(1);
    const ready = earningEligibility({
      region: "nigeria",
      plan: "monthly",
      verified: true,
      straightPremiumMonths: 3,
    });
    expect(ready.eligible).toBe(true);
    const fast = earningEligibility({
      region: "nigeria",
      plan: "fast_track",
      verified: true,
      straightActiveDays: 30,
    });
    expect(fast.eligible).toBe(true);
    const africa = earningEligibility({
      region: "africa",
      plan: "yearly",
      verified: true,
      straightActiveDays: 12,
    });
    expect(africa.eligible).toBe(false);
    expect(africa.daysRemaining).toBe(18);
    expect(
      earningEligibility({ region: "foreign", plan: "yearly", verified: false, straightActiveDays: 40 }).eligible,
    ).toBe(false);
  });

  it("locks the live rate at payout and makes the user cover the conversion fee", () => {
    expect(WITHDRAWAL_MIN_USD).toBe(30);
    const small = quoteWithdrawal({ amountUsd: 29, usdToNgn: 1600, conversionFeeUsd: 1 });
    expect(small.ok).toBe(false);
    const paid = quoteWithdrawal({ amountUsd: 30, usdToNgn: 1600, conversionFeeUsd: 1 });
    expect(paid.ok).toBe(true);
    expect(paid.lockedRate).toBe(1600);
    expect(paid.feeUsd).toBe(1);
    expect(paid.netUsd).toBe(29);
    expect(paid.payoutNgn).toBe(46400);
  });
});

describe("distribute, contribute, blocks, and ads", () => {
  it("makes distribute wrappers read-only and points engagement at the original", () => {
    expect(repostPermissions("distribute")).toMatchObject({ distribute: false, contribute: false });
    expect(canInteractWithWrapper("distribute")).toBe(false);
    expect(interactionTargetId({ id: "wrap", kind: "distribute", originalId: "orig" })).toBe("orig");
    expect(repostPermissions("original")).toEqual({ distribute: true, contribute: true });
  });

  it("blocks a second repost or quote of a contribute post", () => {
    const perms = repostPermissions("contribute");
    expect(perms.distribute).toBe(false);
    expect(perms.contribute).toBe(false);
    expect(perms.hint).toMatch(/original/i);
    expect(canInteractWithWrapper("contribute")).toBe(true);
    expect(interactionTargetId({ id: "quote", kind: "contribute", originalId: "orig" })).toBe("quote");
  });

  it("hides profiles and DMs across a block but keeps shared public-group posts", () => {
    const blocked = blockView(true, true);
    expect(blocked.canDm).toBe(false);
    expect(blocked.canDirectInteract).toBe(false);
    expect(blocked.canViewProfile).toBe(false);
    expect(blocked.canSeePublicGroupPost).toBe(true);
    expect(blockView(true, false).canSeePublicGroupPost).toBe(false);
    expect(blockView(false, false).canViewProfile).toBe(true);
  });

  it("keeps the main feed text-only and places one ad after every 10 items", () => {
    expect(feedAllowsMedia("text")).toBe(true);
    expect(feedAllowsMedia("video")).toBe(false);
    const posts = insertInlineAds(Array.from({ length: 25 }, (_, i) => i), 10, "post");
    const ads = posts.filter((slot) => slot.type === "ad");
    expect(ads).toHaveLength(2);
    expect(ads.map((slot) => (slot.type === "ad" ? slot.after : 0))).toEqual([10, 20]);
    expect(insertInlineAds(Array.from({ length: 9 }, (_, i) => i), 10, "comment").some((s) => s.type === "ad")).toBe(
      false,
    );
    const comments = insertInlineAds(Array.from({ length: 10 }, (_, i) => i), 10, "comment");
    expect(comments.filter((s) => s.type === "ad")).toHaveLength(1);
  });
});

describe("anonymous visibility", () => {
  it("shows free members 1 of every 3 messages and blue-tick members all of them", () => {
    const free = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => anonymousVisibility(i, false));
    expect(free.filter((v) => v === "full")).toEqual(["full", "full", "full"]);
    expect(free.filter((v) => v === "locked")).toHaveLength(6);
    expect([0, 1, 2, 3].every((i) => anonymousVisibility(i, true) === "full")).toBe(true);
    expect(canSendAnonymous(false)).toBe(false);
    expect(canSendAnonymous(true)).toBe(true);
  });
});

describe("dating hold", () => {
  const now = new Date("2026-11-26T12:00:00.000Z");

  it("places a 48-hour unspendable hold without deducting", () => {
    const placed = placeDateHold({ blueTick: true, earningsNgn: 500, alreadyHeldNgn: 0, now });
    expect(placed.ok).toBe(true);
    expect(placed.earningsAfter).toBe(500);
    expect(placed.heldAfter).toBe(DATE_FEE_NGN);
    expect(placed.hold?.expiresAt.getTime() - now.getTime()).toBe(48 * 60 * 60 * 1000);
    expect(placeDateHold({ blueTick: false, earningsNgn: 500, alreadyHeldNgn: 0, now }).ok).toBe(false);
  });

  it("deducts only when both confirm, and releases on unmatch or expiry", () => {
    const placed = placeDateHold({ blueTick: true, earningsNgn: 500, alreadyHeldNgn: 0, now });
    const hold = placed.hold!;
    const confirmed = resolveDateHold({
      hold,
      earningsNgn: 500,
      heldNgn: 100,
      now: new Date(now.getTime() + 60_000),
      event: "both_confirm",
    });
    expect(confirmed.deductedNgn).toBe(100);
    expect(confirmed.earningsAfter).toBe(400);
    expect(confirmed.heldAfter).toBe(0);

    const unmatched = resolveDateHold({
      hold,
      earningsNgn: 500,
      heldNgn: 100,
      now,
      event: "unmatch",
    });
    expect(unmatched.deductedNgn).toBe(0);
    expect(unmatched.earningsAfter).toBe(500);
    expect(unmatched.hold.released).toBe(true);

    const expired = resolveDateHold({
      hold,
      earningsNgn: 500,
      heldNgn: 100,
      now: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      event: "tick",
    });
    expect(expired.deductedNgn).toBe(0);
    expect(expired.hold.released).toBe(true);
  });
});

describe("paid play and secret zone splits", () => {
  it("takes a 1% fee and splits the net 30/70", () => {
    expect(stakeLadder()).toEqual([100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]);
    const payout = paidPlayPayout(100, 4);
    expect(payout.gross).toBe(400);
    expect(payout.faddahyFee).toBe(4);
    expect(payout.net).toBe(396);
    expect(payout.organizer).toBeCloseTo(118.8);
    expect(payout.winner).toBeCloseTo(277.2);
    expect(paidPlayPayout(1000, 2).faddahyFee).toBe(20);
    expect(() => paidPlayPayout(150, 2)).toThrow(/100/);
  });

  it("settles secret subscriptions 70/30 and never allows third-party ads there", () => {
    expect(secretZoneSplit(1)).toEqual({ months: 1, gross: 1000, creator: 700, faddahy: 300 });
    expect(secretZoneSplit(2).creator).toBe(1400);
    expect(allowsThirdPartyAds("/secret")).toBe(false);
    expect(allowsThirdPartyAds("/secret/zara")).toBe(false);
    expect(allowsThirdPartyAds("/secret/zara?x=1")).toBe(false);
    expect(allowsThirdPartyAds("/feed")).toBe(true);
  });
});

describe("live KYC capture", () => {
  it("rejects gallery files and stale photos", () => {
    const now = 1_700_000_000_000;
    expect(acceptLiveCapture({ fromLiveCapture: false, lastModified: now }, now).ok).toBe(false);
    expect(acceptLiveCapture({ fromLiveCapture: true, lastModified: now - 60_000 }, now).ok).toBe(false);
    expect(acceptLiveCapture({ fromLiveCapture: true, lastModified: now - 1000 }, now).ok).toBe(true);
  });
});
