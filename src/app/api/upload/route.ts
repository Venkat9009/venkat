import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { checkAuth, verifySameOrigin } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rl = rateLimit(`upload:${ip}`, 20, 3600000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    // SVG intentionally not allowed: inline <script> XSS vector.
    return NextResponse.json({ error: "Invalid file type. Allowed: jpg, png, webp, gif, avif (no SVG)" }, { status: 400 });
  }

  // Verify magic bytes — file.type is client-controlled and can't be trusted.
  try {
    const buf = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    const isGif = buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38;
    const isWebp = buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;
    // AVIF: ftyp box + avif-brand (avif/avis/mif1/msf1/heic). Bare ftyp
    // matches MP4/MOV — must check brand bytes 8-11.
    const brand = String.fromCharCode(buf[8] || 0, buf[9] || 0, buf[10] || 0, buf[11] || 0);
    const hasFtyp = buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70;
    const isAvif = hasFtyp && ["avif", "avis", "mif1", "msf1", "heic"].includes(brand);
    const typeOk =
      (file.type === "image/jpeg" && isJpeg) ||
      (file.type === "image/png" && isPng) ||
      (file.type === "image/gif" && isGif) ||
      (file.type === "image/webp" && isWebp) ||
      (file.type === "image/avif" && isAvif);
    if (!typeOk) {
      return NextResponse.json({ error: "File content does not match its type" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Could not read file" }, { status: 400 });
  }

  const ext = EXT_BY_TYPE[file.type] || "jpg";
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const filename = `${Date.now()}-${random}.${ext}`;

  const { error } = await db.storage
    .from("blog-images")
    .upload(filename, file, { contentType: file.type, upsert: false, cacheControl: "31536000" });

  if (error) {
    console.error("[upload]", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }

  const { data: urlData } = db.storage.from("blog-images").getPublicUrl(filename);

  return NextResponse.json({ url: urlData.publicUrl });
}
