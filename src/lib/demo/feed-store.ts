"use client";

import { useSyncExternalStore } from "react";
import { ADS, POSTS, type DemoComment, type DemoPost } from "@/lib/demo/data";
import { distributeBlockedByDislike, repostPermissions, toggleReaction, type Reaction } from "@/lib/engine";

export interface FeedComment {
  id: string;
  author: string;
  body: string;
  parentId?: string;
  likes: string[];
  dislikes: string[];
}

export interface FeedPost {
  id: string;
  author: string;
  kind: DemoPost["kind"];
  body: string;
  originalId?: string;
  groupSlug?: string;
  likes: string[];
  dislikes: string[];
  comments: FeedComment[];
  shares: number;
  views: number;
  hoursAgo: number;
  feedVisible: boolean;
  sponsored: boolean;
  viewedBy: string[];
}

export function adPostId(adId: string): string {
  return `adpost-${adId}`;
}

function normalizeComment(comment: DemoComment): FeedComment {
  return {
    id: comment.id,
    author: comment.author,
    body: comment.body,
    parentId: comment.parentId,
    likes: [...(comment.likes ?? [])],
    dislikes: [...(comment.dislikes ?? [])],
  };
}

function normalizePost(post: DemoPost): FeedPost {
  return {
    id: post.id,
    author: post.author,
    kind: post.kind,
    body: post.body,
    originalId: post.originalId,
    groupSlug: post.groupSlug,
    likes: [...post.likes],
    dislikes: [...(post.dislikes ?? [])],
    comments: post.comments.map(normalizeComment),
    shares: post.shares,
    views: post.views,
    hoursAgo: post.hoursAgo,
    feedVisible: post.feedVisible !== false,
    sponsored: Boolean(post.sponsored),
    viewedBy: [...(post.viewedBy ?? [])],
  };
}

function seed(): FeedPost[] {
  const next = POSTS.map(normalizePost);
  for (const ad of ADS) {
    next.push({
      id: adPostId(ad.id),
      author: ad.username,
      kind: "original",
      body: ad.copy,
      likes: [],
      dislikes: [],
      comments: [],
      shares: 0,
      views: ad.impressions,
      hoursAgo: 1,
      feedVisible: false,
      sponsored: true,
      viewedBy: [],
    });
  }
  return next;
}

let posts = seed();
const listeners = new Set<() => void>();

function emit(next: FeedPost[]) {
  posts = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function snapshot() {
  return posts;
}

export function useFeedPosts(): FeedPost[] {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function usePost(id: string): FeedPost | undefined {
  return useFeedPosts().find((post) => post.id === id);
}

function updatePost(id: string, recipe: (post: FeedPost) => FeedPost) {
  emit(posts.map((post) => (post.id === id ? recipe(post) : post)));
}

function withUser(list: string[], user: string, on: boolean): string[] {
  if (on) return list.includes(user) ? list : [...list, user];
  return list.filter((name) => name !== user);
}

export function togglePostReaction(postId: string, user: string, action: Reaction) {
  updatePost(postId, (post) => {
    const current = post.likes.includes(user) ? "like" : post.dislikes.includes(user) ? "dislike" : null;
    const next = toggleReaction(current, action);
    return {
      ...post,
      likes: withUser(post.likes, user, next === "like"),
      dislikes: withUser(post.dislikes, user, next === "dislike"),
    };
  });
}

export function toggleCommentReaction(postId: string, commentId: string, user: string, action: Reaction) {
  updatePost(postId, (post) => ({
    ...post,
    comments: post.comments.map((comment) => {
      if (comment.id !== commentId) return comment;
      const current = comment.likes.includes(user) ? "like" : comment.dislikes.includes(user) ? "dislike" : null;
      const next = toggleReaction(current, action);
      return {
        ...comment,
        likes: withUser(comment.likes, user, next === "like"),
        dislikes: withUser(comment.dislikes, user, next === "dislike"),
      };
    }),
  }));
}

export function addComment(postId: string, author: string, body: string, parentId?: string) {
  const text = body.trim();
  if (!text) return;
  updatePost(postId, (post) => ({
    ...post,
    comments: [
      ...post.comments,
      { id: `c-${Date.now()}`, author, body: text.slice(0, 500), parentId, likes: [], dislikes: [] },
    ],
  }));
}

export function sharePost(postId: string) {
  updatePost(postId, (post) => ({ ...post, shares: post.shares + 1 }));
}

export function recordView(postId: string, user: string) {
  const post = posts.find((item) => item.id === postId);
  if (!post || post.viewedBy.includes(user)) return;
  updatePost(postId, (item) => ({ ...item, views: item.views + 1, viewedBy: [...item.viewedBy, user] }));
}

function blank(author: string, id: string, kind: FeedPost["kind"], body: string, originalId?: string): FeedPost {
  return {
    id,
    author,
    kind,
    body,
    originalId,
    likes: [],
    dislikes: [],
    comments: [],
    shares: 0,
    views: 0,
    hoursAgo: 0,
    feedVisible: true,
    sponsored: false,
    viewedBy: [],
  };
}

export function distributePost(author: string, originalId: string): { ok: boolean; reason?: string; id?: string } {
  const original = posts.find((post) => post.id === originalId);
  if (!original) return { ok: false, reason: "That post does not exist." };
  const perms = repostPermissions(original.kind);
  if (!perms.distribute) return { ok: false, reason: perms.hint ?? "Quote the original post." };
  if (distributeBlockedByDislike(original.dislikes.includes(author))) {
    return { ok: false, reason: "A dislike blocks distribution of this post." };
  }
  const id = `dist-${original.id}-${Date.now()}`;
  emit([blank(author, id, "distribute", "", original.id), ...posts]);
  return { ok: true, id };
}

export function contributePost(
  author: string,
  originalId: string,
  body: string,
): { ok: boolean; reason?: string; id?: string } {
  const text = body.trim();
  if (!text) return { ok: false, reason: "Write your quote first." };
  const original = posts.find((post) => post.id === originalId);
  if (!original) return { ok: false, reason: "That post does not exist." };
  const perms = repostPermissions(original.kind);
  if (!perms.contribute) return { ok: false, reason: perms.hint ?? "Quote the original post." };
  const id = `contrib-${Date.now()}`;
  emit([blank(author, id, "contribute", text.slice(0, 500), original.id), ...posts]);
  return { ok: true, id };
}

export function publishPost(author: string, body: string) {
  const text = body.trim();
  if (!text) return;
  emit([blank(author, `local-${Date.now()}`, "original", text.slice(0, 500)), ...posts]);
}
