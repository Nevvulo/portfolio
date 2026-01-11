import { useCallback, useState } from "react";
import type { EmbedType, MessageEmbed } from "../../types/lounge";

export interface PendingAttachment {
  id: string;
  file: File;
  preview: string;
  type: EmbedType;
  status: "pending" | "uploading" | "complete" | "error";
  progress?: number;
  result?: UploadResult;
  error?: string;
}

interface UploadResult {
  url: string;
  type: EmbedType;
  filename: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
}

// File type validation
const ALLOWED_TYPES: Record<string, EmbedType> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/gif": "image",
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
  "audio/mpeg": "audio",
  "audio/mp3": "audio",
  "audio/wav": "audio",
  "audio/ogg": "audio",
  "audio/webm": "audio",
};

const MAX_SIZES: Record<EmbedType, number> = {
  image: 10 * 1024 * 1024, // 10MB
  video: 25 * 1024 * 1024, // 25MB
  audio: 15 * 1024 * 1024, // 15MB
  link: 0,
  youtube: 0,
};

const MAX_ATTACHMENTS = 10;

export function useMessageAttachments() {
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): { valid: boolean; type?: EmbedType; error?: string } => {
      const embedType = ALLOWED_TYPES[file.type];
      if (!embedType) {
        return {
          valid: false,
          error: `Unsupported file type: ${file.type || "unknown"}. Allowed: images, videos, audio.`,
        };
      }

      const maxSize = MAX_SIZES[embedType];
      if (file.size > maxSize) {
        const maxMB = maxSize / (1024 * 1024);
        return {
          valid: false,
          error: `${file.name} is too large. Maximum size for ${embedType} is ${maxMB}MB.`,
        };
      }

      return { valid: true, type: embedType };
    },
    [],
  );

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const newAttachments: PendingAttachment[] = [];

      // Check total count
      if (attachments.length + fileArray.length > MAX_ATTACHMENTS) {
        setError(`Maximum ${MAX_ATTACHMENTS} attachments allowed.`);
        return;
      }

      for (const file of fileArray) {
        const validation = validateFile(file);
        if (!validation.valid || !validation.type) {
          setError(validation.error || "Invalid file");
          continue;
        }

        // Create preview URL
        const preview = URL.createObjectURL(file);

        newAttachments.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          preview,
          type: validation.type,
          status: "pending",
        });
      }

      if (newAttachments.length > 0) {
        setAttachments((prev) => [...prev, ...newAttachments]);
        setError(null);
      }
    },
    [attachments.length, validateFile],
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const attachment = prev.find((a) => a.id === id);
      if (attachment?.preview) {
        URL.revokeObjectURL(attachment.preview);
      }
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    // Cleanup preview URLs
    attachments.forEach((a) => {
      if (a.preview) {
        URL.revokeObjectURL(a.preview);
      }
    });
    setAttachments([]);
    setError(null);
  }, [attachments]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadFile = async (attachment: PendingAttachment): Promise<UploadResult> => {
    const base64 = await fileToBase64(attachment.file);

    const response = await fetch("/api/lounge/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file: base64,
        filename: attachment.file.name,
        mimeType: attachment.file.type,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Upload failed");
    }

    return response.json();
  };

  const uploadAll = useCallback(async (): Promise<MessageEmbed[]> => {
    if (attachments.length === 0) return [];

    setIsUploading(true);
    setError(null);

    const embeds: MessageEmbed[] = [];

    try {
      // Upload sequentially to avoid overwhelming the server
      for (const attachment of attachments) {
        if (attachment.status === "complete" && attachment.result) {
          // Already uploaded
          embeds.push(resultToEmbed(attachment.result));
          continue;
        }

        // Update status to uploading
        setAttachments((prev) =>
          prev.map((a) => (a.id === attachment.id ? { ...a, status: "uploading" as const } : a)),
        );

        try {
          const result = await uploadFile(attachment);

          // Update status to complete
          setAttachments((prev) =>
            prev.map((a) =>
              a.id === attachment.id ? { ...a, status: "complete" as const, result } : a,
            ),
          );

          embeds.push(resultToEmbed(result));
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Upload failed";
          setAttachments((prev) =>
            prev.map((a) =>
              a.id === attachment.id ? { ...a, status: "error" as const, error: errorMessage } : a,
            ),
          );
          throw err;
        }
      }

      return embeds;
    } finally {
      setIsUploading(false);
    }
  }, [attachments]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    attachments,
    addFiles,
    removeAttachment,
    uploadAll,
    clearAll,
    isUploading,
    error,
    clearError,
  };
}

function resultToEmbed(result: UploadResult): MessageEmbed {
  return {
    type: result.type,
    url: result.url,
    filename: result.filename,
    mimeType: result.mimeType,
    fileSize: result.fileSize,
    width: result.width,
    height: result.height,
  };
}
