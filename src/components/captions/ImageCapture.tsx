import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getImageAsDataUrl } from '../../lib/imageUtils';
import './ImageCapture.css';

// Add TypeScript declarations for our global variables
declare global {
  interface Window {
    tempImageBlobs?: Blob[];
    tempImageUrls?: string[];
  }
}

interface ImageCaptureProps {
  onImageCaptured: (previewUrl: string, storageUrl: string | null) => void;
  dealershipId: number | null;
}

const ImageCapture: React.FC<ImageCaptureProps> = ({ onImageCaptured, dealershipId }) => {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [blobUrls, setBlobUrls] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if the device has a camera
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if the device has a camera
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          setHasCamera(true);
          // Release the camera immediately
          stream.getTracks().forEach(track => track.stop());
        })
        .catch(() => {
          setHasCamera(false);
        });
    }
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment', // Use the back camera if available
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsCameraActive(true);
        }
      } else {
        setError('Camera access not supported by your browser');
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to canvas
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
          if (blob) {
            // Create a File object from the Blob for compatibility
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            await uploadImage(file, file.name);
          }
        }, 'image/jpeg', 0.8);
      }
    }
    // Stop the camera after capturing
    stopCamera();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      // Validate that it's an image file
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (JPEG, PNG, GIF, etc.)');
        return;
      }
      
      await uploadImage(file, file.name);
    }
  };

  // Function to create a blob URL and track it for cleanup
  const createAndTrackBlobUrl = (file: File | Blob) => {
    const tempUrl = URL.createObjectURL(file);
    setBlobUrls(prev => [...prev, tempUrl]);
    // We don't need to store the blobs themselves, just track the URLs for cleanup
    return tempUrl;
  };

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      // Revoke all blob URLs to prevent memory leaks
      blobUrls.forEach(url => {
        try {
          URL.revokeObjectURL(url);
          console.log('Revoked blob URL:', url);
        } catch (e) {
          console.error('Failed to revoke blob URL:', e);
        }
      });
      
      // Also clean up any URLs stored in the window object
      if (window.tempImageUrls && window.tempImageUrls.length > 0) {
        window.tempImageUrls.forEach(url => {
          try {
            URL.revokeObjectURL(url);
            console.log('Revoked window blob URL:', url);
          } catch (e) {
            console.error('Failed to revoke window blob URL:', e);
          }
        });
        window.tempImageUrls = [];
      }
    };
  }, [blobUrls]);

  const uploadImage = async (file: File | Blob, fileName: string) => {
    if (!dealershipId) {
      setError('No dealership ID available. Please try again later.');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      console.log('Starting image upload process...');
      
      // Determine the correct file extension based on MIME type
      let fileExt = fileName.split('.').pop()?.toLowerCase();
      const mimeType = file.type || 'image/jpeg';
      
      // If no extension or doesn't match MIME type, use MIME type to determine extension
      if (!fileExt || !fileExt.match(/^(jpg|jpeg|png|gif|webp|bmp|svg)$/)) {
        switch(mimeType) {
          case 'image/jpeg': fileExt = 'jpg'; break;
          case 'image/png': fileExt = 'png'; break;
          case 'image/gif': fileExt = 'gif'; break;
          case 'image/webp': fileExt = 'webp'; break;
          case 'image/bmp': fileExt = 'bmp'; break;
          case 'image/svg+xml': fileExt = 'svg'; break;
          default: fileExt = 'jpg'; // Default to jpg
        }
      }
      
      // Generate a unique file name to prevent collisions
      const uniqueFileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = `dealership-${dealershipId}/${uniqueFileName}`;
      
      console.log(`Uploading to path: ${filePath} with type: ${mimeType}`);
      
      // Create a blob URL for immediate preview while uploading
      const previewUrl = createAndTrackBlobUrl(file);
      
      try {
        // Try to upload directly to the bucket
        const { error } = await supabase.storage
          .from('social-media-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: mimeType // Explicitly set content type
          });
          
        if (error) {
          throw error;
        }
        
        // Construct the public URL manually
        // This is more reliable than using getPublicUrl which might not work correctly
        // with certain Supabase configurations
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/social-media-images/${filePath}`;
        console.log('Image uploaded successfully:', publicUrl);
        
        // We'll use the blob URL for preview and the public URL for storage
        setIsUploading(false);
        setUploadProgress(100);
        onImageCaptured(previewUrl, publicUrl);
      } catch (uploadError) {
        console.error('Supabase storage upload error:', uploadError);
        
        setError('Failed to upload image to storage. Using local preview instead.');
        setIsUploading(false);
        setUploadProgress(100);
        onImageCaptured(previewUrl, null);
      }
    } catch (error) {
      console.error('Error in image processing:', error);
      
      // Create a temporary URL for the image as fallback
      const tempUrl = createAndTrackBlobUrl(file);
      
      setError('Failed to process image. Using local preview instead.');
      setIsUploading(false);
      setUploadProgress(100);
      onImageCaptured(tempUrl, null);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="image-capture-container">
      {error && <div className="error-message">{error}</div>}
      
      <div className="capture-options">
        {hasCamera && (
          <button 
            className="btn btn-primary capture-btn"
            onClick={isCameraActive ? captureImage : startCamera}
            disabled={isUploading}
          >
            {isCameraActive ? 'Take Photo' : 'Open Camera'}
          </button>
        )}
        
        <button 
          className="btn btn-secondary upload-btn"
          onClick={triggerFileInput}
          disabled={isUploading}
        >
          Upload from Device
        </button>
        
        {isCameraActive && (
          <button 
            className="btn btn-outline-secondary cancel-btn"
            onClick={stopCamera}
          >
            Cancel
          </button>
        )}
      </div>
      
      {isCameraActive && (
        <div className="video-container">
          <video ref={videoRef} className="camera-preview" autoPlay playsInline />
        </div>
      )}
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <input 
        type="file" 
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      {isUploading && (
        <div className="upload-progress">
          <div className="progress">
            <div 
              className="progress-bar" 
              role="progressbar" 
              style={{ width: `${uploadProgress}%` }}
              aria-valuenow={uploadProgress} 
              aria-valuemin={0} 
              aria-valuemax={100}
            >
              {uploadProgress}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCapture;
