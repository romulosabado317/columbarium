<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
echo "cwd=" . getcwd() . "\n";
if (file_exists('db.php')) {
    echo "db.php exists\n";
} else {
    echo "db.php missing\n";
}
require 'db.php';
echo "after require\n";
?>