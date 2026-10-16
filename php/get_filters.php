<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php';

try {
  // CAS distincts
  $stmt = $pdo->query("SELECT DISTINCT `CAS` FROM `transactions` WHERE `CAS` IS NOT NULL AND `CAS` <> '' ORDER BY `CAS`");
  $cas = $stmt->fetchAll(PDO::FETCH_COLUMN);

  // --- Départements distincts ---
  $stmt = $pdo->query("SELECT DISTINCT `Departement` FROM `transactions` WHERE `Departement` IS NOT NULL AND `Departement` <> '' ORDER BY `Departement`");
  $departements = $stmt->fetchAll(PDO::FETCH_COLUMN);

  // Années distinctes provenant des colonnes de date de paiement
  $sql_years = "
      SELECT DISTINCT YEAR(d) AS y FROM (
        SELECT `Date_Paiement_BC` AS d FROM `transactions`
        UNION
        SELECT `Date_Paiement_BP` FROM `transactions`
        UNION
        SELECT `Date_Tranche1` FROM `transactions`
        UNION
        SELECT `Date_Tranche2` FROM `transactions`
      ) AS uniondates
      WHERE d IS NOT NULL
      ORDER BY y DESC
    ";
  $stmt = $pdo->query($sql_years);
  $years = $stmt->fetchAll(PDO::FETCH_COLUMN);


  // Réponse JSON
  echo json_encode([
    'departements' => $departements,
    'cas' => $cas,
    'years' => $years
  ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
