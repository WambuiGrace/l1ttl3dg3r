"use client"

import React, { useCallback, useRef, useState } from 'react'
import { DndContext, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation";
import { useSchematicEntitlement, useSchematicFlag } from '@schematichq/schematic-react';


function PDFDropzone() {
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const { user } = useUser();  
    const { router } = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {
        value: isFeatureEnabled,
        featureUsageExceeded,
        featureUsage,
        featureAllocation,
    } = useSchematicEntitlement("scans");

    // console.log(isFeatureEnabled)
    // console.log("Feature usage", featureUsageExceeded)
    // console.log("Feature allocation", featureAllocation)

    //Setup up sensors to detect drag
    const sensors = useSensors(useSensor(PointerSensor));

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
        console.log("Dropped")
    }, []);

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