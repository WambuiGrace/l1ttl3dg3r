"use client"

import React, { useCallback, useRef, useState } from 'react'
import { DndContext, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation";
import { useSchematicEntitlement, useSchematicFlag } from '@schematichq/schematic-react';
import { convertLegacyOtlpGrpcOptions } from "@opentelemetry/otlp-grpc-exporter-base";
import { uploadPDF } from '@/actions/uploadPDF';


function PDFDropzone() {
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const { user } = useUser();  
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {
        value: isFeatureEnabled,
        featureUsageExceeded,
        featureUsage,
        featureAllocation,
    } = useSchematicEntitlement("scans");

    //Setup up sensors to detect drag
    const sensors = useSensors(useSensor(PointerSensor));
    const handleUpload = useCallback(async(files: fileList | File[]) => {
      if (!user){
        alert("Please sign in to upload files.");
        return;
      }
      const fileArray = Array.from(files);
      const pdfFiles = fileArray.filter(
        (file) =>
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf"),
      );

      if (pdfFiles.length === 0){
        alert("Please drop only PDF files");
        return;
      }

      setIsUploading(true);
      try {
        // Upload files
        const newUploadedFiles: string [] = [];
        for (const file of pdfFiles) {
          //Create a formdata object to use with server action
          const formData = new FormData();
          formData.append("file", file);

          //Call the server action to handle the upload
          const result = await uploadPDF(formData);

          if (!result.success) {
            throw new Error(result.error);
          }
          newUploadedFiles.push(file.name);
        }

        setUploadedFiles((prev) => [...prev, ...newUploadedFiles]);

        //Clear uploaded files list after 5 seconds
        setTimeout(() => {
          setUploadedFiles([]);
        }, 5000);

        router.push("/receipts");
      } catch (error) {
        console.error("Upload failed: ", error);
        alert(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      } finally {
        setIsUploading(false);
      }
    }, [user, router])

    //Handle file drop via native browser events for better PDF support
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);

        if (!user){
          alert("Please sign in to upload files.");
          return;
        }
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0){
          handleUpload(e.dataTransfer.files);
        }
    }, [user, handleUpload]);

    //const canUpload = isUserSignedIn && isFeatureEnabled;
    const canUpload = true; //Mock info

  return <DndContext sensors={sensors}>
    <div className="w-full max-w-md mx-auto bg-red-400">
        <div 
            onDragOver={canUpload ? handleDragOver : undefined}
            onDragLeave={canUpload ? handleDragLeave : undefined}
            onDrop={canUpload ? handleDrop : (e) => e.preventDefault()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDraggingOver ? "border-green-500 bg-green-50" : "border-gray-300"}
                ${!canUpload ? "opacity-70 cursor-not-allowed" : ""}`}
        >

        </div>
    </div>
  </DndContext>
}

export default PDFDropzone