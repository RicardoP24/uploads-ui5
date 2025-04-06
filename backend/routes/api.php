<?php

use Controllers\AuthController;
use Controllers\FileController;

// Configuração dos headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Verifica a requisição
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];


if ($uri === "/public/index.php/api/login" && $method === "POST") {
    $controller = new AuthController();
    $controller->login();

} else if ($uri === '/public/index.php/api/upload' && $method === 'POST') {
    $controller = new FileController();
    $controller->uploadFile();
} else if ($uri === '/public/index.php/api/getFiles' && $method === 'POST') {
    $controller = new FileController();
    $controller->getUserFiles();
} else if ($uri === '/public/index.php/api/deleteFile' && $method === 'POST') {
    $controller = new FileController();
    $controller->deleteFile();
} else {
    echo json_encode(value: ["success" => false, "message" => "Rota não encontrada", "uri" => $uri]);
}

?>