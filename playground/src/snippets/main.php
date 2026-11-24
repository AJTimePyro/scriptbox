<?php
// PHP 8 idioms: spread args, match, and JSON.

function total(int ...$numbers): int {
    return array_sum($numbers);
}

$scores = ["alpha" => 3, "beta" => 5, "gamma" => 7];
foreach ($scores as $name => $score) {
    $status = match (true) {
        $score > 5 => "high",
        default => "low",
    };
    printf("%-6s %2d  %s\n", $name, $score, $status);
}

echo "total: ", total(...array_values($scores)), "\n";
echo json_encode($scores, JSON_PRETTY_PRINT), "\n";
