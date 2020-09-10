<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <link rel="stylesheet" href="css/style.css">

    <title>Test</title>
  </head>
  <body>
    <!-- Cookies alert -->
    <div class="alert alert-dismissible bg-dark text-justify fixed-bottom">
      <button type="button" class="close" data-dismiss="alert">&times;</button>
        <span class="text-white">
        This website uses cookies lorem ipsum dolor sit amet, consectetur adipiscing elit.
        Nunc velit neque, scelerisque sed nunc sed, finibus feugiat nunc.
        Integer ut nibh eu magna hendrerit imperdiet id sit amet leo.
        Integer vitae lacus ut diam aliquet tempus.
      </span>
    </div>

    <header class="sticky-top">
      <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <!-- Navigation toggler -->
        <button class="navbar-toggler" type="button" onclick="closeNavbarAccount_div()" data-toggle="collapse" data-target="#navbar-nav" aria-expanded="false">
          <span class="navbar-toggler-icon"></span>
        </button>

        <!-- Brand logo -->
        <a class="navbar-brand unselectable" href="#">Coorida</a>

        <!-- Account toggler -->
        <button class="navbar-toggler" type="button" onclick="closeNavbarNav_div()" data-toggle="collapse" data-target="#navbar-account" aria-expanded="false">
          <span class="user-account-icon"></span>
        </button>

        <!-- Navbar navigation -->
        <div class="collapse navbar-collapse" id="navbar-nav">
          <ul class="navbar-nav">
            <li class="nav-item">
              <a class="nav-link disabled">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link disabled divider" href="">|</a>
            </li>
            <li class="nav-item">
              <a class="nav-link active" href="">Products</a>
            </li>
            <li class="nav-item">
              <a class="nav-link disabled divider" href="">|</a>
            </li>
            <li class="nav-item">
              <a class="nav-link active" href="">Contacts</a>
            </li>
            <li class="nav-item">
              <a class="nav-link disabled divider" href="">|</a>
            </li>
            <li class="nav-item">
              <a class="nav-link active" href="">FAQ</a>
            </li>
          </ul>
        </div>

        <!-- Navbar account -->
        <div class="collapse navbar-collapse" id="navbar-account">
          <ul class="navbar-nav float-right">
            <li class="nav-item">
              <a class="nav-link active" href="">Go to Cart</a>
            </li>
            <li class="nav-item">
              <a class="nav-link disabled divider" href="">|</a>
            </li>
            <li class="nav-item">
              <a class="nav-link active" href="">Log In</a>
            </li>
          </ul>
        </div>
      </nav>
    </header>

    <div class="container">
      <?php
      include "connect.php";
      ?>
    </div>



    <!-- jQuery library -->
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    <!-- Popper JS -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js"></script>
    <!-- Latest compiled JavaScript -->
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
    <!-- Functions for navbar togglers -->
    <script src="js/togglers.js"></script>
  </body>
</html>
