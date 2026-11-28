"use client";

import { useSyncExternalStore } from "react";
import type { Region } from "@/lib/engine";

export interface WithdrawalRequest {
  id: string;
  username: string;
  region: Region;
  amount: number;
  currency: "NGN" | "USD";
  status: "pending" | "approved" | "rejected";
}

export interface Complaint {
  id: string;
  username: string;
  body: string;
}

export interface ContentReport {
  id: string;
  username: string;
  targetType: "post" | "comment" | "profile";
  targetLabel: string;
  reason: string;
  details: string;
}

interface Inbox {
  withdrawals: WithdrawalRequest[];
  complaints: Complaint[];
  reports: ContentReport[];
}

let inbox: Inbox = { withdrawals: [], complaints: [], reports: [] };
const listeners = new Set<() => void>();

function emit(next: Inbox) {
  inbox = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function snapshot() {
  return inbox;
}

export function useAdminInbox(): Inbox {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function addWithdrawal(request: Omit<WithdrawalRequest, "id" | "status">) {
  emit({
    ...inbox,
    withdrawals: [{ ...request, id: `wd-${Date.now()}`, status: "pending" }, ...inbox.withdrawals],
  });
}

export function setWithdrawalStatus(id: string, status: WithdrawalRequest["status"]) {
  emit({
    ...inbox,
    withdrawals: inbox.withdrawals.map((item) => (item.id === id ? { ...item, status } : item)),
  });
}

export function addComplaint(username: string, body: string) {
  emit({ ...inbox, complaints: [{ id: `cp-${Date.now()}`, username, body }, ...inbox.complaints] });
}

export function addContentReport(report: Omit<ContentReport, "id">) {
  emit({ ...inbox, reports: [{ ...report, id: `rp-${Date.now()}` }, ...inbox.reports] });
}
