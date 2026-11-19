<?php
$view = ($_GET['view'] ?? '') === 'clubs' ? 'directory' : 'rosteroverview';
$query = $_GET;
unset($query['view']);
header('Location: /sensiblesocceracademy/club/'.$view.'/'.($query ? '?'.http_build_query($query) : ''));
