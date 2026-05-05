<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

function generateFallbackNiches() {
    $clusters = range('A', 'F');
    $niches = [];
    foreach ($clusters as $cluster) {
        $sectionName = "Cluster " . $cluster;
        $price = 220000 + ((ord($cluster) - ord('A')) * 10000);
        for ($r = 1; $r <= 2; $r++) {
            for ($c = 1; $c <= 5; $c++) {
                $status = 'AVAILABLE';
                if ($cluster === 'A' && $r === 1 && $c === 2) $status = 'RESERVED';
                if ($cluster === 'A' && $r === 1 && $c === 3) $status = 'OCCUPIED';
                if ($cluster === 'B' && $r === 1 && $c === 2) $status = 'RESERVED';
                if ($cluster === 'B' && $r === 1 && $c === 3) $status = 'OCCUPIED';
                if ($cluster === 'C' && $r === 1 && $c === 3) $status = 'RESERVED';
                if ($cluster === 'D' && $r === 1 && $c === 2) $status = 'OCCUPIED';
                if ($cluster === 'E' && $r === 1 && $c === 2) $status = 'RESERVED';
                if ($cluster === 'F' && $r === 1 && $c === 3) $status = 'OCCUPIED';
                $niches[] = [
                    'id' => "$cluster-$r-$c",
                    'section' => $sectionName,
                    'row' => $r,
                    'col' => $c,
                    'price' => $price,
                    'status' => $status,
                    'capacity' => 6
                ];
            }
        }
    }
    return $niches;
}

$host = 'localhost';
$user = 'root';
$pass = '';
$dbname = 'columbarium_db';

mysqli_report(MYSQLI_REPORT_OFF);
$conn = mysqli_init();
@$conn->real_connect($host, $user, $pass, $dbname);
if (!$conn || $conn->connect_errno) {
    echo json_encode(generateFallbackNiches());
    exit;
}

function ensureNichesGrid($conn) {
    $clusters = range('A', 'F');

    $existingIds = [];
    $result = $conn->query("SELECT id FROM niches");
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $existingIds[$row['id']] = true;
        }
    }

    $stmt = $conn->prepare("INSERT IGNORE INTO niches (id, section, `row`, `col`, status, price, capacity) VALUES (?, ?, ?, ?, 'AVAILABLE', ?, 6)");
    if (!$stmt) {
        return;
    }

    foreach ($clusters as $cluster) {
        $sectionName = "Cluster " . $cluster;
        $price = 220000 + ((ord($cluster) - ord('A')) * 10000);
        for ($r = 1; $r <= 2; $r++) {
            for ($c = 1; $c <= 5; $c++) {
                $id = "$cluster-$r-$c";
                if (isset($existingIds[$id])) {
                    continue;
                }
                $stmt->bind_param("ssiid", $id, $sectionName, $r, $c, $price);
                $stmt->execute();
            }
        }
    }
    $stmt->close();
}

ensureNichesGrid($conn);

$sql = "SELECT * FROM niches ORDER BY section, `row`, `col`";
$result = $conn->query($sql);
$niches = [];

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $row['row'] = (int)$row['row'];
        $row['col'] = (int)$row['col'];
        $row['price'] = (float)$row['price'];
        $niches[] = $row;
    }
}

if (empty($niches)) {
    echo json_encode(generateFallbackNiches());
} else {
    echo json_encode($niches);
}

$conn->close();
?>