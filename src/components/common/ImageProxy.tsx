import React, { useState, useEffect } from 'react';
import imagePlaceholder from '../../assets/image-placeholder.svg';
import { getImageAsDataUrl, isSupabaseStorageUrl } from '../../lib/imageUtils';

// Cache for data URLs to avoid repeated conversions
const dataUrlCache: Record<string, string> = {};

interface ImageProxyProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * ImageProxy component handles loading images from Supabase storage
 * with fallback to a placeholder if the image fails to load
 */
const ImageProxy: React.FC<ImageProxyProps> = ({ 
  src, 
  alt, 
  className = '', 
  onLoad,
  onError
}) => {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    // Reset states when src changes
    setLoading(true);
    setError(false);
    
    // Handle blob URLs directly - they're already optimized for local preview
    if (src.startsWith('blob:')) {
      console.log('Using blob URL directly:', src);
      setImageSrc(src);
      setLoading(false);
      return;
    }
    
    // Handle data URLs directly
    if (src.startsWith('data:')) {
      console.log('Using data URL directly');
      setImageSrc(src);
      setLoading(false);
      return;
    }
    
    // If it's a Supabase URL, convert it to a data URL
    if (isSupabaseStorageUrl(src)) {
      // Check if we already have this URL in cache
      if (dataUrlCache[src]) {
        console.log('Using cached data URL');
        setImageSrc(dataUrlCache[src]);
        setLoading(false);
        return;
      }
      
      console.log('Converting Supabase URL to data URL:', src);
      getImageAsDataUrl(src)
        .then(dataUrl => {
          // If getImageAsDataUrl returned the original URL, it means conversion failed
          // but we'll still try to use it directly
          if (dataUrl === src) {
            console.log('Using original URL as fallback');
            setImageSrc(src);
            setLoading(false);
            return;
          }
          
          console.log('Successfully converted to data URL');
          // Cache the data URL for future use
          dataUrlCache[src] = dataUrl;
          // Set the data URL as the image source
          setImageSrc(dataUrl);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to convert to data URL:', err);
          // Try using the original URL as a fallback
          setImageSrc(src);
          setLoading(false);
        });
    } else {
      setImageSrc(src);
      setLoading(false);
    }
  }, [src]);

  // We're already handling Supabase URLs in the useEffect hook
  
  const handleError = () => {
    console.error(`Failed to load image: ${src}`);
    
    // If we're already showing a data URL or placeholder, don't try to change it again
    if (!error) {
      setError(true);
      setLoading(false);
      setImageSrc(imagePlaceholder);
      onError?.();
    }
  };

  const handleLoad = () => {
    setLoading(false);
    onLoad?.();
  };

  // For data URLs, we'll simply use an img tag since we know it's safe
  // Data URLs don't have CORS issues
  const isDataUrl = imageSrc.startsWith('data:');
  
  return (
    <div className={`image-proxy-container ${className}`}>
      {loading && <div className="image-loading">Loading...</div>}
      <img
        src={imageSrc}
        alt={alt}
        className={`image-proxy ${error ? 'image-error' : ''} ${loading ? 'loading' : 'loaded'} ${isDataUrl ? 'data-url' : ''}`}
        onError={handleError}
        onLoad={handleLoad}
        style={{
          maxWidth: '100%',
          maxHeight: '300px',
          objectFit: 'contain'
        }}
        {...(!isDataUrl ? { crossOrigin: "anonymous" } : {})}
      />
    </div>
  );
};

export default ImageProxy;
