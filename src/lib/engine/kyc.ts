export type KycAudience = "nigerian" | "other";

export interface KycRequirement {
  audience: KycAudience;
  selfie: true;
  document: "nin" | "national_id";
  documentLabel: string;
}

export function kycRequirement(nigerian: boolean): KycRequirement {
  if (nigerian) {
    return {
      audience: "nigerian",
      selfie: true,
      document: "nin",
      documentLabel: "National Identification Number (NIN) slip",
    };
  }
  return {
    audience: "other",
    selfie: true,
    document: "national_id",
    documentLabel: "National ID card",
  };
}

export interface CaptureFile {
  /** True only for a file coming from an input that has the capture attribute, or a getUserMedia still. */
  fromLiveCapture: boolean;
  lastModified: number;
}

/**
 * Gallery uploads are rejected. A file must come from the live camera
 * (getUserMedia still, or a capture=user/environment input) and be fresh.
 */
export function acceptLiveCapture(
  file: CaptureFile,
  now = Date.now(),
  maxAgeMs = 20_000,
): { ok: boolean; reason?: string } {
  if (!file.fromLiveCapture) {
    return {
      ok: false,
      reason: "Gallery uploads are not accepted. Capture this with the live camera.",
    };
  }
  if (!Number.isFinite(file.lastModified) || now - file.lastModified > maxAgeMs) {
    return {
      ok: false,
      reason: "This photo looks saved on your device. Take a new picture with the camera.",
    };
  }
  if (file.lastModified - now > 5_000) {
    return { ok: false, reason: "Unrecognised capture timestamp." };
  }
  return { ok: true };
}
