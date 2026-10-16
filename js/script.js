// script.js
let charts = {};
let latestData = {}; // Stockage global des données récupérées de PHP

function makeCanvas(widthPercent = "100%", heightPx = 400) {
  const c = document.createElement("canvas");
  c.style.width = widthPercent;
  c.style.height = heightPx + "px";
  return c;
}

// Initialisation des mini-charts
function initCharts() {
  charts["chart1a"] = new Chart(document.getElementById("chart1a-mini"), {
    type: "pie",
    data: {
      labels: ["Femmes", "Hommes"],
      datasets: [{ data: [0, 0], backgroundColor: ["#36A2EB", "#f38d34"] }],
    },
    options: {
      plugins: {
        legend: { reverse: true },
        // datalabels pour afficher les % directement sur les parts
        datalabels: {
          color: "#fff",
          anchor: "center",
          align: "center",
          clamp: true,
          font: { weight: "bold", size: 12 },
          formatter: (value, context) => {
            const dataset = context.chart.data.datasets[0].data || [];
            const total = dataset.reduce((a, b) => a + b, 0) || 0;
            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
            return pct + "%";
          },
        },
        // tooltip configurée pour afficher le % (et éviter chiffres sans %)
        tooltip: {
          enabled: true,
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed;
              const ds = context.dataset.data || [];
              const total = ds.reduce((a, b) => a + b, 0) || 0;
              const pct =
                total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
              return `${label}: ${pct}%`;
            },
          },
        },
      },
      maintainAspectRatio: false,
    },
    // activation locale du plugin datalabels
    plugins: [ChartDataLabels],
  });

  charts["chart1b"] = new Chart(document.getElementById("chart1b-mini"), {
    type: "pie",
    data: {
      labels: ["Femmes", "Hommes"],
      datasets: [{ data: [0, 0], backgroundColor: ["#f1d326", "#a53806"] }],
    },
    options: {
      plugins: {
        legend: { reverse: true },
        datalabels: {
          color: "#fff",
          anchor: "center",
          align: "center",
          clamp: true,
          font: { weight: "bold", size: 12 },
          formatter: (value, context) => {
            const dataset = context.chart.data.datasets[0].data || [];
            const total = dataset.reduce((a, b) => a + b, 0) || 0;
            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
            return pct + "%";
          },
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed;
              const ds = context.dataset.data || [];
              const total = ds.reduce((a, b) => a + b, 0) || 0;
              const pct =
                total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
              return `${label}: ${pct}%`;
            },
          },
        },
      },
      maintainAspectRatio: false,
    },
    plugins: [ChartDataLabels],
  });

  charts["chart2"] = new Chart(document.getElementById("chart2-mini"), {
    type: "bar",
    data: {
      labels: ["BC", "BP", "T1", "T2"],
      datasets: [
        {
          label: "Nombre",
          data: [0, 0, 0, 0],
          backgroundColor: ["#1379bd", "#c4cec8", "#f1c40f", "#e74c3c"],
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      plugins: {
        datalabels: {
          anchor: "end",
          align: "top",
          color: "#333ce0ff", //"#000",
          font: { weight: "bold", size: 12 },
          formatter: (value) => value, // affiche directement la valeur
        },
      },
    },
    plugins: [ChartDataLabels],
  });

  charts["chart3"] = new Chart(document.getElementById("chart3-mini"), {
    type: "line",
    data: {
      labels: ["2023", "2024", "2025"],
      datasets: [
        {
          label: "Somme BC",
          data: [0, 0, 0],
          borderColor: "#36A2EB",
          fill: false,
        },
        {
          label: "Somme BP",
          data: [0, 0, 0],
          borderColor: "#cd6a19",
          fill: false,
        },
        {
          label: "Somme T1",
          data: [0, 0, 0],
          borderColor: "#96a6b1",
          fill: false,
        },
        {
          label: "Somme T2",
          data: [0, 0, 0],
          borderColor: "#ffd15c",
          fill: false,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } },
    },
  });

  charts["chart4"] = new Chart(document.getElementById("chart4-mini"), {
    type: "bar",
    data: {
      labels: Array.from({ length: 10 }, (_, i) => `Projet ${i + 1}`),
      datasets: [
        {
          label: "Montants (FCFA)",
          data: new Array(10).fill(0),
          backgroundColor: "#8e44ad",
        },
      ],
    },
    options: {
      indexAxis: "y",
      maintainAspectRatio: false,
      scales: { x: { beginAtZero: true } },
      plugins: {
        datalabels: {
          color: (ctx) => {
            const val = ctx.dataset.data[ctx.dataIndex];
            const label = val.toLocaleString("fr-FR") + " FCFA";
            const barWidth =
              ctx.chart.scales.x.getPixelForValue(val) -
              ctx.chart.scales.x.left;
            const estLargeurTexte = label.length * 7; // ~7px par caractère
            return barWidth > estLargeurTexte ? "#fff" : "#000";
          },
          anchor: (ctx) => {
            const val = ctx.dataset.data[ctx.dataIndex];
            const label = val.toLocaleString("fr-FR") + " FCFA";
            const barWidth =
              ctx.chart.scales.x.getPixelForValue(val) -
              ctx.chart.scales.x.left;
            const estLargeurTexte = label.length * 7;
            return barWidth > estLargeurTexte ? "center" : "end";
          },
          align: (ctx) => {
            const val = ctx.dataset.data[ctx.dataIndex];
            const label = val.toLocaleString("fr-FR") + " FCFA";
            const barWidth =
              ctx.chart.scales.x.getPixelForValue(val) -
              ctx.chart.scales.x.left;
            const estLargeurTexte = label.length * 7;
            return barWidth > estLargeurTexte ? "center" : "right";
          },
          font: { weight: "bold", size: 11 },
          formatter: (value) => value.toLocaleString("fr-FR") + " FCFA",
        },
      },
    },
    plugins: [ChartDataLabels],
  });
}

// Chargement des filtres depuis la BD
async function loadFilters() {
  try {
    const res = await fetch("php/get_filters.php");
    if (!res.ok) throw new Error("Erreur filters HTTP " + res.status);
    const json = await res.json();
    const casSel = document.getElementById("cas");
    const anneeSel = document.getElementById("annee");

    casSel.innerHTML = "";
    anneeSel.innerHTML = "";

    (json.cas || []).forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      casSel.appendChild(opt);
    });

    (json.years || [])
      .sort((a, b) => b - a)
      .forEach((y) => {
        const opt = document.createElement("option");
        opt.value = y;
        opt.textContent = y;
        anneeSel.appendChild(opt);
      });

    casSel.addEventListener("change", updateCharts);
    anneeSel.addEventListener("change", updateCharts);
  } catch (e) {
    console.error("Erreur loadFilters:", e);
  }
}

