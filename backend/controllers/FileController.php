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
        if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
            // Parse the URL to get the fileId
            $urlParts = explode('/', $_SERVER['REQUEST_URI']);
            $fileId = end($urlParts);

            // Validate and sanitize $fileId as needed

            // Perform the deletion operation (e.g., remove from database and delete file from server)
            // $success = deleteFileById($fileId); // Implement this function based on your logic

            // if ($success) {
            //     echo json_encode(["success" => true, "message" => "File deleted successfully."]);
            // } else {
            //     echo json_encode(["success" => false, "message" => "Failed to delete file."]);
            // }
        } else {
            // Handle other request methods or send an error response
            http_response_code(405); // Method Not Allowed
            echo json_encode(["success" => false, "message" => "Invalid request method."]);
        }
    }

    public function uploadFile()
    {
        $response = ['success' => false];

        if (!empty($_FILES['files']['name'][0])) {
            $uploadDir = 'C:\Users\isr-rsilva\Documents\uploads\ '; // Ensure this directory exists and is writable
            $uploadedFiles = [];

            foreach ($_FILES['files']['name'] as $key => $name) {
                $tmpName = $_FILES['files']['tmp_name'][$key];
                $error = $_FILES['files']['error'][$key];

                if ($error === UPLOAD_ERR_OK) {
                    $targetFilePath = $uploadDir . basename($name);
                    if (move_uploaded_file($tmpName, $targetFilePath)) {
                        $uploadedFiles[] = $targetFilePath;
                    } else {
                        $response['error'] = "Failed to move file: $name";
                        echo json_encode($response);
                        exit;
                    }
                } else {
                    $response['error'] = "Error uploading file: $name";
                    echo json_encode($response);
                    exit;
                }
            }

            $response['success'] = true;
            $response['uploadedFiles'] = $uploadedFiles;
        } else {
            $response['error'] = 'No files were uploaded.';
        }

        echo json_encode($response);


    }

    public function downloadFile()
    {
        $response = ['success' => false];
    
        // Check if 'filePath' is provided in the GET query
        if (isset($_GET['filePath'])) {
            // Get the file path from the GET parameter
            $filePath = $_GET['filePath'];
    
            // Sanitize and validate the file path to avoid path traversal attacks
            $filePath = realpath($filePath); // Get the absolute path
    
            // Ensure the file is inside a valid directory (security check)
            $uploadDir = 'C:\Users\\isr-rsilva\\Documents\\uploads\\';
            
            if (strpos($filePath, $uploadDir) !== 0) {
                $response['error'] = 'Invalid file path.';
                echo json_encode($response);
                exit;
            }
    
            // Check if the file exists
            if (file_exists($filePath)) {
                // Get the file's MIME type
                $mimeType = mime_content_type($filePath);
    
                // Set headers to initiate the download
                header('Content-Type: ' . $mimeType);
                header('Content-Disposition: attachment; filename="' . basename($filePath) . '"');
                header('Content-Length: ' . filesize($filePath));
    
                // Output the file to the browser
                readfile($filePath);
    
                $response['success'] = true;
            } else {
                $response['error'] = "File not found: $filePath";
            }
        } else {
            $response['error'] = 'No file path specified in the request.';
        }
    
        echo json_encode($response);
    }
    


    private function getDirectoryContents($path)
    {
        $items = [];
        $contents = scandir($path);

        foreach ($contents as $entry) {
            if ($entry !== '.' && $entry !== '..') {
                $fullPath = $path . DIRECTORY_SEPARATOR . $entry;
                $item = [
                    'name' => $entry,
                    'path' => $fullPath,
                    'isDirectory' => is_dir($fullPath),
                    'children' => []
                ];

                if ($item['isDirectory']) {
                    // Recursively get contents of subdirectory
                    $item['children'] = $this->getDirectoryContents($fullPath);
                }

                $items[] = $item;
            }
        }

        return $items;
    }

    public function getDirectories()
    {
        $directoryPath = isset($_GET['path']) ? $_GET['path'] : '.';
        $directoryContents = $this->getDirectoryContents($directoryPath);

        echo json_encode($directoryContents);
    }

}
?>