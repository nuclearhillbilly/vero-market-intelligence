const WEIGHTS = {
  geological_score: 0.25,
  political_score: 0.2,
  legal_score: 0.15,
  economic_score: 0.15,
  market_access_score: 0.15,
  security_score: 0.1,
};

const metrics = [
  ["geological_score", "Geological"],
  ["political_score", "Political"],
  ["legal_score", "Legal"],
  ["economic_score", "Economic"],
  ["market_access_score", "Market Access"],
  ["security_score", "Security"],
];

let countries = [];
let chart;

const form = document.getElementById("country-form");
const formError = document.getElementById("form-error");
const explorerSelect = document.getElementById("explorer-select");
const countryASelect = document.getElementById("country-a");
const countryBSelect = document.getElementById("country-b");

const scoreTotal = (country) => {
  return metrics
    .map(([key]) => Number(country[key]) * WEIGHTS[key])
    .reduce((sum, value) => sum + value, 0)
    .toFixed(2);
};

async function fetchCountries() {
  const response = await fetch("/countries");
  countries = await response.json();
  populateSelects();
}

function populateSelects() {
  const options = countries
    .map((country) => `<option value="${country.id}">${country.name}</option>`)
    .join("");

  explorerSelect.innerHTML = options || '<option value="">No countries yet</option>';
  countryASelect.innerHTML = options || '<option value="">No countries yet</option>';
  countryBSelect.innerHTML = options || '<option value="">No countries yet</option>';

  if (countries.length > 0) {
    showCountryDetails(explorerSelect.value || String(countries[0].id));
  }
}

function validateForm(payload) {
  for (const [key, label] of metrics) {
    const value = Number(payload[key]);
    if (Number.isNaN(value) || value < 0 || value > 10) {
      return `${label} score must be a number between 0 and 10.`;
    }
  }
  if (!payload.name.trim()) {
    return "Country name is required.";
  }
  return "";
}

function getCountryById(id) {
  return countries.find((country) => String(country.id) === String(id));
}

function renderMetricRows(country) {
  return metrics
    .map(([key, label]) => `<div><strong>${label}:</strong> ${Number(country[key]).toFixed(2)}</div>`)
    .join("");
}

function showCountryDetails(countryId) {
  const container = document.getElementById("country-details");
  const country = getCountryById(countryId);

  if (!country) {
    container.innerHTML = "Select a country to view details.";
    return;
  }

  container.innerHTML = `
    <h3>${country.name}</h3>
    ${renderMetricRows(country)}
    <div><strong>Total Score:</strong> ${scoreTotal(country)}</div>
  `;
}

function comparisonCard(title, country, otherCountry) {
  const rows = metrics
    .map(([key, label]) => {
      const difference = (Number(country[key]) - Number(otherCountry[key])).toFixed(2);
      return `<tr><td>${label}</td><td>${Number(country[key]).toFixed(2)}</td><td>${difference}</td></tr>`;
    })
    .join("");

  return `
    <div class="detail-card">
      <h3>${title}: ${country.name}</h3>
      <div><strong>Total Score:</strong> ${scoreTotal(country)}</div>
      <table class="metrics-table">
        <thead><tr><th>Metric</th><th>Value</th><th>Diff (A-B)</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderChart(countryA, countryB) {
  const ctx = document.getElementById("comparison-chart");
  const labels = metrics.map(([, label]) => label);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "radar",
    data: {
      labels,
      datasets: [
        {
          label: countryA.name,
          data: metrics.map(([key]) => Number(countryA[key])),
          borderColor: "#1d4ed8",
          backgroundColor: "rgba(29,78,216,0.2)",
        },
        {
          label: countryB.name,
          data: metrics.map(([key]) => Number(countryB[key])),
          borderColor: "#059669",
          backgroundColor: "rgba(5,150,105,0.2)",
        },
      ],
    },
    options: {
      scales: { r: { suggestedMin: 0, suggestedMax: 10 } },
      plugins: { legend: { position: "bottom" } },
    },
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.textContent = "";

  const payload = Object.fromEntries(new FormData(form).entries());
  const validationError = validateForm(payload);

  if (validationError) {
    formError.textContent = validationError;
    return;
  }

  metrics.forEach(([key]) => {
    payload[key] = Number(payload[key]);
  });

  const response = await fetch("/countries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    formError.textContent = "Unable to add country. Name may already exist.";
    return;
  }

  form.reset();
  await fetchCountries();
});

document.getElementById("view-details").addEventListener("click", () => {
  showCountryDetails(explorerSelect.value);
});

explorerSelect.addEventListener("change", () => showCountryDetails(explorerSelect.value));

document.getElementById("compare-btn").addEventListener("click", () => {
  const message = document.getElementById("compare-message");
  const container = document.getElementById("comparison");

  if (countries.length < 2) {
    message.textContent = "Please add at least two countries to compare.";
    container.innerHTML = "";
    if (chart) chart.destroy();
    return;
  }

  const countryA = getCountryById(countryASelect.value);
  const countryB = getCountryById(countryBSelect.value);

  if (!countryA || !countryB || countryA.id === countryB.id) {
    message.textContent = "Select two different countries for comparison.";
    return;
  }

  message.textContent = "";
  container.innerHTML = comparisonCard("Country A", countryA, countryB) + comparisonCard("Country B", countryB, countryA);
  renderChart(countryA, countryB);
});

document.getElementById("rank-btn").addEventListener("click", async () => {
  const response = await fetch("/score", { method: "POST" });
  const ranked = await response.json();
  document.getElementById("ranking-body").innerHTML = ranked
    .map((row, index) => `<tr><td>${index + 1}</td><td>${row.name}</td><td>${Number(row.score).toFixed(2)}</td></tr>`)
    .join("");
});

fetchCountries();
