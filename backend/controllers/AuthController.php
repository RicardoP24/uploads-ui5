<?php
namespace Controllers;

use Models\User;

class AuthController {
    public function login() {
        // Recebe os dados JSON da requisição
        $data = json_decode(json: file_get_contents("php://input"));

        if (!isset($data->username) || !isset($data->password)) {
            echo json_encode(["success" => false, "message" => "Preencha todos os campos"]);
            return;
        }

        $userModel = new User();
        $user = $userModel->findUser($data->username, $data->password);

        if ($user) {
            echo json_encode(["success" => true, "message" => "Login bem-sucedido","user"=> ["id"=> $user['id'], 
            "username"=> $user['username']]]);
        } else {
            echo json_encode(["success" => false, "message" => "Usuário ou senha incorretos"]);
        }
    }
}
?>
