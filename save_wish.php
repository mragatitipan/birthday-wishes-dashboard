<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$name    = trim($_POST['name']    ?? '');
$message = trim($_POST['message'] ?? '');

// ── Validasi input ────────────────────────────────────
if (empty($name) || empty($message)) {
    echo json_encode(['success' => false, 'error' => 'Nama dan ucapan wajib diisi']);
    exit;
}
if (mb_strlen($name) > 50 || mb_strlen($message) > 500) {
    echo json_encode(['success' => false, 'error' => 'Input terlalu panjang']);
    exit;
}

$name    = strip_tags($name);
$message = strip_tags($message);

// ── Handle multi foto (photos[]) ──────────────────────
$photoFilenames = [];

// Restruktur $_FILES['photos'] dari format PHP multi-file
// $_FILES['photos']['name'][0], [1], dst → jadi array of files
if (!empty($_FILES['photos']['tmp_name'])) {
    $uploadDir = __DIR__ . '/uploads/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0775, true);

    $maxSize   = 5 * 1024 * 1024;
    $allowed   = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $mimeToExt = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/gif'  => 'gif',
        'image/webp' => 'webp',
    ];

    $finfo     = new finfo(FILEINFO_MIME_TYPE);
    $files     = $_FILES['photos'];
    $count     = is_array($files['tmp_name']) ? count($files['tmp_name']) : 1;

    // Normalisasi ke array (handle single maupun multiple)
    $tmpNames  = is_array($files['tmp_name']) ? $files['tmp_name']  : [$files['tmp_name']];
    $sizes     = is_array($files['size'])     ? $files['size']      : [$files['size']];
    $errors    = is_array($files['error'])    ? $files['error']     : [$files['error']];

    // Batasi maks 5 foto
    $total = min(count($tmpNames), 5);

    for ($i = 0; $i < $total; $i++) {
        // Skip jika tidak ada file
        if ($errors[$i] !== UPLOAD_ERR_OK || empty($tmpNames[$i])) continue;

        // Validasi ukuran
        if ($sizes[$i] > $maxSize) {
            echo json_encode(['success' => false, 'error' => "Foto ke-" . ($i+1) . " melebihi 5MB"]);
            exit;
        }

        // Validasi MIME dari konten file
        $mimeType = $finfo->file($tmpNames[$i]);
        if (!in_array($mimeType, $allowed)) {
            echo json_encode(['success' => false, 'error' => "Format foto ke-" . ($i+1) . " tidak didukung (JPG/PNG/GIF/WEBP)"]);
            exit;
        }

        // Nama file aman dari MIME
        $ext      = $mimeToExt[$mimeType];
        $filename = uniqid('wish_', true) . '.' . $ext;
        $dest     = $uploadDir . $filename;

        if (!move_uploaded_file($tmpNames[$i], $dest)) {
            echo json_encode(['success' => false, 'error' => "Gagal menyimpan foto ke-" . ($i+1)]);
            exit;
        }

        $photoFilenames[] = $filename;
    }
}

// ── Simpan ke JSON ────────────────────────────────────
$jsonFile = __DIR__ . '/wishes.json';
$wishes   = [];

if (file_exists($jsonFile)) {
    $fp = fopen($jsonFile, 'c+');
    if (flock($fp, LOCK_EX)) {
        $content = stream_get_contents($fp);
        $decoded = json_decode($content, true);
        if (is_array($decoded)) $wishes = $decoded;
    }
} else {
    $fp = fopen($jsonFile, 'c+');
    flock($fp, LOCK_EX);
}

date_default_timezone_set('Asia/Jakarta');

$wishes[] = [
    'name'    => $name,
    'message' => $message,
    'photos'  => $photoFilenames,   // ← array, bisa kosong []
    'time'    => date('d M Y, H:i'),
];

// Batasi 300 ucapan
if (count($wishes) > 300) {
    $wishes = array_slice($wishes, -300);
}

ftruncate($fp, 0);
rewind($fp);
fwrite($fp, json_encode($wishes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
flock($fp, LOCK_UN);
fclose($fp);

echo json_encode(['success' => true]);