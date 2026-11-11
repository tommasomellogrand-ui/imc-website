<?php
$destination = isset($_GET['id']) ? '/halloffamers/club/overview/' : '/halloffamers/clubs/';
$query = http_build_query($_GET);
header('Location: '.$destination.($query === '' ? '' : '?'.$query));
