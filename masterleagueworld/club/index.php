<?php
$destination = isset($_GET['id']) ? '/masterleagueworld/club/overview/' : '/masterleagueworld/clubs/';
$query = http_build_query($_GET);
header('Location: '.$destination.($query === '' ? '' : '?'.$query));
