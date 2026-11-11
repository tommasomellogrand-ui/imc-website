<?php
$destination = isset($_GET['id']) ? '/kickoff/club/overview/' : '/kickoff/clubs/';
$query = http_build_query($_GET);
header('Location: '.$destination.($query === '' ? '' : '?'.$query));
