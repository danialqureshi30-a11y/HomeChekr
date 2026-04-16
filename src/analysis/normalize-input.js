function normalizeSubjectInput(input) {
  const normalized = {
    price: toNumber(input.price),
    city: String(input.city || "").trim(),
    zip: String(input.zip || "").trim(),
    bedrooms: toNumber(input.bedrooms),
    bathrooms: toNumber(input.bathrooms),
    squareFootage: toNumber(input.squareFootage),
    repairsCost: toNumber(input.repairsCost) || 0,
    notes: String(input.notes || "").trim()
  };

  validate(normalized);
  return normalized;
}

function validate(subject) {
  if (!subject.price || subject.price <= 0) {
    throw new Error("Price must be greater than 0.");
  }

  if (!subject.city) {
    throw new Error("City is required.");
  }

  if (!/^\d{5}$/.test(subject.zip)) {
    throw new Error("ZIP code must be 5 digits.");
  }

  if (Number.isNaN(subject.bedrooms) || subject.bedrooms < 0 || Number.isNaN(subject.bathrooms) || subject.bathrooms < 0) {
    throw new Error("Bedroom and bathroom counts must be valid values.");
  }

  if (Number.isNaN(subject.squareFootage) || subject.squareFootage <= 0) {
    throw new Error("Home square footage is required.");
  }

  if (Number.isNaN(subject.repairsCost) || subject.repairsCost < 0) {
    throw new Error("Repairs cost must be zero or greater.");
  }
}

function toNumber(value) {
  return Number(value);
}

module.exports = {
  normalizeSubjectInput
};
