import { useState } from 'react';
import { Upload, Loader2, HardDrive } from 'lucide-react';
import { connectGoogleDrive, getDriveAccessToken } from '../lib/driveAuth';
import { uploadFileToDrive } from '../lib/drive';
import toast from 'react-hot-toast';

interface Props {
  onUploadSuccess: (url: string) => void;
  label?: string;
}

export default function GoogleDriveUploader({ onUploadSuccess, label = "Upload Image" }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [isConnected, setIsConnected] = useState(!!getDriveAccessToken());

  const handleConnect = async () => {
    try {
      await connectGoogleDrive();
      setIsConnected(true);
      toast.success('Connected to Google Drive');
    } catch (err) {
      toast.error('Failed to connect to Google Drive');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isConnected) {
      await handleConnect();
      if (!getDriveAccessToken()) return;
    }

    setIsUploading(true);
    try {
      const url = await uploadFileToDrive(file);
      onUploadSuccess(url);
      toast.success('Image uploaded and linked successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label className="relative cursor-pointer flex items-center justify-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-700 px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors">
        {isUploading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Upload className="w-3.5 h-3.5" />
        )}
        <span>{isUploading ? 'Uploading...' : label}</span>
        <input 
          type="file" 
          accept="image/*"
          className="hidden" 
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </label>
      
      {!isConnected && (
        <button
          type="button"
          onClick={handleConnect}
          className="flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors"
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Connect Drive</span>
        </button>
      )}
    </div>
  );
}
