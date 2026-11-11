<?php
$destination = isset($_GET['id']) ? '/roadtohistory/club/overview/' : '/roadtohistory/clubs/';
$query = http_build_query($_GET);
header('Location: '.$destination.($query === '' ? '' : '?'.$query));
