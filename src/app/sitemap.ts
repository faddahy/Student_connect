import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/about", "/guidelines", "/terms", "/privacy", "/signup", "/login"].map((p) => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: "monthly",
  }));
}
