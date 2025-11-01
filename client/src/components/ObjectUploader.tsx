import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import XHRUpload from "@uppy/xhr-upload";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
    cloudinaryParams?: {
      apiKey: string;
      timestamp: number;
      signature: string;
      folder: string;
    };
    storageType?: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 * 
 * The component uses Uppy under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL).
 *   Typically used to fetch a presigned URL from the backend server for direct-to-S3
 *   uploads.
 * @param props.onComplete - Callback function called when upload is complete. Typically
 *   used to make post-upload API calls to update server state and set object ACL
 *   policies.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uploadParams, setUploadParams] = useState<any>(null);
  
  const [uppy] = useState(() => {
    const uppyInstance = new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: ['image/*'],
      },
      autoProceed: false,
      debug: true,
    });

    // We'll dynamically configure the uploader when we know the storage type
    uppyInstance.on("file-added", async (file) => {
      console.log("📡 File added, getting upload parameters");
      const params = await onGetUploadParameters();
      console.log("📥 Received params:", params);
      setUploadParams(params);

      // Remove any existing uploaders
      if (uppyInstance.getPlugin('XHRUpload')) {
        uppyInstance.removePlugin(uppyInstance.getPlugin('XHRUpload')!);
      }

      // Check if this is a Cloudinary upload
      if ('cloudinaryParams' in params && params.cloudinaryParams) {
        console.log("☁️ Using manual fetch for Cloudinary (bypassing Uppy XHR)");
        const { cloudinaryParams } = params as any;
        
        // For Cloudinary, we'll handle the upload manually outside of Uppy
        // to match the working approach in messages.tsx
        uppyInstance.on("upload", async () => {
          try {
            console.log("☁️ Starting manual Cloudinary upload");
            const fileData = file!.data;
            
            // Create FormData in the exact same order as messages.tsx
            const formData = new FormData();
            formData.append('file', fileData);
            formData.append('api_key', cloudinaryParams.apiKey);
            formData.append('timestamp', cloudinaryParams.timestamp.toString());
            formData.append('signature', cloudinaryParams.signature);
            formData.append('folder', cloudinaryParams.folder);
            
            console.log("☁️ Uploading to:", params.uploadURL);
            const response = await fetch(params.uploadURL, {
              method: "POST",
              body: formData,
            });
            
            if (!response.ok) {
              throw new Error(`Cloudinary upload failed: ${response.status}`);
            }
            
            const result = await response.json();
            console.log("☁️ Cloudinary upload success:", result);
            
            // Manually trigger success event with Cloudinary's response
            uppyInstance.emit('upload-success', file, {
              status: 200,
              body: result,
              uploadURL: result.secure_url
            });
            
            uppyInstance.emit('complete', {
              successful: [{ ...file, uploadURL: result.secure_url }],
              failed: []
            });
          } catch (error) {
            console.error("☁️ Cloudinary upload failed:", error);
            uppyInstance.emit('upload-error', file, error);
          }
        });
        
        // Don't use XHRUpload for Cloudinary, we handle it manually
        return;
      } else {
        // Replit object storage - use XHRUpload for simpler CORS handling
        console.log("📦 Configuring Replit storage upload");
        uppyInstance.use(XHRUpload, {
          endpoint: params.uploadURL,
          method: 'PUT',
          fieldName: 'file',
          formData: false, // Don't wrap in FormData, send raw file
          // Replit storage returns empty response, so manually construct the response
          getResponseData(responseText) {
            console.log("📦 Replit storage response:", responseText);
            // Extract clean URL from the upload URL
            const urlObj = new URL(params.uploadURL);
            const cleanUrl = urlObj.origin + urlObj.pathname;
            console.log("📦 Extracted clean URL:", cleanUrl);
            return { url: cleanUrl };
          },
        });
      }
    });

    uppyInstance
      .on("upload", () => {
        console.log("🚀 Upload started");
      })
      .on("upload-success", (file, response) => {
        console.log("✅ Upload success:", file?.name);
        console.log("Full response object:", response);
        console.log("Response body:", response?.body);
        
        // Extract the URL from the response
        let extractedUrl: string | undefined;
        
        // Check for Cloudinary's secure_url
        if ((response?.body as any)?.secure_url) {
          extractedUrl = (response.body as any).secure_url;
          console.log("☁️ Found Cloudinary secure_url:", extractedUrl);
        }
        // Check for standard url property (from getResponseData)
        else if ((response?.body as any)?.url) {
          extractedUrl = (response.body as any).url;
          console.log("📦 Found url from getResponseData:", extractedUrl);
        }
        
        if (extractedUrl) {
          file!.uploadURL = extractedUrl;
          console.log("✅ Final file.uploadURL set:", extractedUrl);
        } else {
          console.error("❌ Could not extract URL from response");
          console.error("Response structure:", JSON.stringify(response, null, 2));
        }
      })
      .on("upload-error", (file, error) => {
        console.error("❌ Upload error:", file?.name, error);
      })
      .on("error", (error) => {
        console.error("❌ Uppy error:", error);
      })
      .on("complete", (result) => {
        console.log("🏁 Upload complete, full result:", result);
        console.log("🏁 Successful files:", result.successful);
        if (onComplete) {
          console.log("🏁 Calling onComplete callback");
          onComplete(result);
        }
        setShowModal(false);
      });

    return uppyInstance;
  });

  return (
    <div>
      <Button type="button" onClick={() => setShowModal(true)} className={buttonClassName} data-testid="button-upload-avatar">
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
        note="Select an image file, then click Upload"
        showProgressDetails={true}
        showRemoveButtonAfterComplete={true}
      />
    </div>
  );
}