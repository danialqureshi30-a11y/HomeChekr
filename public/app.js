const form = document.getElementById("home-form");
const demoFillButton = document.getElementById("demo-fill");
const emptyState = document.getElementById("empty-state");
const results = document.getElementById("results");

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

demoFillButton.addEventListener("click", () => {
  document.getElementById("price").value = 445000;
  document.getElementById("city").value = "Charlotte";
  document.getElementById("zip").value = "28277";
  document.getElementById("bedrooms").value = 4;
  document.getElementById("bathrooms").value = 2.5;
  document.getElementById("squareFootage").value = 2050;
  document.getElementById("repairsCost").value = 25000;
  document.getElementById("notes").value = "Demo property for a live comparable analysis";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = getFormData();
  await submitForAnalysis(input);
});

function getFormData() {
  const formData = new FormData(form);

  return {
    price: Number(formData.get("price")),
    city: String(formData.get("city")).trim(),
    zip: String(formData.get("zip")).trim(),
    bedrooms: Number(formData.get("bedrooms")),
    bathrooms: Number(formData.get("bathrooms")),
    squareFootage: Number(formData.get("squareFootage")),
    repairsCost: Number(formData.get("repairsCost") || 0),
    notes: String(formData.get("notes") || "").trim()
  };
}

async function submitForAnalysis(input) {
  toggleLoadingState(true);

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || payload.details || "Unable to analyze this home.");
    }

    renderResults(payload);
  } catch (error) {
    alert(error.message);
  } finally {
    toggleLoadingState(false);
  }
}

function toggleLoadingState(isLoading) {
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Analyzing..." : "Run HomeChekr Analysis";
}

function renderResults(analysis) {
  emptyState.classList.add("hidden");
  results.classList.remove("hidden");

  document.getElementById("recommendation-title").textContent = analysis.status.title;

  const pill = document.getElementById("recommendation-pill");
  pill.textContent = analysis.status.title;
  pill.className = `pill ${analysis.status.pillClass}`;

  document.getElementById("fair-value").textContent = currencyFormatter.format(analysis.fairValue);
  document.getElementById("price-delta").textContent = `${analysis.delta >= 0 ? "+" : "-"}${currencyFormatter.format(Math.abs(analysis.delta))}`;
  document.getElementById("confidence").textContent = `${analysis.confidence}%`;
  document.getElementById("analysis-summary").textContent = analysis.summary;
  document.getElementById("comps-count").textContent = `${analysis.comparables.length} listings`;

  renderProviderCoverage(analysis.providers);
  renderAdjustments(analysis.adjustments);
  renderComparables(analysis.comparables);
}

function renderProviderCoverage(providers) {
  const container = document.getElementById("provider-list");
  container.innerHTML = providers
    .map((provider) => {
      const detail =
        provider.status === "live"
          ? "Using live comparable listings returned by the configured API provider."
          : "Provider did not return live comparables.";

      return `
        <div class="adjustment-row">
          <div>
            <strong>${provider.name}</strong>
            <span>${detail}</span>
          </div>
          <strong>${provider.comparablesReturned} comps</strong>
        </div>
      `;
    })
    .join("");
}

function renderAdjustments(adjustments) {
  const container = document.getElementById("adjustment-list");
  container.innerHTML = adjustments
    .map((adjustment) => `
      <div class="adjustment-row">
        <div>
          <strong>${adjustment.label}</strong>
          <span>${adjustment.description}</span>
        </div>
        <strong>${currencyFormatter.format(adjustment.amount)}</strong>
      </div>
    `)
    .join("");
}

function renderComparables(comparables) {
  const container = document.getElementById("comps-list");
  container.innerHTML = comparables
    .map((comp) => {
      const linkMarkup = comp.listingUrl
        ? `<a class="source-link" href="${comp.listingUrl}" target="_blank" rel="noreferrer">Open source search</a>`
        : "";

      return `
        <article class="comp-card">
          <div>
            <p class="comp-title">${comp.address}</p>
            <p class="comp-meta">
              ${comp.bedrooms} bd | ${comp.bathrooms} ba | ${formatSquareFootage(comp.squareFootage)} home
            </p>
            <p class="comp-meta">
              ${formatDistance(comp.distanceMiles)} | ${comp.daysOnMarket} days on market
            </p>
            <div class="comp-actions">
              <span class="source-tag">${comp.source}</span>
              ${linkMarkup}
            </div>
          </div>
          <div class="comp-price">
            <strong>${currencyFormatter.format(comp.price)}</strong>
            <span>Adjusted: ${currencyFormatter.format(comp.adjustedPrice)}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function formatDistance(distanceMiles) {
  if (typeof distanceMiles !== "number") {
    return "Distance unavailable";
  }

  return `${distanceMiles.toFixed(1)} miles away`;
}

function formatSquareFootage(squareFootage) {
  if (typeof squareFootage !== "number" || Number.isNaN(squareFootage) || squareFootage <= 0) {
    return "N/A";
  }

  return `${Math.round(squareFootage).toLocaleString()} sq ft`;
}
