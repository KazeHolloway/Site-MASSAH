let charts = {};
let latestData = {}; // données récupérées

function makeCanvas(widthPercent = "100%", heightPx = 400) {
  const c = document.createElement("canvas");
  c.style.width = widthPercent;
  c.style.height = heightPx + "px";
  return c;
}

function computeStepSize(max) {
  if (!isFinite(max) || max <= 0) return 1;
  const target = Math.ceil(max / 5);
  const candidates = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
  for (const c of candidates) if (c >= target) return c;
  return Math.ceil(target / 100) * 100;
}

// --- Initialisation des mini-charts ---
function initCharts() {
  // Age chart
  charts["age"] = new Chart(
    document.getElementById("ageChart-mini").getContext("2d"),
    {
      type: "bar",
      data: {
        labels: ["18 - 25 ans", "26 - 35 ans", "36 - 45 ans", "46 - 59 ans"],
        datasets: [
          {
            label: "Nombre de personnes",
            data: [0, 0, 0, 0],
            backgroundColor: [
              "rgba(39, 154, 189, 0.9)",
              "rgba(24, 70, 170, 0.9)",
              "rgba(255, 145, 86, 0.9)",
              "rgba(220, 96, 152, 0.9)",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 22 } },
        plugins: {
          legend: { display: false },
          datalabels: {
            color: "#000",
            anchor: "end",
            align: "top",
            clamp: true,
            font: { weight: "bold", size: 12 },
            formatter: (value) => value,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0, stepSize: 5 },
          },
        },
      },
      plugins: [ChartDataLabels],
    }
  );

  // Projects chart
  charts["projects"] = new Chart(
    document.getElementById("projectsChart-mini").getContext("2d"),
    {
      type: "bar",
      data: {
        labels: [
          "Projets conformes ou en réussite",
          "Projets non conformes ou en difficulté",
          "Projets interrompus",
          "Projets non démarrés",
        ],
        datasets: [
          {
            label: "Nombre de projets",
            data: [0, 0, 0, 0],
            backgroundColor: [
              "rgba(31, 197, 150, 1)",
              "rgba(255, 99, 132, 0.9)",
              "rgba(255, 206, 86, 0.9)",
              "rgba(153, 102, 255, 0.9)",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 22 } },
        plugins: {
          legend: { display: false },
          datalabels: {
            color: "#000",
            anchor: "end",
            align: "top",
            clamp: true,
            font: { weight: "bold", size: 12 },
            formatter: (value) => value,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0, stepSize: 5 },
          },
        },
      },
      plugins: [ChartDataLabels],
    }
  );
}

// --- Chargement des filtres depuis get_filters.php ---
async function loadFilters() {
  const depSel = document.getElementById("departement");
  const casSel = document.getElementById("cas");
  const anneeSel = document.getElementById("annee");

  depSel.innerHTML = "";
  casSel.innerHTML = "";
  anneeSel.innerHTML = "";

  try {
    const res = await fetch("php/get_filters.php");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();

    const deps = json.departements || [];
    const casList = json.cas || [];
    const years = json.years || [];

    const addOpt = (sel, val, txt) => {
      const o = document.createElement("option");
      o.value = val;
      o.textContent = txt;
      sel.appendChild(o);
    };

    // Départements
    deps.forEach((d) => addOpt(depSel, d, d));
    addOpt(depSel, "Aucun", "Aucun");

    // CAS
    casList.forEach((c) => addOpt(casSel, c, c));
    addOpt(casSel, "Aucune", "Aucune");

    // Années
    years.sort((a, b) => b - a).forEach((y) => addOpt(anneeSel, y, y));
  } catch (err) {
    console.warn("php/get_filters.php indisponible :", err);
  }

  // ---- Correction du démarrage ----
  if (depSel.options.length > 0) depSel.value = depSel.options[0].value; // premier département
  if ([...casSel.options].some((o) => o.value === "Aucune"))
    casSel.value = "Aucune";

  depSel.addEventListener("change", () => {
    if (depSel.value && depSel.value !== "Aucun") {
      casSel.value = "Aucune";
    } else if (depSel.value === "Aucun" && casSel.value === "Aucune") {
      // empêcher Aucun + Aucune
      casSel.value = "";
    }
    updateCharts();
  });

  casSel.addEventListener("change", () => {
    if (casSel.value && casSel.value !== "Aucune") {
      depSel.value = "Aucun";
    } else if (casSel.value === "Aucune" && depSel.value === "Aucun") {
      // empêcher Aucun + Aucune
      depSel.value = depSel.options[0].value;
    }
    updateCharts();
  });

  anneeSel.addEventListener("change", updateCharts);
}

