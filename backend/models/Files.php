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
    public function save($file) {
        try {
            $uploadDir = '';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $filePath = 'C:\Users\isr-rsilva\Documents\uploads';

            return move_uploaded_file($file['tmp_name'], $filePath);

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
