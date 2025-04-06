<?php

namespace Config;

use PDO;
use PDOException;
use Dotenv\Dotenv;

class Database
{
    private $host;
    private $name;
    private $user;
    private $password;
    private $port;
    private $conn;

    public function __construct()
    {
        $dotenv = Dotenv::createImmutable(__DIR__ . "/../");
        $dotenv->load();

        $this->host = $_ENV['DB_HOST'];
        $this->name = $_ENV['DB_NAME'];
        $this->user = $_ENV['DB_USER'];
        $this->password = $_ENV['DB_PASSWORD'];
        $this->port = $_ENV['DB_PORT'];
    }

    public function connect()
    {
        $this->conn = null;
        try {
            $dsn = "mysql:host=$this->host;port=$this->port;dbname=$this->name;charset=utf8mb4";
            $this->conn = new PDO($dsn, $this->user, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            die(json_encode(["success" => false, "message" => "Erro na conexão: " . $e->getMessage()]));
        }

        return $this->conn;
    }
}
?>
