<?php
header('Content-Type: application/json');
date_default_timezone_set('Asia/Jakarta');

$file = __DIR__ . '/wishes.json';

// Ambil indices — bisa single (index) atau bulk (indices[])
$indices = [];
if (!empty($_POST['indices'])) {
    $indices = array_map('intval', (array)$_POST['indices']);
} elseif (isset($_POST['index'])) {
    $indices = [(int)$_POST['index']];
}

if (empty($indices)) {
    echo json_encode(['success' => false, 'message' => 'Tidak ada index yang dikirim']);
    exit;
}

$fp = fopen($file, 'r+');
if (!$fp) { echo json_encode(['success'=>false,'message'=>'File tidak bisa dibuka']); exit; }
flock($fp, LOCK_EX);

$raw    = stream_get_contents($fp);
$wishes = json_decode($raw, true);
if (!is_array($wishes)) $wishes = [];

// Sort descending agar splice tidak geser index
rsort($indices);

foreach ($indices as $idx) {
    if (!isset($wishes[$idx])) continue;
    $w      = $wishes[$idx];
    $photos = [];
    if (!empty($w['photos']) && is_array($w['photos'])) $photos = $w['photos'];
    elseif (!empty($w['photo'])) $photos = [$w['photo']];
    foreach ($photos as $f) {
        $path = __DIR__ . '/uploads/' . basename($f);
        if (file_exists($path)) @unlink($path);
    }
    array_splice($wishes, $idx, 1);
}

rewind($fp);
ftruncate($fp, 0);
fwrite($fp, json_encode($wishes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
flock($fp, LOCK_UN);
fclose($fp);

echo json_encode(['success' => true, 'deleted' => count($indices)]);
