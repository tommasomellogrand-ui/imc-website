<?php
declare(strict_types=1);

$private = dirname(__DIR__) . '/__imc_private_gateway/config.php';

if (!is_file($private)) {
    throw new RuntimeException('Private Gateway configuration not found.');
}

return require $private;
