<?php

$host = "localhost";
$username = "user";
$password = "coor1daus3r";
$database = "coorida";

$conn = new mysqli($host, $username, $password, $database);

$query = "SELECT Name, Cost FROM products";
$result = $conn->query($query);

if ($result->num_rows > 0) {
  echo "<ul>\n";
  // output data of each row
  while($row = $result->fetch_assoc()) {
    echo "<li>" . $row["Name"] . ", " . $row["Cost"] . "$\n";
  }
  echo "</ul>\n";
}

$conn->close();

?>
