import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
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
            await uploadImage(file);
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
      
      await uploadImage(file);
    }
  };

  // We'll use the blobUrls state directly in the uploadImage function

  // Only clean up blob URLs when component is unmounted AND after a delay
  // This ensures the ImageProxy component has time to convert blob URLs to data URLs
  useEffect(() => {
    return () => {
      // Delay revoking blob URLs to give ImageProxy time to process them
      setTimeout(() => {
        // Clean up any blob URLs we created
        blobUrls.forEach(url => {
          try {
            URL.revokeObjectURL(url);
            console.log('Revoked blob URL after delay:', url);
          } catch (e) {
            console.error('Error revoking blob URL:', e);
          }
        });
        
        // Also clean up any globally tracked URLs
        if (window.tempImageUrls && window.tempImageUrls.length > 0) {
          console.log('Cleaning up global temp image URLs');
          window.tempImageUrls = [];
        }
      }, 5000); // 5 second delay before revoking
    };
  }, [blobUrls]);

  const uploadImage = async (file: File | Blob): Promise<{ previewUrl: string; storageUrl: string | null }> => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Generate a unique filename with timestamp
      const timestamp = new Date().getTime();
      const randomString = Math.random().toString(36).substring(2, 10);
      
      // Determine file extension and content type
      let fileExtension = '';
      let contentType = '';
      let fileName = '';
      
      if (file instanceof File) {
        // For File objects, we can get the name and type directly
        fileName = file.name;
        fileExtension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
        contentType = file.type || 'image/jpeg';
      } else {
        // For Blob objects (from canvas), we need to infer the type
        contentType = file.type || 'image/jpeg';
        fileExtension = contentType.split('/').pop() || 'jpg';
        fileName = `image-${timestamp}.${fileExtension}`;
      }
      
      // Ensure we have a valid extension and content type match
      if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension.toLowerCase())) {
        fileExtension = 'jpg'; // Default to jpg if unknown extension
      }
      
      // Make sure content type matches the extension
      const extensionToContentType: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp'
      };
      
      // Override content type based on extension for consistency
      contentType = extensionToContentType[fileExtension.toLowerCase()] || 'image/jpeg';
      
      console.log(`File: ${fileName}, Extension: ${fileExtension}, Content-Type: ${contentType}`);
      
      // Use the dealership ID from props if available, otherwise fetch it
      let dealershipFolderName: string;
      
      if (dealershipId) {
        dealershipFolderName = `dealership-${dealershipId}`;
      } else {
        // Fallback to fetching the dealership ID if not provided in props
        const { data: dealershipData } = await supabase
          .from('dealerships')
          .select('id')
          .single();
        
        if (!dealershipData) {
          throw new Error('Could not determine dealership ID');
        }
        
        dealershipFolderName = `dealership-${dealershipData.id}`;
      }
      const filePath = `${dealershipFolderName}/${timestamp}-${randomString}.${fileExtension}`;
      
      // Create a blob URL for immediate preview
      const blobUrl = URL.createObjectURL(file);
      
      // Track this blob URL for cleanup
      if (!window.tempImageUrls) window.tempImageUrls = [];
      window.tempImageUrls.push(blobUrl);
      
      // Also track in our component state for cleanup
      setBlobUrls(prev => [...prev, blobUrl]);
      
      // If the file is not already in the correct format, convert it
      let fileToUpload = file;
      if (file instanceof File && file.type !== contentType) {
        console.log(`Converting file from ${file.type} to ${contentType}`);
        // Create a new file with the correct content type
        const blob = await file.arrayBuffer().then(buffer => new Blob([buffer], { type: contentType }));
        fileToUpload = new File([blob], `${timestamp}-${randomString}.${fileExtension}`, { type: contentType });
      }
      
      // IMPORTANT: Create a proper File object with the correct MIME type
      // This is critical to ensure Supabase stores the file with the right content type
      let fileToUploadWithCorrectType: File;
      
      // Always create a new File object with explicit content type to ensure it's preserved
      if (fileToUpload instanceof File) {
        // Create a new File from the existing File to ensure content type is set correctly
        const buffer = await fileToUpload.arrayBuffer();
        fileToUploadWithCorrectType = new File([buffer], `${timestamp}-${randomString}.${fileExtension}`, {
          type: contentType
        });
      } else {
        // Create a File from the Blob
        fileToUploadWithCorrectType = new File([fileToUpload], `${timestamp}-${randomString}.${fileExtension}`, {
          type: contentType
        });
      }
      
      console.log(`Uploading file with explicit content type: ${fileToUploadWithCorrectType.type}`);
      console.log(`File size: ${fileToUploadWithCorrectType.size} bytes`);
      
      // Use a FormData approach to ensure content type is preserved
      const formData = new FormData();
      formData.append('file', fileToUploadWithCorrectType);
      
      // Get the Supabase URL and key from environment variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log(`Uploading file with direct fetch API, content type: ${fileToUploadWithCorrectType.type}`);
      
      // Use fetch directly to upload with proper content type headers
      const uploadUrl = `${supabaseUrl}/storage/v1/object/social-media-images/${filePath}`;
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          // Don't set Content-Type here, let the browser set it with the boundary for FormData
        },
        body: formData
      });
      
      let uploadError = null;
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Error uploading image with fetch API:', errorData);
        uploadError = errorData;
        
        // Fall back to Supabase client as a backup method
        console.log('Trying fallback upload with Supabase client...');
        
        // For the fallback, use a Blob with the correct MIME type to force Supabase to use it
        const blobWithCorrectType = new Blob([await fileToUploadWithCorrectType.arrayBuffer()], { type: contentType });
        
        const { error: supabaseError } = await supabase.storage
          .from('social-media-images')
          .upload(filePath, blobWithCorrectType, {
            contentType: contentType, // Explicitly set the content type
            cacheControl: '3600',
            upsert: true
          });
          
        if (supabaseError) {
          console.error('Supabase client upload also failed:', supabaseError);
          return { previewUrl: blobUrl, storageUrl: null };
        } else {
          // Supabase client succeeded after fetch failed
          console.log('Upload successful via Supabase client fallback');
          uploadError = null;
        }
      } else {
        console.log('Upload successful via fetch API with FormData');
      }
      
      if (uploadError) {
        console.error('All upload attempts failed');
        // Return the blob URL for preview, but null for storage URL
        return { previewUrl: blobUrl, storageUrl: null };
      }
      
      // Use Supabase's getPublicUrl method to get the correct URL format
      const { data: { publicUrl } } = supabase.storage
        .from('social-media-images')
        .getPublicUrl(filePath);
      
      console.log('Image uploaded successfully with getPublicUrl:', publicUrl);
      
      // We'll use the blob URL for preview and the public URL for storage
      setIsUploading(false);
      setUploadProgress(100);
      
      // Call the onImageCaptured callback with both URLs
      onImageCaptured(blobUrl, publicUrl);
      
      return { previewUrl: blobUrl, storageUrl: publicUrl };
    } catch (error) {
      console.error('Error in uploadImage:', error);
      setIsUploading(false);
      setUploadProgress(0);
      
      // Create a blob URL for immediate preview as fallback
      const blobUrl = URL.createObjectURL(file);
      
      // Track this blob URL for cleanup
      if (!window.tempImageUrls) window.tempImageUrls = [];
      window.tempImageUrls.push(blobUrl);
      
      // Return the blob URL for preview, but null for storage URL
      onImageCaptured(blobUrl, null);
      return { previewUrl: blobUrl, storageUrl: null };
    }
    
    // Reset file input using non-null assertion
    // We're inside a try-catch block, so it's safe to use non-null assertion
    if (fileInputRef && fileInputRef.current) {
      (fileInputRef.current as HTMLInputElement).value = '';
    }
  };

  const triggerFileInput = () => {
    // Use optional chaining to safely handle null reference
    fileInputRef.current?.click();
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
