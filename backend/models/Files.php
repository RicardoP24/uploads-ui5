<?php

namespace Models;

use PDO;
use PDOException;
use Config\Database;

class Files {
    private $conn;
    private $table = "uploaded_files";

    public function __construct() {
        $this->conn = (new Database())->connect();
    }

    // Create a new file record
    public function save($userId, $fileName, $fileType, $fileSize, $storagePath, $downloadUrl) {
        try {
            $stmt = $this->conn->prepare("INSERT INTO " . $this->table . "
                (user_id, file_name, file_type, file_size, storage_path, download_url)
                VALUES (:user_id, :file_name, :file_type, :file_size, :storage_path, :download_url)");

            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':file_name', $fileName);
            $stmt->bindParam(':file_type', $fileType);
            $stmt->bindParam(':file_size', $fileSize);
            $stmt->bindParam(':storage_path', $storagePath);
            $stmt->bindParam(':download_url', $downloadUrl);

            return $stmt->execute();
        } catch (PDOException $e) {
            // Optional: Log $e->getMessage()
            return false;
        }
    }

    // Get all files for a user
    public function getFilesByUser($userId) {
        try {
            $stmt = $this->conn->prepare("SELECT * FROM " . $this->table . " WHERE user_id = :user_id ORDER BY uploaded_at DESC");
            $stmt->bindParam(":user_id", $userId);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }

    // Get one file by ID
    public function findById($fileId) {
        try {
            $stmt = $this->conn->prepare("SELECT * FROM " . $this->table . " WHERE id = :id");
            $stmt->bindParam(":id", $fileId);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return false;
        }
    }

    // Optional: Delete a file by ID
    public function delete($fileId, $userId) {
        try {
            $stmt = $this->conn->prepare("DELETE FROM " . $this->table . " WHERE id = :id AND user_id = :user_id");
            $stmt->bindParam(":id", $fileId);
            $stmt->bindParam(":user_id", $userId);
            return $stmt->execute();
        } catch (PDOException $e) {
            return false;
        }
    }
}
?>
