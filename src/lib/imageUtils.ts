import { supabase } from './supabase';

/**
 * Fetches an image from Supabase storage and returns it as a data URL
 * This helps bypass CORS issues when loading images directly from Supabase
 * @param url The Supabase storage URL
 * @returns A Promise that resolves to a data URL or the original URL if fetching fails
 */
export async function getImageAsDataUrl(url: string): Promise<string> {
  // If URL is empty or null, return empty string
  if (!url) {
    return '';
  }

  // If it's already a data URL, return as is
  if (url.startsWith('data:')) {
    return url;
  }
  
  // If it's a blob URL, verify it exists and convert it
  if (url.startsWith('blob:')) {
    try {
      console.log('Converting blob URL to data URL:', url);
      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } else {
        console.warn('Blob URL fetch failed with status:', response.status);
        return url; // Return original URL as fallback
      }
    } catch (error) {
      console.error('Error converting blob URL to data URL:', error);
      return url; // Return original URL as fallback
    }
  }
  
  // If it's not a Supabase URL, return as is
  if (!url.includes('supabase.co/storage')) {
    return url;
  }
  
  try {
    // Extract the bucket and path from the URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
    const urlParts = url.split('/storage/v1/object/public/');
    if (urlParts.length !== 2) {
      console.error('Invalid Supabase storage URL format:', url);
      return url; // Return original URL instead of throwing
    }

    const [_, bucketAndPath] = urlParts;
    const firstSlashIndex = bucketAndPath.indexOf('/');
    if (firstSlashIndex === -1) {
      console.error('Invalid bucket and path format:', bucketAndPath);
      return url; // Return original URL instead of throwing
    }

    const bucket = bucketAndPath.substring(0, firstSlashIndex);
    const path = bucketAndPath.substring(firstSlashIndex + 1);

    console.log(`Fetching image from bucket: ${bucket}, path: ${path}`);

    // Use Supabase SDK to download the file
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error) {
      console.error('Error downloading image from Supabase:', error);
      return url; // Return original URL on error
    }

    if (!data) {
      console.error('No data received from Supabase storage');
      return url; // Return original URL if no data
    }
    
    console.log('Successfully downloaded image via Supabase SDK, content type:', data.type);

    // Convert the blob to a data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const result = reader.result as string;
        if (result && result.startsWith('data:')) {
          console.log('Successfully converted to data URL via SDK');
          resolve(result);
        } else {
          console.error('Failed to create valid data URL via SDK');
          resolve(url); // Return original URL on failure
        }
      };
      
      reader.onerror = (e) => {
        console.error('FileReader error:', e);
        resolve(url); // Return original URL on FileReader error
      };
      
      reader.readAsDataURL(data);
    });
  } catch (error) {
    console.error('Error converting image to data URL:', error);
    return url; // Return original URL on any error
  }
}

/**
 * Checks if a URL is a Supabase storage URL
 * @param url The URL to check
 * @returns True if the URL is a Supabase storage URL
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('supabase.co/storage');
}

/**
 * Extracts the filename from a URL
 * @param url The URL to extract the filename from
 * @returns The filename
 */
export function getFilenameFromUrl(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1];
}
