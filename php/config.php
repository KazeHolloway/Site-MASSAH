<?php
$host = '127.0.0.1';
$dbname = 'beneficiaires';
$username = 'root';
$password = '';

try {
    $pdo = new PDO(
        "mysql:host={$host};dbname={$dbname};charset=utf8mb4",
        $username,
        $password,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Connexion PDO échouée: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    exit;
}
