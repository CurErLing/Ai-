import React, { useCallback } from 'react';
import { UploadedFile } from '../types';

interface FileUploadProps {
  onFilesAdded: (files: UploadedFile[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesAdded }) => {
  
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (e) => reject(new Error("Failed to read image for compression"));

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Resize logic: Max dimension 1500px (balance between readability and size)
        const MAX_DIM = 1500;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        
        // White background for transparent PNGs converted to JPEG
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Export as JPEG with 0.7 quality
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file: File): Promise<UploadedFile> => {
    // Check file size (limit to 50MB as requested)
    if (file.size > 50 * 1024 * 1024) {
       throw new Error(`文件 ${file.name} 过大 (>50MB)。`);
    }

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    const isText = file.type === 'text/plain';

    if (!isImage && !isText && !isPdf) {
      throw new Error(`不支持的文件类型: ${file.name}`);
    }

    let content: string;
    let mimeType = file.type;

    if (isImage) {
      try {
        content = await compressImage(file);
        mimeType = 'image/jpeg'; // We convert to jpeg
      } catch (err) {
        console.error("Compression failed, falling back to original", err);
        content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error("File read failed"));
          reader.readAsDataURL(file);
        });
      }
    } else {
      content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error("File read failed"));
        
        if (isPdf) {
          reader.readAsDataURL(file);
        } else {
          reader.readAsText(file);
        }
      });
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: isImage ? 'image' : isPdf ? 'pdf' : 'text',
      mimeType: mimeType,
      content: content
    };
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files) as File[];
    
    // Process files one by one to handle errors gracefully
    const processedFiles: UploadedFile[] = [];
    for (const f of files) {
      try {
        const pf = await processFile(f);
        processedFiles.push(pf);
      } catch (error) {
        console.error(error);
        alert(error instanceof Error ? error.message : "Upload failed");
      }
    }
    
    if (processedFiles.length > 0) {
      onFilesAdded(processedFiles);
    }
  }, [onFilesAdded]);

  const handleInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      
      const processedFiles: UploadedFile[] = [];
      for (const f of files) {
        try {
          const pf = await processFile(f);
          processedFiles.push(pf);
        } catch (error) {
           console.error(error);
           alert(error instanceof Error ? error.message : "Upload failed");
        }
      }

      if (processedFiles.length > 0) {
        onFilesAdded(processedFiles);
      }
    }
  }, [onFilesAdded]);

  return (
    <div 
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-indigo-300 rounded-xl p-5 text-center bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer group"
    >
      <input 
        type="file" 
        multiple 
        accept="image/*,.txt,.pdf" 
        className="hidden" 
        id="file-upload"
        onChange={handleInputChange}
      />
      <label htmlFor="file-upload" className="cursor-pointer block w-full h-full">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 bg-indigo-200 text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-cloud-arrow-up text-lg"></i>
          </div>
          <h3 className="text-base font-semibold text-indigo-900">点击或拖拽上传参考资料</h3>
          <p className="text-xs text-indigo-500">支持 PDF、图片 (支持 50MB 以内)</p>
        </div>
      </label>
    </div>
  );
};

export default FileUpload;