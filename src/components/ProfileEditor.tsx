"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { DEPARTMENTS, GENDERS, INTERESTS, LEVELS, isSupabaseConfigured, photoUrl } from "@/lib/config";
import type { Gender, MyProfile } from "@/lib/types";
import { FormStatus } from "@/components/FormStatus";

const MAX_PHOTOS = 4;

function maxDob(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().slice(0, 10);
}

function ageFrom(dob: string): number {
  const b = new Date(dob);
  const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a;
}

export function ProfileEditor({ profile, mode }: { profile: MyProfile; mode: "onboarding" | "edit" }) {
  const live = isSupabaseConfigured();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [dob, setDob] = useState(profile.dob ?? "");
  const [gender, setGender] = useState<Gender | "">(profile.gender ?? "");
  const [interestedIn, setInterestedIn] = useState<Gender[]>(profile.interested_in ?? []);
  const [department, setDepartment] = useState(profile.department ?? "");
  const [level, setLevel] = useState<number | "">(profile.level ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [interests, setInterests] = useState<string[]>(profile.interests ?? []);
  const [photos, setPhotos] = useState<string[]>(profile.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  const dobLocked = mode === "edit" && !!profile.dob;

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(undefined);
    setUploading(true);
    try {
      const room = MAX_PHOTOS - photos.length;
      const added: string[] = [];
      for (const file of Array.from(files).slice(0, room)) {
        if (!file.type.startsWith("image/")) continue;
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.35,
          maxWidthOrHeight: 1080,
          useWebWorker: true,
          fileType: "image/webp",
        });
        if (!live) {
          added.push(URL.createObjectURL(compressed));
          continue;
        }
        const supabase = createClient();
        const path = `${profile.id}/${crypto.randomUUID()}.webp`;
        const { error: upErr } = await supabase.storage.from("photos").upload(path, compressed, {
          contentType: "image/webp",
          cacheControl: "31536000",
        });
        if (upErr) throw upErr;
        added.push(path);
      }
      const next = [...photos, ...added];
      setPhotos(next);
      if (mode === "edit" && live) await createClient().from("profiles").update({ photos: next }).eq("id", profile.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removePhoto(path: string) {
    if (mode === "edit" && photos.length <= 1) {
      setError("Keep at least one photo.");
      return;
    }
    const next = photos.filter((p) => p !== path);
    setPhotos(next);
    if (!live) return;
    const supabase = createClient();
    await supabase.from("profiles").update({ photos: next }).eq("id", profile.id);
    await supabase.storage.from("photos").remove([path]);
  }

  function makeMain(path: string) {
    setPhotos([path, ...photos.filter((p) => p !== path)]);
  }

  function toggle<T>(list: T[], v: T, set: (x: T[]) => void, max = 99) {
    if (list.includes(v)) set(list.filter((x) => x !== v));
    else if (list.length < max) set([...list, v]);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setMessage(undefined);
    if (displayName.trim().length < 2) return setError("Enter your first name or nickname.");
    if (!dob) return setError("Enter your date of birth.");
    if (ageFrom(dob) < 18) return setError("You must be 18 or older.");
    if (!gender) return setError("Select your gender.");
    if (!interestedIn.length) return setError("Select who you're interested in.");
    if (!photos.length) return setError("Add at least one clear photo of yourself.");

    if (!live) {
      setMessage(mode === "onboarding" ? "Profile saved in demo mode. You already follow @yagyok." : "Profile saved in demo mode.");
      if (mode === "onboarding") router.push("/kyc");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        dob,
        gender,
        interested_in: interestedIn,
        department: department || null,
        level: level || null,
        bio: bio.trim() || null,
        interests,
        photos,
        onboarded: true,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (err) return setError(err.message);
    if (mode === "onboarding") {
      router.push("/feed");
      router.refresh();
    } else {
      setMessage("Profile saved.");
      router.refresh();
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <section>
        <p className="label">Photos ({photos.length}/{MAX_PHOTOS})</p>
        <div className="grid grid-cols-2 gap-3">
          {photos.map((p, i) => (
            <div key={p} className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl(p)} alt="" className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold">Main</span>}
              <div className="absolute inset-x-2 bottom-2 flex gap-2">
                {i !== 0 && (
                  <button type="button" onClick={() => makeMain(p)} className="flex-1 rounded-full bg-white/90 py-1 text-xs font-semibold">Make main</button>
                )}
                <button type="button" onClick={() => removePhoto(p)} className="rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">Remove</button>
              </div>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="grid aspect-[3/4] place-items-center rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50 text-brand-600">
              <span className="text-center text-sm font-semibold">{uploading ? "Uploading…" : <>＋<br />Add photo</>}</span>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
        <p className="mt-2 text-xs text-ink/50">Use real photos of yourself. Photos are compressed before upload to save your data.</p>
      </section>

      <div>
        <label className="label" htmlFor="name">Display name</label>
        <input id="name" className="input" maxLength={40} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Amina" />
      </div>

      <div>
        <label className="label" htmlFor="dob">Date of birth</label>
        <input id="dob" type="date" className="input" max={maxDob()} value={dob} disabled={dobLocked} onChange={(e) => setDob(e.target.value)} />
        <p className="mt-1 text-xs text-ink/50">{dobLocked ? "Contact support to correct your date of birth." : "You must be 18+. Only your age is shown to others."}</p>
      </div>

      <div>
        <p className="label">I am a</p>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <button type="button" key={g.value} onClick={() => setGender(g.value)} className={`chip ${gender === g.value ? "chip-on" : "bg-white"}`}>{g.label}</button>
          ))}
        </div>
      </div>

      <div>
        <p className="label">Show me</p>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <button type="button" key={g.value} onClick={() => toggle(interestedIn, g.value as Gender, setInterestedIn)}
              className={`chip ${interestedIn.includes(g.value) ? "chip-on" : "bg-white"}`}>{g.plural}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="label" htmlFor="dept">Department</label>
          <select id="dept" className="input" value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">Select…</option>
            {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="level">Level</label>
          <select id="level" className="input" value={level} onChange={(e) => setLevel(e.target.value ? Number(e.target.value) : "")}>
            <option value="">—</option>
            {LEVELS.map((l) => <option key={l} value={l}>{l}L</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="bio">Bio</label>
        <textarea id="bio" className="input min-h-28" maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Say something fun about yourself…" />
        <p className="mt-1 text-right text-xs text-ink/40">{bio.length}/500</p>
      </div>

      <div>
        <p className="label">Interests (up to 10)</p>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
            <button type="button" key={i} onClick={() => toggle(interests, i, setInterests, 10)} className={`chip ${interests.includes(i) ? "chip-on" : "bg-white"}`}>{i}</button>
          ))}
        </div>
      </div>

      <FormStatus error={error} message={message} />
      <button className="btn-primary w-full" disabled={saving || uploading}>
        {saving ? "Saving…" : mode === "onboarding" ? "Start meeting people" : "Save changes"}
      </button>
    </form>
  );
}
