import { supabase } from "@/lib/supabase"

/**
 * Direct Supabase Media Database Service
 * - Stores compressed media metadata & assets directly in Supabase Cloud Database (`project_media_assets` table)
 * - Zero browser localStorage or IndexedDB dependencies
 */

export interface SupabaseMediaAssetRecord {
  id: string
  filename: string
  media_type: "image" | "video" | "poster"
  mime_type: string
  file_size_bytes: number
  width?: number
  height?: number
  storage_url: string
  created_at?: string
}

/**
 * Saves compressed media file metadata and payload directly to Supabase `project_media_assets` table
 */
export async function saveMediaAsset(
  id: string,
  blobOrFile: Blob | File,
  meta?: { filename?: string; mediaType?: "image" | "video" | "poster"; dataUrl?: string }
): Promise<string> {
  const mimeType = blobOrFile.type || "image/webp"
  const mediaType = meta?.mediaType || (mimeType.startsWith("video/") ? "video" : "image")
  const filename = meta?.filename || (blobOrFile instanceof File ? blobOrFile.name : `${id}.${mimeType.split("/")[1] || "bin"}`)
  const fileSize = blobOrFile.size || 0

  let storageUrl = meta?.dataUrl || ""

  // Convert Blob to Data URL payload if dataUrl not provided directly
  if (!storageUrl) {
    storageUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve((e.target?.result as string) || "")
      reader.onerror = () => resolve("")
      reader.readAsDataURL(blobOrFile)
    })
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  const dbPayload: Record<string, any> = {
    filename,
    media_type: mediaType,
    mime_type: mimeType,
    file_size_bytes: fileSize,
    storage_url: storageUrl,
  }

  if (isUuid) {
    dbPayload.id = id
  }

  try {
    const { data, error } = await supabase
      .from("project_media_assets")
      .insert(dbPayload)
      .select()

    if (error) {
      console.warn("Supabase project_media_assets insert notice:", error.message)
    }

    if (data && data[0]?.id) {
      return data[0].id
    }
  } catch (err) {
    console.error("Failed to store media asset in Supabase database:", err)
  }

  return id
}

/**
 * Retrieves media URL directly from Supabase `project_media_assets` table by asset ID
 */
export async function resolveMediaUrl(mediaUrlOrId: string): Promise<string> {
  if (!mediaUrlOrId) return ""
  if (
    mediaUrlOrId.startsWith("http://") ||
    mediaUrlOrId.startsWith("https://") ||
    mediaUrlOrId.startsWith("data:")
  ) {
    return mediaUrlOrId
  }

  try {
    const { data, error } = await supabase
      .from("project_media_assets")
      .select("storage_url")
      .eq("id", mediaUrlOrId)
      .single()

    if (error || !data || !data.storage_url) {
      return mediaUrlOrId
    }

    return data.storage_url
  } catch (err) {
    console.error("Failed to resolve media URL from Supabase:", err)
    return mediaUrlOrId
  }
}

/**
 * Deletes a media record directly from Supabase `project_media_assets` table
 */
export async function deleteMediaAsset(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("project_media_assets").delete().eq("id", id)
    if (error) {
      console.warn("Supabase project_media_assets delete notice:", error.message)
    }
  } catch (err) {
    console.error("Failed to delete media asset from Supabase database:", err)
  }
}
