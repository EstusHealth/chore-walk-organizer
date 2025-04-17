
import { useState } from 'react';
import { Room } from '@/types';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { nanoid } from 'nanoid';

interface RoomPhotosProps {
  room: Room;
  onPhotosUpdated: (roomId: string, photos: string[]) => void;
}

const RoomPhotos = ({ room, onPhotosUpdated }: RoomPhotosProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  
  const uploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${room.id}-${nanoid()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('room-photos')
        .upload(filePath, file);
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL for the uploaded file
      const { data } = supabase.storage
        .from('room-photos')
        .getPublicUrl(filePath);
      
      if (data) {
        // Update the room's photos array
        const updatedPhotos = room.photos ? [...room.photos, data.publicUrl] : [data.publicUrl];
        onPhotosUpdated(room.id, updatedPhotos);
        
        toast({
          title: "Photo uploaded",
          description: "The photo has been added to this room"
        });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your photo",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  
  const removePhoto = (photoUrl: string) => {
    // Extract file path from URL
    const urlParts = photoUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    // Delete file from storage
    supabase.storage
      .from('room-photos')
      .remove([fileName])
      .then(({ error }) => {
        if (error) {
          console.error('Error removing photo:', error);
          toast({
            title: "Removal failed",
            description: "There was a problem removing the photo",
            variant: "destructive"
          });
        } else {
          // Update the room's photos array
          const updatedPhotos = room.photos?.filter(p => p !== photoUrl) || [];
          onPhotosUpdated(room.id, updatedPhotos);
          
          toast({
            title: "Photo removed",
            description: "The photo has been removed from this room"
          });
        }
      });
  };
  
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Room Photos</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            size="sm"
            disabled={uploading}
            className="flex items-center"
            onClick={() => document.getElementById('capture-photo')?.click()}
          >
            <Camera size={16} className="mr-1" />
            <span className="text-xs">Take Photo</span>
            <input
              type="file"
              id="capture-photo"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={uploadPhoto}
              disabled={uploading}
            />
          </Button>
          
          <Button 
            variant="outline"
            size="sm"
            disabled={uploading}
            className="flex items-center"
            onClick={() => document.getElementById('upload-photo')?.click()}
          >
            <Upload size={16} className="mr-1" />
            <span className="text-xs">Upload</span>
            <input
              type="file"
              id="upload-photo"
              accept="image/*"
              className="hidden"
              onChange={uploadPhoto}
              disabled={uploading}
            />
          </Button>
        </div>
      </div>
      
      {uploading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-chore-600"></div>
          <p className="text-sm text-gray-500 mt-2">Uploading photo...</p>
        </div>
      )}
      
      {!room.photos?.length ? (
        <p className="text-sm text-gray-500 italic py-2">No photos added yet</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {room.photos.map((photoUrl, index) => (
            <div key={index} className="relative rounded-md overflow-hidden aspect-square">
              <img 
                src={photoUrl} 
                alt={`${room.name} - photo ${index + 1}`} 
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removePhoto(photoUrl)}
                className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1"
                aria-label="Remove photo"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomPhotos;
