<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php';

$departement = isset($_GET['departement']) ? trim($_GET['departement']) : '';
$cas = isset($_GET['cas']) ? trim($_GET['cas']) : '';
$annee = isset($_GET['annee']) ? intval($_GET['annee']) : intval(date('Y'));

// construit clause SQL si CAS fourni
$casFilterSQL = '';
$params = [];
if ($cas !== '') {
  $casFilterSQL = " AND CAS = :cas ";
  $params[':cas'] = $cas;
}

try {
  // 1) Répartition T1/T2 par sexe
  $sql_sex = "
  SELECT
    SUM(CASE WHEN LOWER(TRIM(Sexe)) IN ('f','femme','féminin','fem') 
             AND YEAR(Date_Tranche1) = :annee THEN COALESCE(Tranche1,0) ELSE 0 END) AS t1_fem,
    SUM(CASE WHEN LOWER(TRIM(Sexe)) IN ('m','homme','masculin','hom') 
             AND YEAR(Date_Tranche1) = :annee THEN COALESCE(Tranche1,0) ELSE 0 END) AS t1_hom,
    SUM(CASE WHEN LOWER(TRIM(Sexe)) IN ('f','femme','féminin','fem') 
             AND YEAR(Date_Tranche2) = :annee THEN COALESCE(Tranche2,0) ELSE 0 END) AS t2_fem,
    SUM(CASE WHEN LOWER(TRIM(Sexe)) IN ('m','homme','masculin','hom') 
             AND YEAR(Date_Tranche2) = :annee THEN COALESCE(Tranche2,0) ELSE 0 END) AS t2_hom
  FROM transactions
  WHERE 1 {$casFilterSQL}
";


  $stmt = $pdo->prepare($sql_sex);

  if ($annee !== '') {
    $stmt->bindValue(':annee', $annee, PDO::PARAM_INT);
  }

  if ($cas !== '') {
    $stmt->bindValue(':cas', $cas);
  }

  $stmt->execute();
  $row = $stmt->fetch(PDO::FETCH_ASSOC);

  $t1_fem = floatval($row['t1_fem'] ?? 0);
  $t1_hom = floatval($row['t1_hom'] ?? 0);
  $t2_fem = floatval($row['t2_fem'] ?? 0);
  $t2_hom = floatval($row['t2_hom'] ?? 0);

  $pct = function ($a, $b) {
    $s = $a + $b;
    if ($s <= 0)
      return [0, 0];
    return [round($a / $s * 100, 1), round($b / $s * 100, 1)];
  };

  $t1_pct = $pct($t1_fem, $t1_hom);
  $t2_pct = $pct($t2_fem, $t2_hom);


  // 2) Projets par type (nombre d'occurrences pour l'année sélectionnée)
  $sql_counts = "
      SELECT
        SUM(CASE WHEN COALESCE(Montant_BC,0) > 0 AND YEAR(Date_Paiement_BC) = :annee THEN 1 ELSE 0 END) AS nb_BC,
        SUM(CASE WHEN COALESCE(Montant_BP,0) > 0 AND YEAR(Date_Paiement_BP) = :annee THEN 1 ELSE 0 END) AS nb_BP,
        SUM(CASE WHEN COALESCE(Tranche1,0) > 0 AND YEAR(Date_Tranche1) = :annee THEN 1 ELSE 0 END) AS nb_T1,
        SUM(CASE WHEN COALESCE(Tranche2,0) > 0 AND YEAR(Date_Tranche2) = :annee THEN 1 ELSE 0 END) AS nb_T2
      FROM transactions
      WHERE 1 {$casFilterSQL}
    ";
  $stmt = $pdo->prepare($sql_counts);
  $stmt->bindValue(':annee', $annee, PDO::PARAM_INT);
  if ($cas !== '')
    $stmt->bindValue(':cas', $cas);
  $stmt->execute();
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
  $type = [
    intval($row['nb_BC'] ?? 0),
    intval($row['nb_BP'] ?? 0),
    intval($row['nb_T1'] ?? 0),
    intval($row['nb_T2'] ?? 0)
  ];

  // 3) Annuel : chercher années disponibles (globalement) puis calculer sommes (filtré si CAS)
  $yearsStmt = $pdo->query("
      SELECT DISTINCT YEAR(d) AS y FROM (
        SELECT Date_Paiement_BC AS d FROM transactions
        UNION
        SELECT Date_Paiement_BP FROM transactions
        UNION
        SELECT Date_Tranche1 FROM transactions
        UNION
        SELECT Date_Tranche2 FROM transactions
      ) AS u
      WHERE d IS NOT NULL
      ORDER BY y ASC
    ");

  $years = $yearsStmt->fetchAll(PDO::FETCH_COLUMN);
  if (empty($years)) {
    // avoir les 3 dernières années
    $years = [$annee - 2, $annee - 1, $annee];
  }

  $annuel = ['years' => $years, 'BC' => [], 'BP' => [], 'T1' => [], 'T2' => []];
  foreach ($years as $y) {
    $sql_sum = "
          SELECT
            SUM(CASE WHEN YEAR(Date_Paiement_BC) = :y THEN COALESCE(Montant_BC,0) ELSE 0 END) AS sum_BC,
            SUM(CASE WHEN YEAR(Date_Paiement_BP) = :y THEN COALESCE(Montant_BP,0) ELSE 0 END) AS sum_BP,
            SUM(CASE WHEN YEAR(Date_Tranche1) = :y THEN COALESCE(Tranche1,0) ELSE 0 END) AS sum_T1,
            SUM(CASE WHEN YEAR(Date_Tranche2) = :y THEN COALESCE(Tranche2,0) ELSE 0 END) AS sum_T2
          FROM transactions
          WHERE 1 {$casFilterSQL}
        ";
    $stmt = $pdo->prepare($sql_sum);
    $stmt->bindValue(':y', $y, PDO::PARAM_INT);
    if ($cas !== '')
      $stmt->bindValue(':cas', $cas);
    $stmt->execute();
    $r = $stmt->fetch(PDO::FETCH_ASSOC);
    $annuel['BC'][] = floatval($r['sum_BC'] ?? 0);
    $annuel['BP'][] = floatval($r['sum_BP'] ?? 0);
    $annuel['T1'][] = floatval($r['sum_T1'] ?? 0);
    $annuel['T2'][] = floatval($r['sum_T2'] ?? 0);
  }

  // 4) Top 10 des projets les plus financés pour l'année sélectionnée (somme des montants payés sur l'année)
  $sql_top = "
      SELECT Nature_Projet AS label,
        SUM(
          (CASE WHEN YEAR(Date_Paiement_BC) = :annee THEN COALESCE(Montant_BC,0) ELSE 0 END) +
          (CASE WHEN YEAR(Date_Paiement_BP) = :annee THEN COALESCE(Montant_BP,0) ELSE 0 END) +
          (CASE WHEN YEAR(Date_Tranche1) = :annee THEN COALESCE(Tranche1,0) ELSE 0 END) +
          (CASE WHEN YEAR(Date_Tranche2) = :annee THEN COALESCE(Tranche2,0) ELSE 0 END)
        ) AS total
      FROM transactions
      WHERE 1 {$casFilterSQL}
      GROUP BY Nature_Projet
      HAVING total > 0
      ORDER BY total DESC
      LIMIT 10
    ";

  $stmt = $pdo->prepare($sql_top);
  $stmt->bindValue(':annee', $annee, PDO::PARAM_INT);
  if ($cas !== '')
    $stmt->bindValue(':cas', $cas);
  $stmt->execute();
  $top_labels = [];
  $top_vals = [];
  while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $top_labels[] = $r['label'] ?: "Projet inconnu";
    $top_vals[] = floatval($r['total']);
  }

  // pad to 10 if necessary so chart size consistent
  while (count($top_vals) < 10) {
    $top_vals[] = 0;
    $top_labels[] = "";
  }

  // Ajouts pour le Tableau de bord

  // On ne garde que l’un des deux filtres : CAS OU Département
  $extraFilterSQL = '';
  if ($departement !== '' && $cas === '') {
    $extraFilterSQL = " AND Departement = :departement ";
    $params[':departement'] = $departement;
  } elseif ($cas !== '' && $departement === '') {
    $extraFilterSQL = " AND CAS = :cas ";
    $params[':cas'] = $cas;
  }

  // 1) Répartition par tranche d’âge
  $sql_age = "
    SELECT
      SUM(CASE WHEN Age BETWEEN 18 AND 25 THEN 1 ELSE 0 END) AS tranche1,
      SUM(CASE WHEN Age BETWEEN 26 AND 35 THEN 1 ELSE 0 END) AS tranche2,
      SUM(CASE WHEN Age BETWEEN 36 AND 45 THEN 1 ELSE 0 END) AS tranche3,
      SUM(CASE WHEN Age BETWEEN 46 AND 59 THEN 1 ELSE 0 END) AS tranche4
    FROM transactions
    WHERE Age IS NOT NULL
      AND YEAR(COALESCE(Date_Paiement_BC, Date_Paiement_BP, Date_Tranche1, Date_Tranche2)) = :annee
      {$extraFilterSQL}
  ";
  $stmt = $pdo->prepare($sql_age);
  $stmt->bindValue(':annee', $annee, PDO::PARAM_INT);
  if ($departement !== '' && $cas === '') {
    $stmt->bindValue(':departement', $departement);
  } elseif ($cas !== '' && $departement === '') {
    $stmt->bindValue(':cas', $cas);
  }
  $stmt->execute();
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
  $ages = [
    intval($row['tranche1'] ?? 0),
    intval($row['tranche2'] ?? 0),
    intval($row['tranche3'] ?? 0),
    intval($row['tranche4'] ?? 0)
  ];

  // 2) Nature des projets
  $sql_nature = "
    SELECT
      SUM(
        CASE WHEN Tranche1 IS NOT NULL AND Date_Tranche1 IS NOT NULL
              AND Tranche2 IS NOT NULL AND Date_Tranche2 IS NOT NULL
             THEN 1 ELSE 0 END
      ) AS conformes,
      SUM(
        CASE WHEN Tranche1 IS NOT NULL AND Date_Tranche1 IS NOT NULL
              AND (Tranche2 IS NULL OR Date_Tranche2 IS NULL)
             THEN 1 ELSE 0 END
      ) AS non_conformes,
      SUM(
        CASE WHEN Montant_BC = 0 AND Montant_BP IS NOT NULL AND Date_Paiement_BP IS NOT NULL
             THEN 1 ELSE 0 END
      ) AS interrompus,
      SUM(
        CASE WHEN (Montant_BC IS NULL OR Montant_BC = 0)
              AND (Tranche1 IS NULL OR Tranche2 IS NULL)
              AND (Montant_BP IS NULL OR Montant_BP = 0)
             THEN 1 ELSE 0 END
      ) AS non_demarres
    FROM transactions
    WHERE YEAR(COALESCE(Date_Paiement_BC, Date_Paiement_BP, Date_Tranche1, Date_Tranche2)) = :annee
      {$extraFilterSQL}
  ";
  $stmt = $pdo->prepare($sql_nature);
  $stmt->bindValue(':annee', $annee, PDO::PARAM_INT);
  if ($departement !== '' && $cas === '') {
    $stmt->bindValue(':departement', $departement);
  } elseif ($cas !== '' && $departement === '') {
    $stmt->bindValue(':cas', $cas);
  }
  $stmt->execute();
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
  $natures = [
    intval($row['conformes'] ?? 0),
    intval($row['non_conformes'] ?? 0),
    intval($row['interrompus'] ?? 0),
    intval($row['non_demarres'] ?? 0)
  ];

  // Fin Ajouts

  // réponse JSON (structure attendue par script.js)
  $out = [
    't1' => $t1_pct,
    't2' => $t2_pct,
    'type' => $type,
    'annuel' => $annuel,
    'top10_labels' => $top_labels,
    'top10' => $top_vals,

    // --- Données tableau de bord 2 (ajoutées)
    'ages' => $ages,
    'natures' => $natures
  ];

  echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
  exit;

} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
  exit;
}