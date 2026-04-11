const Fuse = require('fuse.js');
const NGOData = require('../models/NGOData');

let fuseInstance = null;
let ngoCache = [];

// 🧠 Load NGO dataset into memory
const loadNGOs = async () => {
  ngoCache = await NGOData.find({}).lean();

  fuseInstance = new Fuse(ngoCache, {
    keys: ['name'],
    threshold: 0.35,
    includeScore: true,
    minMatchCharLength: 3,
  });

  console.log(`📦 NGO dataset loaded: ${ngoCache.length} records`);
};

// 🔁 Reload cache every 6 hours
setInterval(loadNGOs, 6 * 60 * 60 * 1000);

exports.initNGOCache = loadNGOs;


// 🧹 Helper: Clean email (IMPORTANT)
const cleanEmail = (email) => {
  if (!email) return '';

  return email
    .split(/[\/|]/)[0]      // remove extra text like " / something"
    .replace(/\s+/g, '')    // remove spaces
    .trim()
    .toLowerCase();
};


// 🔒 Mask email for frontend
const maskEmail = (email) => {
  const cleaned = cleanEmail(email);
  if (!cleaned.includes('@')) return '';

  const [local, domain] = cleaned.split('@');

  const masked =
    local[0] +
    '*'.repeat(Math.max(local.length - 2, 3)) +
    (local.length > 1 ? local[local.length - 1] : '');

  return `${masked}@${domain}`;
};


// 🔍 Fuzzy search NGOs
exports.searchNGOByName = (query) => {
  if (!fuseInstance || !query) return [];

  const results = fuseInstance.search(query);

  return results.slice(0, 5).map((r) => ({
    id: r.item._id,
    name: r.item.name,
    ward: r.item.ward,
    isBmcPartner: r.item.isBmcPartner,
    score: r.score,

    // Only masked email exposed
    maskedEmail: maskEmail(r.item.email),

    // Internal use only (cleaned)
    _internalEmail: cleanEmail(r.item.email),
  }));
};


// ✅ Validate entered email with dataset
exports.validateEmailForNGO = async (ngoId, enteredEmail) => {
  const ngo = await NGOData.findById(ngoId);

  if (!ngo) {
    return { valid: false, ngo: null };
  }

  const storedEmail = cleanEmail(ngo.email);
  const userEmail = cleanEmail(enteredEmail);

  return {
    valid: storedEmail === userEmail,
    ngo,
  };
};