<?php

namespace Controllers;

use Exception;

class FileController
{

    public function __construct()
    {
    }
   

    // Delete a file
    public function deleteFile()
    {
        // Receive JSON data
        if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
            // Get the full URL path
            $urlParts = explode('filePath=', $_SERVER['REQUEST_URI']);

            if (count($urlParts) < 2) {
                http_response_code(400); // Bad Request
                echo json_encode(["success" => false, "message" => "Missing filePath parameter."]);
                exit;
            }

            // Get and decode the file path
            $filePath = urldecode(end($urlParts));


            // Check if the file exists and try to delete it
            if (file_exists($filePath)) {
                if (unlink($filePath)) {
                    echo json_encode(["success" => true, "message" => "File deleted successfully."]);
                } else {
                    http_response_code(500); // Server error
                    echo json_encode(["success" => false, "message" => "Failed to delete file."]);
                }
            } else {
                http_response_code(404); // Not Found
                echo json_encode(["success" => false, "message" => "File not found."]);
            }
        } else {
            // Handle other request methods
            http_response_code(405); // Method Not Allowed
            echo json_encode(["success" => false, "message" => "Invalid request method."]);
        }


    }


    public function deleteSelectedItems()
    {
        // Only accept DELETE requests
        if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
            http_response_code(405); // Method Not Allowed
            echo json_encode([
                "success" => false,
                "message" => "Invalid request method. DELETE required."
            ]);
            exit;
        }

        // Get and decode the raw JSON input
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        // Validate the input
        if (json_last_error() !== JSON_ERROR_NONE || !isset($data['paths']) || !is_array($data['paths'])) {
            http_response_code(400); // Bad Request
            echo json_encode([
                "success" => false,
                "message" => "Invalid input. Expected JSON with a 'paths' array."
            ]);
            exit;
        }

        $results = [];
        $allSuccess = true;

        foreach ($data['paths'] as $rawPath) {
            $path = urldecode($rawPath);
            $result = $this->deleteItem($path);

            if (!$result['success']) {
                $allSuccess = false;
            }

            $results[] = [
                'path' => $path,
                'success' => $result['success'],
                'message' => $result['message']
            ];
        }

        // Set a sensible HTTP status
        http_response_code($allSuccess ? 200 : 207); // 207: Multi-Status

        echo json_encode([
            "success" => $allSuccess,
            "results" => $results,
            "message" => $allSuccess
                ? "All items deleted successfully."
                : "Some items could not be deleted."
        ]);
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

    public function previewFile()
    {
        $response = ['success' => false];

        // Check if 'filePath' is provided
        if (isset($_GET['filePath'])) {
            $filePath = $_GET['filePath'];

            // Sanitize path
            $filePath = realpath($filePath);

            // Define allowed base directory
            $allowedDir = 'C:\\Users\\isr-rsilva\\Documents\\uploads\\';

            // Check if the path is within allowed directory
            if (strpos($filePath, $allowedDir) !== 0) {
                $response['error'] = 'Invalid file path.';
                echo json_encode($response);
                exit;
            }

            // Check file existence
            if (file_exists($filePath)) {
                $content = file_get_contents($filePath);
                $response['success'] = true;
                $response['filename'] = basename($filePath);
                $response['content'] = $content;
            } else {
                $response['error'] = 'File does not exist.';
            }
        } else {
            $response['error'] = 'No filePath parameter provided.';
        }

        echo json_encode($response);
    }

    public function getDirectories()
    {
        $directoryPath = isset($_GET['path']) ? $_GET['path'] : '.';
        $directoryContents = $this->getDirectoryContents($directoryPath);

        echo json_encode($directoryContents);
    }

    public function checkErrors()
    {

        if (!isset($_POST['file_content']) || !isset($_POST['file_name'])) {
            die(json_encode([
                'status' => 'error',
                'message' => 'Missing file data',
                'output' => ''
            ]));
        }

        $sTempFile = tempnam(sys_get_temp_dir(), 'php_check_');
        file_put_contents($sTempFile, $_POST['file_content']);

        // Execute PHP lint
        $sOutput = shell_exec('php -l ' . escapeshellarg($sTempFile) . ' 2>&1');
        unlink($sTempFile);

        if (strpos($sOutput, 'No syntax errors detected') !== false) {
            echo json_encode([
                'status' => 'success',
                'message' => 'No syntax errors detected',
                'output' => trim($sOutput)
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Syntax errors found',
                'output' => trim($sOutput)
            ]);
        }
    }
    private function deleteItem($path)
    {
        // Check if path exists
        if (!file_exists($path)) {
            return [
                'success' => false,
                'message' => "Path does not exist"
            ];
        }

        try {
            if (is_dir($path)) {
                // Handle directory deletion
                $this->deleteDirectoryRecursive($path);
                return [
                    'success' => true,
                    'message' => "Directory deleted successfully"
                ];
            } else {
                // Handle file deletion
                if (unlink($path)) {
                    return [
                        'success' => true,
                        'message' => "File deleted successfully"
                    ];
                } else {
                    return [
                        'success' => false,
                        'message' => "Failed to delete file"
                    ];
                }
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    private function deleteDirectoryRecursive($dirPath)
    {
        if (!is_dir($dirPath)) {
            throw new Exception("$dirPath must be a directory");
        }

        if (substr($dirPath, strlen($dirPath) - 1, 1) != '/') {
            $dirPath .= '/';
        }

        $files = glob($dirPath . '*', GLOB_MARK);
        foreach ($files as $file) {
            if (is_dir($file)) {
                $this->deleteDirectoryRecursive($file);
            } else {
                unlink($file);
            }
        }

        rmdir($dirPath);
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

}
?>