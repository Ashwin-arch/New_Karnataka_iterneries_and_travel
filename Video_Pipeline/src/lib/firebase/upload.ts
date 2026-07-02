// import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
// import { storage } from "./config";

// export interface UploadProgress {
//   progress: number;
//   downloadURL?: string;
//   error?: string;
// }

// export function uploadVideo(
//   file: File,
//   path: string,
//   onProgress: (progress: number) => void
// ): Promise<{ downloadURL: string; firebasePath: string }> {
//   return new Promise((resolve, reject) => {
//     const storageRef = ref(storage, path);
//     const uploadTask = uploadBytesResumable(storageRef, file);

//     uploadTask.on(
//       "state_changed",
//       (snapshot) => {
//         const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
//         onProgress(Math.round(progress));
//       },
//       (error) => {
//         reject(error);
//       },
//       async () => {
//         const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
//         resolve({ downloadURL, firebasePath: path });
//       }
//     );
//   });
// }

// export async function deleteVideo(firebasePath: string): Promise<void> {
//   const storageRef = ref(storage, firebasePath);
//   await deleteObject(storageRef);
// }

// export function generateVideoPath(creatorId: string, fileName: string): string {
//   const timestamp = Date.now();
//   const sanitized = fileName.replace(/[^a-zA-Z0-9.]/g, "_");
//   return `videos/${creatorId}/${timestamp}_${sanitized}`;
// }
