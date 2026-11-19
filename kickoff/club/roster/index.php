<?php
$page = isset($_GET['id']) && $_GET['id'] !== '' ? 'detail.html' : 'index.html';
readfile(dirname(__DIR__, 2).'/clubs/'.$page);
