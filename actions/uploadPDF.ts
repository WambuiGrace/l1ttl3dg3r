'use server'

import { currentUser } from "@clerk/nextjs/server";
import convex from "@/lib/convexClient";
import { api } from "@/convex/_generated/api";
import { getFileDownloadUrl } from "./getFileDownloadUrl";

//Server action to upload PDF file to convex
export async function uploadPDF(formData: FormData) {
    const user = await currentUser();

    if (!user) {
        return{
            success: false,
            error: "Not authenticated"
        };
    }

    try {
        //Get file from formData
        const file = formData.get("file") as File;
        if (!file) {
            return {
                success: false,
                error: "No file provided"
            };
        }

        //Validate file type
        if (
            !file.type.includes("pdf") && 
            !file.name.toLowerCase().endsWith(".pdf")
        ) {
            return {
                success: false,
                error: "Only PDF files are allowed."
            }
        }

        //Get upload url from convex
        const uploadUrl = await convex.mutation(api.receipts.generateUploadUrl, {});
        //Convert file to arrayBuffer for fetch API
        const arrayBuffer = await file.arrayBuffer();

        //Upload the file to convex 
        const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            headers: {
                "Content-Type": file.type,
            },
            body: new Uint8Array(arrayBuffer),
        });

        //If anything goes wrong throw an error
        if (!uploadResponse.ok) {
            throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
        }
        //Get storage id from the response
        const { storageId } = await uploadResponse.json();

        //Add receipt to the database
        const receiptId = await convex.mutation(api.receipts.storeReceipt, {
            userId: user.id,
            fileId: storageId,
            fileName: file.name,
            size: file.size,
            mimeType: file.type,
        });
        
        //Generate the file url
        const fileUrl = await getFileDownloadUrl(storageId);

        //T
        

    } catch (error) {
        console.error("Server action upload error: ", error);
        return {
            success: false,
            error: 
                error instanceof Error ? error.message : "An unknown error occured",
        };
    }
}