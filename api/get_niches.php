<?php
require 'db.php';

function ensureNichesGrid($conn) {
    $clusters = range('A', 'Z');
    $expectedCount = count($clusters) * 2 * 5;

    $countResult = $conn->query("SELECT COUNT(*) AS total FROM niches");
    $currentCount = 0;
    if ($countResult && $countResult->num_rows > 0) {
        $countRow = $countResult->fetch_assoc();
        $currentCount = (int)$countRow['total'];
    }

    if ($currentCount < $expectedCount) {
        $stmt = $conn->prepare("INSERT IGNORE INTO niches (id, section, `row`, `col`, status, price, capacity) VALUES (?, ?, ?, ?, 'AVAILABLE', ?, 6)");
        if ($stmt) {
            foreach ($clusters as $cluster) {
                $sectionName = "Cluster " . $cluster;
                for ($r = 1; $r <= 2; $r++) {
                    for ($c = 1; $c <= 5; $c++) {
                        $id = "$cluster-$r-$c";
                        $price = 220000;
                        $stmt->bind_param("ssiid", $id, $sectionName, $r, $c, $price);
                        $stmt->execute();
                    }
                }
            }
            $stmt->close();
        }
    }
}

ensureNichesGrid($conn);

$sql = "SELECT * FROM niches ORDER BY section, `row`, `col`";
$result = $conn->query($sql);
$niches = [];

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        // Cast types for frontend
        $row['row'] = (int)$row['row'];
        $row['col'] = (int)$row['col'];
        $row['price'] = (float)$row['price'];
        $niches[] = $row;
    }
}

echo json_encode($niches);
$conn->close();
?>