<?php

namespace Controllers;

use Models\Files;

class FileController
{
    private $fileModel;

    public function __construct()
    {
        $this->fileModel = new Files();
    }

    // Upload a file and save its metadata
    public function uploadFile()
    {
        // Receives the JSON request containing file metadata
        $data = json_decode(file_get_contents("php://input"));

        // Check if file metadata exists in the request
        if (!isset($data->userId) || !isset($data->fileName) || !isset($data->fileSize) || !isset($data->fileType)) {
            echo json_encode(["success" => false, "message" => "Missing required file metadata."]);
            return;
        }

        // Process file metadata (the file itself should be handled separately in the backend)
        $fileName = $data->fileName;
        $fileType = $data->fileType;
        $fileSize = $data->fileSize;
        $userId = $data->userId;
        $storagePath = $data->storagePath;
        $downloadUrl = $data->download_url;

        // Save the file metadata in the database
        $result = $this->fileModel->save(
            $userId,
            $fileName,
            $fileType,
            $fileSize,
            $storagePath,
            $downloadUrl
        );

        if ($result) {
            echo json_encode([
                "success" => true,
                "message" => "File metadata saved successfully.",
                "file" => [
                    "file_name" => $fileName,
                    "download_url" => $downloadUrl,
                    "file_size" => $fileSize,
                    "file_type" => $fileType,
                    "storage_path" => $storagePath,
                ]
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to save file metadata."]);
        }
    }

    // Get all files for a specific user
    public function getUserFiles()
    {
        // Receive JSON data with userId
        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->userId)) {
            echo json_encode(["success" => false, "message" => "User ID is required."]);
            return;
        }

        // Fetch the files from the model
        $files = $this->fileModel->getFilesByUser($data->userId);

        if ($files) {
            echo json_encode(["success" => true, "files" => $files]);
        } else {
            echo json_encode(["success" => false, "message" => "No files found for this user."]);
        }
    }

    // Delete a file
    public function deleteFile()
    {
        // Receive JSON data
        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->userId) || !isset($data->fileId)) {
            echo json_encode(["success" => false, "message" => "User ID and file ID are required."]);
            return;
        }

        // Fetch the file from the database
        $file = $this->fileModel->findById($data->fileId);

        // Check if the file exists and belongs to the user
        if ($file && $file['user_id'] == $data->userId) {
            // Attempt to delete the file record  from server
            $fileDeleted = $this->fileModel->delete($data->fileId, $data->userId);
            if ($fileDeleted) {
                echo json_encode(["success" => true, "message" => "File deleted successfully.","fileId"=> $data->fileId]);
            } else {
                echo json_encode(["success" => false, "message" => "Failed to delete file."]);
            }
        } else {
            echo json_encode(["success" => false, "message" => "File not found or not owned by the user."]);
        }
    }
}
?>