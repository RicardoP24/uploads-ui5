<?php

namespace Models;

use PDO;
use PDOException;
use Config\Database;

class User {
    private $conn;
    private $table = "users";

    public function __construct() {
        $this->conn = (new Database())->connect();
    }

    public function findUser($username, $password) {
        try {
            $stmt = $this->conn->prepare("SELECT * FROM " . $this->table . " WHERE username = :username");
            $stmt->bindParam(":username", $username);
            $stmt->execute();
            
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            // Verifica a senha (supondo que foi armazenada com password_hash)
            // password_verify($password, $user['password'])
            if ($user && $user['password'] == $password ) {
                return $user;
            }

            return false;
        } catch (PDOException $e) {
            return false;
        
        }

        
    }
}
?>
