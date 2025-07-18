import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import './ImageCapture.css';

interface ImageCaptureProps {
  onImageCaptured: (imageUrl: string) => void;
  dealershipId: number | null;
}

const ImageCapture: React.FC<ImageCaptureProps> = ({ onImageCaptured, dealershipId }) => {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
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

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to the canvas
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob and upload
        canvas.toBlob(async (blob) => {
          if (blob) {
            await uploadImage(blob, 'camera-capture');
          }
        }, 'image/jpeg', 0.9);
      }
      
      // Stop the camera after capturing
      stopCamera();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      uploadImage(file, file.name);
    }
  };

  const uploadImage = async (file: Blob | File, fileName: string) => {
    if (!dealershipId) {
      setError('No dealership ID available. Please try again later.');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      // Generate a unique file name to prevent collisions
      const fileExt = fileName.split('.').pop();
      const uniqueFileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt || 'jpg'}`;
      const filePath = `dealership-${dealershipId}/${uniqueFileName}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('social-media-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Get the public URL for the uploaded image
        const { data: publicUrlData } = supabase.storage
          .from('social-media-images')
          .getPublicUrl(filePath);
        
        if (publicUrlData && publicUrlData.publicUrl) {
          onImageCaptured(publicUrlData.publicUrl);
        } else {
          throw new Error('Failed to get public URL for uploaded image');
        }
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
          <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
          <div className="progress-text">Uploading... {uploadProgress}%</div>
        </div>
      )}
    </div>
  );
};

export default ImageCapture;
