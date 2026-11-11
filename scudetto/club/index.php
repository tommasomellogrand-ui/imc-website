<?php
$destination = isset($_GET['id']) ? '/scudetto/club/overview/' : '/scudetto/clubs/';
$query = http_build_query($_GET);
header('Location: '.$destination.($query === '' ? '' : '?'.$query));
