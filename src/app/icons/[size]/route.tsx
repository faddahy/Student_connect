import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export function generateStaticParams() {
  return [{ size: "180" }, { size: "192" }, { size: "512" }];
}

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params;
  const size = [180, 192, 512].includes(Number(raw)) ? Number(raw) : 192;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f43f6b 0%, #d946ef 100%)",
        }}
      >
        <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="white">
          <path d="M12 21s-7.5-4.6-10-9.3C.4 8.6 2.2 4.5 6 4.1c2.1-.2 3.6 1 4.4 2.2l1.6 2 1.6-2c.8-1.2 2.3-2.4 4.4-2.2 3.8.4 5.6 4.5 4 7.6C19.5 16.4 12 21 12 21z" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
