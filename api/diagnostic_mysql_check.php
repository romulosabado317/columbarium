<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
$conn = @new mysqli('localhost', 'root', '');
if ($conn->connect_error) {
    echo 'connect_error=' . $conn->connect_error . "\n";
    exit;
}
echo 'connected\n';
if ($conn->select_db('columbarium_db')) {
    echo 'db ok\n';
} else {
    echo 'db fail\n';
}
?>