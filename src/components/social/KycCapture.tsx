"use client";

import { useEffect, useRef, useState } from "react";
import { acceptLiveCapture, kycRequirement } from "@/lib/engine";

type Shot = { label: string; url: string };

export function KycCapture({ nigerianDefault = true }: { nigerianDefault?: boolean }) {
  const [nigerian, setNigerian] = useState(nigerianDefault);
  const [shots, setShots] = useState<Shot[]>([]);
  const [error, setError] = useState<string>();
  const [live, setLive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requirement = kycRequirement(nigerian);
  const need = requirement.document === "nin" ? "NIN slip" : "national ID";

  useEffect(() => () => stop(), []);

  async function start(facing: "user" | "environment") {
    setError(undefined);
    stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setLive(true);
    } catch {
      setLive(false);
      setError("The camera did not open. Allow camera access and try again. Gallery uploads stay off.");
    }
  }

  function stop() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setLive(false);
  }

  function snap(label: string) {
    const video = videoRef.current;
    if (!video || !live) {
      setError("Start the live camera before capturing.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const check = acceptLiveCapture({ fromLiveCapture: true, lastModified: Date.now() });
    if (!check.ok) {
      setError(check.reason);
      return;
    }
    setShots((current) => [...current.filter((shot) => shot.label !== label), { label, url: canvas.toDataURL("image/jpeg", 0.85) }]);
    setError(undefined);
  }

  function onCapturedFile(file: File | undefined, fromCaptureInput: boolean, label: string) {
    if (!file) return;
    const verdict = acceptLiveCapture({ fromLiveCapture: fromCaptureInput, lastModified: file.lastModified });
    if (!verdict.ok) {
      setError(verdict.reason);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setShots((current) => [...current.filter((shot) => shot.label !== label), { label, url: String(reader.result) }]);
    };
    reader.readAsDataURL(file);
  }

  const selfie = shots.find((shot) => shot.label === "selfie");
  const documentShot = shots.find((shot) => shot.label === "document");

  return (
    <div data-testid="kyc" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setError("Gallery uploads are not accepted. Use the live camera."); }}>
      <div className="mb-4 flex rounded-full bg-navy p-1 text-sm font-semibold">
        <button type="button" className={`flex-1 rounded-full py-2 ${nigerian ? "bg-brand-500 text-white" : "text-ink/60"}`} onClick={() => setNigerian(true)}>Nigerian · selfie + NIN</button>
        <button type="button" className={`flex-1 rounded-full py-2 ${!nigerian ? "bg-brand-500 text-white" : "text-ink/60"}`} onClick={() => setNigerian(false)}>Other · selfie + national ID</button>
      </div>
      <p className="mb-3 text-sm text-ink/65">
        {requirement.documentLabel}. Photos must come from the live camera. Dropped files and gallery picks are rejected.
      </p>
      <div className="overflow-hidden rounded-3xl bg-black ring-1 ring-white/10">
        <video ref={videoRef} playsInline autoPlay muted className={`aspect-[3/4] w-full object-cover ${live ? "" : "hidden"}`} />
        {!live && <div className="grid aspect-[3/4] place-items-center text-sm text-ink/50">Camera preview</div>}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" className="btn-primary py-2 text-sm" onClick={() => start("user")}>Front camera</button>
        <button type="button" className="btn-ghost py-2 text-sm" onClick={() => start("environment")}>Back camera</button>
        <button type="button" className="btn-ghost py-2 text-sm" onClick={() => snap("selfie")}>Capture selfie</button>
        <button type="button" className="btn-ghost py-2 text-sm" onClick={() => snap("document")}>Capture {need}</button>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-ink/50">
        <label className="block">
          Phone camera shortcut for the selfie
          <input
            className="mt-1 block w-full text-sm"
            type="file"
            accept="image/*"
            capture="user"
            onChange={(event) => onCapturedFile(event.target.files?.[0], true, "selfie")}
          />
        </label>
        <label className="block">
          Phone camera shortcut for the {need}
          <input
            className="mt-1 block w-full text-sm"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => onCapturedFile(event.target.files?.[0], event.currentTarget.hasAttribute("capture"), "document")}
          />
        </label>
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <ShotPreview label="Selfie" shot={selfie} />
        <ShotPreview label={need} shot={documentShot} />
      </div>
      {selfie && documentShot && (
        <p className="mt-4 rounded-2xl bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
          Live captures saved on this device. A reviewer confirms them before the blue tick turns on.
        </p>
      )}
    </div>
  );
}

function ShotPreview({ label, shot }: { label: string; shot?: Shot }) {
  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
      {shot ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shot.url} alt={label} className="aspect-square w-full object-cover" />
      ) : (
        <div className="grid aspect-square place-items-center text-xs text-ink/40">No {label.toLowerCase()} yet</div>
      )}
      <p className="px-2 py-1 text-center text-xs font-semibold">{label}</p>
    </div>
  );
}
