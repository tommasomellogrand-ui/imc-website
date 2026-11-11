<?php
$destination = isset($_GET['id']) ? '/subbuteosuperleague/club/overview/' : '/subbuteosuperleague/clubs/';
$query = http_build_query($_GET);
header('Location: '.$destination.($query === '' ? '' : '?'.$query));
