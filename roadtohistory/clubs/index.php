<?php
$view = ($_GET['view'] ?? '') === 'clubs' ? 'directory' : 'rosteroverview';
$query = $_GET;
unset($query['view']);
header('Location: /roadtohistory/club/'.$view.'/'.($query ? '?'.http_build_query($query) : ''));