// --- Récupère les données de get_data.php ---
async function updateCharts() {
  const dep = document.getElementById("departement").value;
  const cas = document.getElementById("cas").value;
  const annee = document.getElementById("annee").value;

  const depParam = dep && dep !== "Aucun" ? dep : "";
  const casParam = cas && cas !== "Aucune" ? cas : "";

  const url = `php/get_data.php?departement=${encodeURIComponent(
    depParam
  )}&cas=${encodeURIComponent(casParam)}&annee=${encodeURIComponent(annee)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();

    latestData.age =
      Array.isArray(json.ages) && json.ages.length === 4
        ? json.ages
        : [0, 0, 0, 0];
    latestData.projects =
      Array.isArray(json.natures) && json.natures.length === 4
        ? json.natures
        : [0, 0, 0, 0];
  } catch (err) {
    console.warn("php/get_data.php indisponible :", err);
    latestData.age = [0, 0, 0, 0];
    latestData.projects = [0, 0, 0, 0];
  }

  // Update charts
  charts["age"].data.datasets[0].data = latestData.age;
  charts["age"].options.scales.y.ticks.stepSize = computeStepSize(
    Math.max(...latestData.age, 1)
  );
  charts["age"].update();

  charts["projects"].data.datasets[0].data = latestData.projects;
  charts["projects"].options.scales.y.ticks.stepSize = computeStepSize(
    Math.max(...latestData.projects, 1)
  );
  charts["projects"].update();
}

// --- Modal ---
function openModal(id) {
  const modal = document.getElementById("modal");
  const container = document.getElementById("modal-container");
  modal.style.display = "flex";
  container.innerHTML = "";

  const c = makeCanvas("95%", 520);
  container.appendChild(c);

  let config = null;
  if (id === "ageChart") {
    config = {
      type: "bar",
      data: {
        labels: ["18 - 25 ans", "26 - 35 ans", "36 - 45 ans", "46 - 59 ans"],
        datasets: [
          {
            label: "Nombre de personnes",
            data: latestData.age ?? [0, 0, 0, 0],
            backgroundColor: [
              "rgba(39, 154, 189, 0.9)",
              "rgba(24, 70, 170, 0.9)",
              "rgba(255, 145, 86, 0.9)",
              "rgba(220, 96, 152, 0.9)",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 36 } },
        plugins: {
          legend: { display: true, position: "bottom" },
          datalabels: {
            color: "#000",
            anchor: "end",
            align: "top",
            clamp: true,
            font: { weight: "bold", size: 14 },
            formatter: (value) => value,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              stepSize: computeStepSize(
                Math.max(...(latestData.age ?? [0, 0, 0, 0]))
              ),
            },
          },
        },
      },
      plugins: [ChartDataLabels],
    };
  } else if (id === "projectsChart") {
    config = {
      type: "bar",
      data: {
        labels: [
          "Projets conformes ou en réussite",
          "Projets non conformes ou en difficulté",
          "Projets interrompus",
          "Projets non démarrés",
        ],
        datasets: [
          {
            label: "Nombre de projets",
            data: latestData.projects ?? [0, 0, 0, 0],
            backgroundColor: [
              "rgba(31, 197, 150, 1)",
              "rgba(255, 99, 132, 0.9)",
              "rgba(255, 206, 86, 0.9)",
              "rgba(153, 102, 255, 0.9)",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 36 } },
        plugins: {
          legend: { display: true, position: "bottom" },
          datalabels: {
            color: "#000",
            anchor: "end",
            align: "top",
            clamp: true,
            font: { weight: "bold", size: 14 },
            formatter: (value) => value,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              stepSize: computeStepSize(
                Math.max(...(latestData.projects ?? [0, 0, 0, 0]))
              ),
            },
          },
        },
      },
      plugins: [ChartDataLabels],
    };
  }

  if (config) new Chart(c, config);
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
  document.getElementById("modal-container").innerHTML = "";
}

// --- Startup ---
window.onload = async function () {
  initCharts();
  await loadFilters();
  updateCharts();
};

// Ajout pour PDF

// ---- EXPORTER LES GRAPHIQUES EN PDF (Tableau de Bord 2) ----
document.getElementById("btnExportPDF2").addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  // récupère les valeurs des filtres
  let dep = document.getElementById("departement").value || "--";
  let cas = document.getElementById("cas").value || "--";
  const annee = document.getElementById("annee").value || "Non définie";

  // exclusivité CAS / Département (affichage)
  if (dep && dep !== "" && dep !== "Aucun") {
    cas = "--";
  } else if (cas && cas !== "" && cas !== "Aucune") {
    dep = "--";
  } else {
    dep = "--";
    cas = "--";
  }

  const header = `Tableau de Bord - Suivi de l'exécution des projets\nDépartement : ${dep} | CAS : ${cas} | Année : ${annee}\n`;

  // légendes par graphique
  const legends = {
    age: "Graphique 1 : Répartition par tranche d'âge",
    projects: "Graphique 2 : Nature des projets",
  };

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;

  let pageNum = 0;
  for (const chartId of ["age", "projects"]) {
    if (pageNum > 0) pdf.addPage();

    // Titre / header (auto-wrap)
    pdf.setFontSize(11);
    const headerLines = pdf.splitTextToSize(header, pageWidth - margin * 2);
    let y = 15;
    pdf.text(headerLines, margin, y);
    y += headerLines.length * 6 + 6;

    // Légende du graphique
    pdf.setFontSize(12);
    pdf.text(legends[chartId], margin, y);
    y += 8;

    const chart = charts[chartId];
    if (!chart) {
      pageNum++;
      continue;
    }

    // Utilise l'image fournie par Chart.js (plus fiable que html2canvas pour les canvas)
    const imgData = chart.toBase64Image();

    // Crée un objet Image pour connaître les dimensions réelles (px)
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = imgData;
    });

    // conversion px -> mm (approx. 96 DPI)
    const pxToMm = 25.4 / 96; // ≈ 0.264583333
    const imgWidthMm = img.width * pxToMm;
    const imgHeightMm = img.height * pxToMm;

    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - y - margin;

    // calcule un scale (ne pas agrandir au-delà de la taille réelle)
    const scale = Math.min(1, maxWidth / imgWidthMm, maxHeight / imgHeightMm);

    const drawW = imgWidthMm * scale;
    const drawH = imgHeightMm * scale;
    const x = (pageWidth - drawW) / 2;

    pdf.addImage(imgData, "PNG", x, y, drawW, drawH);

    pageNum++;
  }

  pdf.save(`Tableau_Bord_Execution_${dep}_${cas}_${annee}.pdf`);
});
