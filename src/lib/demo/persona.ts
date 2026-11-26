import "server-only";
import { cookies } from "next/headers";
import { personByUsername, type DemoPerson, type PersonaId } from "@/lib/demo/data";

export async function readPersonaId(): Promise<PersonaId> {
  const value = (await cookies()).get("fs_persona")?.value;
  if (value === "tunde" || value === "yagyok" || value === "ada") return value;
  return "ada";
}

export async function readPersona(): Promise<DemoPerson> {
  const id = await readPersonaId();
  return personByUsername(id) ?? personByUsername("ada")!;
}
