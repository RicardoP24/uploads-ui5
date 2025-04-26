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
} else if ($uri === '/public/index.php/api/getDirectories.php' && $method === 'GET') {
    $controller = new FileController();
    $controller->getDirectories();
} else if ($uri === '/public/index.php/api/deleteFile' && $method === 'DELETE') {
    $controller = new FileController();
    $controller->deleteFile();
} else if ($uri === '/public/index.php/api/download.php' && $method === 'GET') {
    $controller = new FileController();
    $controller->downloadFile();
} else if ($uri === '/public/index.php/api/checkErrors' && $method === 'POST') {
    $controller = new FileController();
    $controller->checkErrors();
} else if ($uri === '/public/index.php/api/deleteSelectedItems' && $method === 'DELETE') {
    $controller = new FileController();
    $controller->deleteSelectedItems();
} else if ($uri === '/public/index.php/api/previewFiles' && $method === 'GET') {
    $controller = new FileController();
    $controller->previewFile();
} else {
    echo json_encode(value: ["success" => false, "message" => "Rota não encontrada", "uri" => $uri]);
}

?>