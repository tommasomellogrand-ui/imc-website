<?php
$destination = isset($_GET['id']) ? '/worldleague/club/overview/' : '/worldleague/clubs/';
$query = http_build_query($_GET);
header('Location: '.$destination.($query === '' ? '' : '?'.$query));
