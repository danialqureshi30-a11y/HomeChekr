const { analyzeHomeRequest } = require("../src/analysis/analyze-home");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    const body = typeof req.body === "object" && req.body !== null ? req.body : await readJsonBody(req);
    const analysis = await analyzeHomeRequest(body);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(analysis));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode = isClientError(message) ? 400 : 500;

    if (statusCode === 500) {
      console.error("Analyze API failure:", error);
    } else {
      console.warn("Analyze API validation error:", message);
    }

    res.statusCode = statusCode;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        error: statusCode === 400 ? "Invalid request" : "Unexpected server error",
        details: message
      })
    );
  }
};

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error("Request body must be valid JSON."));
      }
    });

    req.on("error", reject);
  });
}

function isClientError(message) {
  return [
    "Price must be greater than 0.",
    "City is required.",
    "ZIP code must be 5 digits.",
    "Bedroom and bathroom counts must be valid values.",
    "Home square footage is required.",
    "Repairs cost must be zero or greater.",
    "Request body must be valid JSON."
  ].includes(message);
}
