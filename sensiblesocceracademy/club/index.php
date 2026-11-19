<?php
$destination = isset($_GET['id']) ? '/sensiblesocceracademy/club/overview/' : '/sensiblesocceracademy/club/rosteroverview/';
$query = http_build_query($_GET);
header('Location: '.$destination.($query === '' ? '' : '?'.$query));