// Mise à jour des graphiques miniatures
async function updateCharts() {
  const cas = document.getElementById("cas").value;
  const annee = document.getElementById("annee").value;
  const url = `php/get_data.php?cas=${encodeURIComponent(
    cas
  )}&annee=${encodeURIComponent(annee)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Erreur HTTP " + res.status);
    latestData = await res.json(); // on stocke globalement

    // Répartition T1
    charts["chart1a"].data.datasets[0].data = latestData.t1 ?? [0, 0];
    charts["chart1a"].update();

    // Répartition T2
    charts["chart1b"].data.datasets[0].data = latestData.t2 ?? [0, 0];
    charts["chart1b"].update();

    // Projets par type
    charts["chart2"].data.datasets[0].data = latestData.type ?? [0, 0, 0, 0];
    charts["chart2"].update();

    // Variation annuelle
    if (latestData.annuel) {
      charts["chart3"].data.labels = latestData.annuel.years ?? [];
      charts["chart3"].data.datasets[0].data = latestData.annuel.BC ?? [];
      charts["chart3"].data.datasets[1].data = latestData.annuel.BP ?? [];
      charts["chart3"].data.datasets[2].data = latestData.annuel.T1 ?? [];
      charts["chart3"].data.datasets[3].data = latestData.annuel.T2 ?? [];
    }
    charts["chart3"].update();

    // Top 10
    charts["chart4"].data.labels = latestData.top10_labels ?? [];
    charts["chart4"].data.datasets[0].data = latestData.top10 ?? [];
    charts["chart4"].update();
  } catch (err) {
    console.error("Erreur updateCharts:", err);
  }
}

// Modal (agrandissement)
function openModal(chartId) {
  document.getElementById("modal").style.display = "flex";
  const container = document.getElementById("modal-container");
  container.innerHTML = "";

  if (chartId === "chart1") {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.gap = "20px";
    wrapper.style.justifyContent = "center";

    const c1 = makeCanvas("48%", 420);
    const c2 = makeCanvas("48%", 420);
    wrapper.appendChild(c1);
    wrapper.appendChild(c2);
    container.appendChild(wrapper);

    new Chart(c1, {
      type: "pie",
      data: JSON.parse(JSON.stringify(charts["chart1a"].data)),
      options: {
        responsive: true,
        // maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", reverse: true },
          datalabels: {
            color: "#fff",
            anchor: "center",
            align: "center",
            clamp: true,
            font: { weight: "bold", size: 14 },
            formatter: (value, context) => {
              const dataset = context.chart.data.datasets[0].data || [];
              const total = dataset.reduce((a, b) => a + b, 0) || 0;
              const pct =
                total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
              return pct + "%";
            },
          },
          tooltip: {
            enabled: true,
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.parsed;
                const ds = context.dataset.data || [];
                const total = ds.reduce((a, b) => a + b, 0) || 0;
                const pct =
                  total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
                return `${label}: ${pct}%`;
              },
            },
          },
        },
      },
      plugins: [ChartDataLabels],
    });

    new Chart(c2, {
      type: "pie",
      data: JSON.parse(JSON.stringify(charts["chart1b"].data)),
      options: {
        responsive: true,
        // maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", reverse: true },
          datalabels: {
            color: "#fff",
            anchor: "center",
            align: "center",
            clamp: true,
            font: { weight: "bold", size: 14 },
            formatter: (value, context) => {
              const dataset = context.chart.data.datasets[0].data || [];
              const total = dataset.reduce((a, b) => a + b, 0) || 0;
              const pct =
                total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
              return pct + "%";
            },
          },
          tooltip: {
            enabled: true,
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.parsed;
                const ds = context.dataset.data || [];
                const total = ds.reduce((a, b) => a + b, 0) || 0;
                const pct =
                  total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
                return `${label}: ${pct}%`;
              },
            },
          },
        },
      },
      plugins: [ChartDataLabels],
    });
  } else {
    const c = makeCanvas("95%", 520);
    container.appendChild(c);

    if (chartId === "chart2") {
      new Chart(c, {
        type: "bar",
        data: {
          labels: ["BC", "BP", "T1", "T2"],
          datasets: [
            {
              label: "Nombre",
              data: latestData.type ?? [0, 0, 0, 0],
              backgroundColor: ["#1379bd", "#c4cec8", "#f1c40f", "#e74c3c"],
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
          plugins: {
            datalabels: {
              anchor: "end",
              align: "top",
              color: "#333ce0ff", //"#000",
              font: { weight: "bold", size: 14 },
              formatter: (value) => value,
            },
          },
        },
        plugins: [ChartDataLabels],
      });
    } else if (chartId === "chart3") {
      new Chart(c, {
        type: "line",
        data: {
          labels: latestData.annuel?.years ?? [],
          datasets: [
            {
              label: "Somme BC",
              data: latestData.annuel?.BC ?? [],
              borderColor: "#36A2EB",
              fill: false,
            },
            {
              label: "Somme BP",
              data: latestData.annuel?.BP ?? [],
              borderColor: "#cd6a19",
              fill: false,
            },
            {
              label: "Somme T1",
              data: latestData.annuel?.T1 ?? [],
              borderColor: "#96a6b1",
              fill: false,
            },
            {
              label: "Somme T2",
              data: latestData.annuel?.T2 ?? [],
              borderColor: "#ffd15c",
              fill: false,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true } },
        },
      });
    } else if (chartId === "chart4") {
      new Chart(c, {
        type: "bar",
        data: {
          labels: latestData.top10_labels ?? [],
          datasets: [
            {
              label: "Montants (FCFA)",
              data: latestData.top10 ?? [],
              backgroundColor: "#8e44ad",
            },
          ],
        },
        options: {
          indexAxis: "y",
          maintainAspectRatio: false,
          scales: { x: { beginAtZero: true } },
          plugins: {
            datalabels: {
              color: (ctx) => {
                const val = ctx.dataset.data[ctx.dataIndex];
                const label = val.toLocaleString("fr-FR") + " FCFA";
                const barWidth =
                  ctx.chart.scales.x.getPixelForValue(val) -
                  ctx.chart.scales.x.left;
                const estLargeurTexte = label.length * 7;
                return barWidth > estLargeurTexte ? "#fff" : "#000";
              },
              anchor: (ctx) => {
                const val = ctx.dataset.data[ctx.dataIndex];
                const label = val.toLocaleString("fr-FR") + " FCFA";
                const barWidth =
                  ctx.chart.scales.x.getPixelForValue(val) -
                  ctx.chart.scales.x.left;
                const estLargeurTexte = label.length * 7;
                return barWidth > estLargeurTexte ? "center" : "end";
              },
              align: (ctx) => {
                const val = ctx.dataset.data[ctx.dataIndex];
                const label = val.toLocaleString("fr-FR") + " FCFA";
                const barWidth =
                  ctx.chart.scales.x.getPixelForValue(val) -
                  ctx.chart.scales.x.left;
                const estLargeurTexte = label.length * 7;
                return barWidth > estLargeurTexte ? "center" : "right";
              },
              font: { weight: "bold", size: 13 },
              formatter: (value) => value.toLocaleString("fr-FR") + " FCFA",
            },
          },
        },
        plugins: [ChartDataLabels],
      });
    }
  }
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
  document.getElementById("modal-container").innerHTML = "";
}

// Démarrage
window.onload = async function () {
  initCharts();
  await loadFilters();
  updateCharts();
};

// Ajout pour PDF

// ---- EXPORTER LES GRAPHIQUES EN PDF ----
document.getElementById("btnExportPDF").addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  const cas = document.getElementById("cas").value || "Non défini";
  const annee = document.getElementById("annee").value || "Non définie";

  const header = `Tableau de bord - Suivi de financement des projets\nCAS : ${cas} | Année : ${annee}\n`;

  // légendes pour chaque graphique
  const legends = {
    chart1:
      "\nGraphique 1 : Répartition des projets par genre\n - Camembert 1 : Taux de financement des 1re Tranche\n - Camembert 2 : Taux de financement des 2e Tranche",
    chart2: "\n\nGraphique 2 : Projets par type",
    chart3: "\n\nGraphique 3 : Variation annuelle de financement des projets",
    chart4:
      "\n\nGraphique 4 : Top 10 de la catégorie des projets les plus financés",
  };

  let pageNum = 0;
  for (const chartId of ["chart1", "chart2", "chart3", "chart4"]) {
    if (pageNum > 0) pdf.addPage();

    // titre en haut
    pdf.setFontSize(12);
    pdf.text(header, 10, 15);

    // légende spécifique du graphique
    pdf.setFontSize(11);
    pdf.text(legends[chartId], 10, 25);

    // dimensions de la page
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - 60; // espace pour titre + légende

    if (chartId === "chart1") {
      // ---- Cas spécial : deux camemberts sur la même page ----
      for (const sub of ["a", "b"]) {
        const chart = charts[chartId + sub];
        if (!chart) continue;

        const canvas = await html2canvas(chart.canvas, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");

        let imgWidth = maxWidth;
        let imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (imgHeight > maxHeight / 2) {
          imgHeight = maxHeight / 2;
          imgWidth = (canvas.width * imgHeight) / canvas.height;
        }

        const x = (pageWidth - imgWidth) / 2;
        const y = sub === "a" ? 40 : 40 + imgHeight + 10; // 10px espace entre camemberts

        pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
      }
    } else {
      // ---- Cas normal : un seul graphique par page ----
      const chart = charts[chartId];
      if (!chart) continue;

      const canvas = await html2canvas(chart.canvas, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      let imgWidth = maxWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = (canvas.width * imgHeight) / canvas.height;
      }

      const x = (pageWidth - imgWidth) / 2;
      const y = 40;

      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
    }

    pageNum++;
  }

  pdf.save(`Tableau_Bord_Financement_${cas}_${annee}.pdf`);
});
