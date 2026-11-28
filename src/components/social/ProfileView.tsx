"use client";

import { useState } from "react";
import Link from "next/link";
import { avatarUri, BLOCKS, PEOPLE, type DemoPerson } from "@/lib/demo/data";
import { useFeedPosts } from "@/lib/demo/feed-store";
import { earningEligibility } from "@/lib/engine";
import { naira } from "@/lib/format";
import { submitComplaint } from "@/app/actions/social";
import { addComplaint, addContentReport } from "@/lib/demo/requests-store";
import { blockUser, reportUser } from "@/app/actions/safety";
import { WithdrawalForm } from "@/components/social/WithdrawalForm";
import { ProfileEditor } from "@/components/ProfileEditor";
import type { MyProfile } from "@/lib/types";

const JOINED: Record<string, string> = {
  yagyok: "January 2026",
  ada: "March 2026",
  tunde: "April 2026",
  chika: "February 2026",
  kwame: "May 2026",
  lena: "June 2026",
  nora: "March 2026",
  zara: "February 2026",
};

const REGION_LABEL = { nigeria: "Nigeria", africa: "Other Africa", foreign: "Outside Africa" };

export function ProfileView({
  person,
  viewer,
  self,
  profile,
}: {
  person: DemoPerson;
  viewer: string;
  self: boolean;
  profile?: MyProfile;
}) {
  const posts = useFeedPosts().filter((post) => post.feedVisible);
  const [tab, setTab] = useState<"posts" | "replies" | "likes">("posts");
  const [editing, setEditing] = useState(false);
  const [following, setFollowing] = useState(Boolean(PEOPLE.find((item) => item.username === viewer)?.follows.includes(person.username)));
  const [complaint, setComplaint] = useState("");
  const [note, setNote] = useState<string>();
  const followers = PEOPLE.filter((item) => item.follows.includes(person.username));
  const followingList = PEOPLE.filter((item) => person.follows.includes(item.username));
  const mine = posts.filter((post) => post.author === person.username);
  const replies = posts.flatMap((post) => post.comments.filter((comment) => comment.author === person.username).map((comment) => ({ post, comment })));
  const liked = posts.filter((post) => post.likes.includes(person.username));
  const eligibility = earningEligibility({
    region: person.region,
    plan: person.plan ?? "monthly",
    verified: person.blueTick,
    straightPremiumMonths: person.straightPremiumMonths,
    straightActiveDays: person.straightActiveDays,
  });
  const blocked = BLOCKS.filter(([left, right]) => left === viewer || right === viewer).map(([left, right]) => (left === viewer ? right : left));

  return (
    <main className="px-4" data-testid="profile">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUri(person.displayName, person.color)} alt="" className="h-16 w-16 rounded-full" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black">{person.displayName}</h1>
          <p className="text-sm text-ink/70">
            @{person.username} {person.blueTick && <span className="text-sky-400" aria-label="Blue tick">●</span>}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink/75">{person.bio}</p>
          <p className="mt-1 text-xs text-ink/45">Joined {JOINED[person.username] ?? "2026"} · {REGION_LABEL[person.region]}</p>
        </div>
      </div>

      {self ? (
        <button type="button" className="btn-ghost mt-4 w-full" onClick={() => setEditing((value) => !value)}>Edit profile</button>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className="btn-primary py-2 text-sm" onClick={() => setFollowing((value) => !value)}>{following ? "Following" : "Follow"}</button>
          <Link href="/matches" className="btn-ghost py-2 text-sm">Message</Link>
          <button type="button" className="btn-ghost py-2 text-sm" onClick={() => { void blockUser(person.id); setNote(`@${person.username} is blocked.`); }}>Block</button>
          <button
            type="button"
            className="btn-ghost py-2 text-sm"
            onClick={() => {
              void reportUser(person.id, "other", "Profile report", false);
              addContentReport({ username: viewer, targetType: "profile", targetLabel: `@${person.username}`, reason: "Profile", details: "" });
              setNote("Profile report sent to Admin.");
            }}
          >
            Report
          </button>
        </div>
      )}
      {note && <p className="mt-2 text-sm text-emerald-300">{note}</p>}
      {editing && profile && <div className="mt-4"><ProfileEditor profile={profile} mode="edit" /></div>}

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="Posts" value={mine.length} />
        <Stat label="Followers" value={followers.length} />
        <Stat label="Following" value={followingList.length} />
      </div>
      <p className="mt-2 text-center text-xs text-ink/45">
        {followers.map((item) => item.username).join(", ") || "No followers yet"}
        {followingList.length > 0 && ` · follows ${followingList.map((item) => item.username).join(", ")}`}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {(["posts", "replies", "likes"] as const).map((item) => (
          <button key={item} type="button" className={`chip ${tab === item ? "chip-on" : ""}`} onClick={() => setTab(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {tab === "posts" && mine.map((post) => (
          <Link key={post.id} href={`/post/${post.id}`} className="card block text-sm">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink/40">{post.kind === "distribute" ? "Repost" : post.kind === "contribute" ? "Quote" : "Post"}</span>
            <p className="mt-1">{post.body || "Reposted a post"}</p>
          </Link>
        ))}
        {tab === "replies" && replies.map(({ post, comment }) => (
          <Link key={comment.id} href={`/post/${post.id}`} className="card block text-sm">{comment.body}</Link>
        ))}
        {tab === "likes" && liked.map((post) => (
          <Link key={post.id} href={`/post/${post.id}`} className="card block text-sm">{post.body || `@${post.author}`}</Link>
        ))}
        {tab === "posts" && mine.length === 0 && <p className="text-sm text-ink/50">No posts yet.</p>}
      </div>

      {self && (
        <>
          <section className="card mt-4">
            <h2 className="font-bold">Monetization</h2>
            <p className="mt-1 text-sm text-ink/70">Earnings {naira(person.earningsNgn)}. Dating hold {naira(person.username === "ada" ? 100 : 0)} for 48 hours, not deducted until both confirm.</p>
            <p className="mt-2 text-sm">{eligibility.reason}</p>
            {eligibility.monthsRemaining !== undefined && <p className="text-sm font-semibold">{eligibility.monthsRemaining} premium month(s) left on the 3-month path.</p>}
            {eligibility.daysRemaining !== undefined && <p className="text-sm font-semibold">{eligibility.daysRemaining} active day(s) left on the 30-day fast-track.</p>}
            <p className="mt-2 text-xs text-ink/50">KYC {person.kyc} · {person.blueTick ? "Blue tick on" : "Blue tick off"}</p>
            <Link href="/wallet" className="mt-3 inline-block text-sm font-semibold text-brand-200">Open wallet</Link>
          </section>
          <div className="mt-3"><WithdrawalForm person={person} /></div>
          <section className="card mt-3">
            <h2 className="font-bold">Safety and support</h2>
            <form
              className="mt-3 space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                void submitComplaint(complaint).then(() => {
                  addComplaint(person.username, complaint.trim());
                  setComplaint("");
                  setNote("Complaint sent to Admin.");
                });
              }}
            >
              <label className="label" htmlFor="complaint">Report a complaint</label>
              <textarea id="complaint" className="input min-h-20" value={complaint} onChange={(event) => setComplaint(event.target.value)} placeholder="Tell Admin what went wrong" />
              <button className="btn-primary w-full" type="submit" disabled={complaint.trim().length < 3}>Send complaint</button>
            </form>
            <p className="mt-3 text-sm text-ink/60">Blocked: {blocked.length ? blocked.map((name) => `@${name}`).join(", ") : "nobody"}</p>
          </section>
        </>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/5 px-2 py-3">
      <p className="text-lg font-black">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/45">{label}</p>
    </div>
  );
}
