export function naira(amount: number): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return `₦${value.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
}

export function usd(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function hoursAgoLabel(hours: number): string {
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
