import { useState, useCallback } from "react";
import type { BannerUploadResult } from "../../types/user-popout";

/**
 * Hook to handle banner image upload
 */
export function useBannerUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Convert a File to base64 data URL
   */
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * Upload a banner image
   */
  const upload = useCallback(
    async (file: File, focalY: number = 50): Promise<BannerUploadResult | null> => {
      setIsUploading(true);
      setError(null);

      try {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          throw new Error("Please select an image file");
        }

        // Validate file size (max 4MB)
        if (file.size > 4 * 1024 * 1024) {
          throw new Error("Image must be less than 4MB");
        }

        // Convert to base64
        const base64 = await fileToBase64(file);

        // Upload to API
        const res = await fetch("/api/user/banner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64,
            focalY,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to upload banner");
        }

        const result = await res.json();
        return {
          url: result.url,
          focalY: result.focalY,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to upload banner";
        setError(message);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  /**
   * Remove the current banner
   */
  const remove = useCallback(async (): Promise<boolean> => {
    setIsUploading(true);
    setError(null);

    try {
      const res = await fetch("/api/user/banner", {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove banner");
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove banner";
      setError(message);
      return false;
    } finally {
      setIsUploading(false);
    }
  }, []);

  /**
   * Clear any error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    upload,
    remove,
    isUploading,
    error,
    clearError,
  };
}
