<?php
header('Content-Type: application/json; charset=utf-8');

$file = __DIR__ . '/wishes.json';

if (!file_exists($file)) {
    echo json_encode(['wishes' => []]);
    exit;
}

$wishes = json_decode(file_get_contents($file), true);

echo json_encode([
    'wishes' => is_array($wishes) ? $wishes : []
]);

