/* ═══════════════════════════════════════════════════════
   crop.js  –  Crop Planning & Soil Management
   Handles: Rotation Planner, Seasonal Calendar,
            Nutrient Bars, Yield Tracker
   ═══════════════════════════════════════════════════════ */

/* ── Storage helpers ───────────────────────────────────── */
const STORAGE_KEYS = {
  rotations : 'pms_rotations',
  yields    : 'pms_yields',
};

function loadData(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/* ══════════════════════════════════════════════════════════
   1.  TAB SYSTEM  (shared by all pages that use .tabs)
   ══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tabs').forEach(tabGroup => {
    tabGroup.addEventListener('click', e => {
      const btn = e.target.closest('.tab');
      if (!btn) return;

      // Deactivate siblings
      tabGroup.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');

      // Find which section this tab group is inside
      const section = tabGroup.closest('section');
      const tabId   = btn.dataset.tab;

      section.querySelectorAll('.tab-content').forEach(tc => {
        tc.classList.toggle('active', tc.id === `tab-${tabId}`);
      });
    });
  });

  /* Initial renders */
  initCropModule();
});

function initCropModule() {
  renderRotationList();
  updateNutrients();
  renderYieldList();
}

/* ══════════════════════════════════════════════════════════
   2.  CROP ROTATION PLANNER
   ══════════════════════════════════════════════════════════ */

/** Recommended next crops keyed by current crop */
const ROTATION_RECOMMENDATIONS = {
  'Corn'       : ['Soybeans', 'Legumes', 'Cover Crop'],
  'Soybeans'   : ['Corn', 'Wheat', 'Sorghum'],
  'Wheat'      : ['Soybeans', 'Legumes', 'Cover Crop'],
  'Cotton'     : ['Wheat', 'Legumes', 'Cover Crop'],
  'Sorghum'    : ['Soybeans', 'Legumes', 'Wheat'],
  'Legumes'    : ['Corn', 'Wheat', 'Cotton', 'Sorghum'],
  'Cover Crop' : ['Corn', 'Cotton', 'Sorghum'],
};

const SEASON_COLORS = {
  Spring : '#4caf50',
  Summer : '#ff9800',
  Fall   : '#795548',
  Winter : '#2196f3',
};

function addRotation() {
  const field  = document.getElementById('cr-field').value.trim();
  const crop   = document.getElementById('cr-curr').value;
  const season = document.getElementById('cr-season').value;

  if (!field) {
    showInlineError('cr-field', 'Please enter a field name.');
    return;
  }

  const rotations = loadData(STORAGE_KEYS.rotations);
  const id        = Date.now();
  const nextCrops = ROTATION_RECOMMENDATIONS[crop] || [];

  rotations.push({ id, field, crop, season, added: new Date().toLocaleDateString() });
  saveData(STORAGE_KEYS.rotations, rotations);

  document.getElementById('cr-field').value = '';
  renderRotationList();
}

function renderRotationList() {
  const container = document.getElementById('rot-list');
  const rotations = loadData(STORAGE_KEYS.rotations);

  if (!rotations.length) {
    container.innerHTML = '<p class="empty-state">No rotation entries yet. Add your first field above.</p>';
    return;
  }

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Field</th>
          <th>Current Crop</th>
          <th>Season</th>
          <th>Recommended Next</th>
          <th>Added</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${rotations.map(r => {
          const next = (ROTATION_RECOMMENDATIONS[r.crop] || ['—']).join(', ');
          return `
          <tr>
            <td><strong>${escHtml(r.field)}</strong></td>
            <td>
              <span class="badge badge-green">${escHtml(r.crop)}</span>
            </td>
            <td>
              <span class="season-dot" style="background:${SEASON_COLORS[r.season] || '#888'}"></span>
              ${r.season}
            </td>
            <td class="next-crops">${escHtml(next)}</td>
            <td>${r.added}</td>
            <td>
              <button class="btn-icon btn-danger" onclick="deleteRotation(${r.id})" title="Remove entry">
                <i class="ti ti-trash"></i>
              </button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

function deleteRotation(id) {
  const rotations = loadData(STORAGE_KEYS.rotations).filter(r => r.id !== id);
  saveData(STORAGE_KEYS.rotations, rotations);
  renderRotationList();
}

/* ══════════════════════════════════════════════════════════
   3.  SOIL NUTRIENT STATUS
   ══════════════════════════════════════════════════════════ */

const NUTRIENT_DATA = {
  'Sandy Loam': {
    N: { val: 58, status: 'Adequate',   color: '#4caf50', advice: 'Maintain with moderate N application. Sandy loam drains fast — split applications work better.' },
    P: { val: 72, status: 'Good',       color: '#4caf50', advice: 'Phosphorus levels are healthy. Avoid excess to prevent runoff into waterways.' },
    K: { val: 44, status: 'Low',        color: '#ff9800', advice: 'Potassium is deficient. Apply 60–80 kg K₂O/ha before sowing.' },
    Ca: { val: 80, status: 'Good',      color: '#4caf50', advice: 'Calcium is adequate. Supports cell wall strength and disease resistance.' },
    Mg: { val: 35, status: 'Marginal',  color: '#ff9800', advice: 'Apply dolomite lime or Epsom salt to boost magnesium.' },
    S:  { val: 60, status: 'Adequate',  color: '#4caf50', advice: 'Sulphur supports protein synthesis. Current levels are sufficient for most crops.' },
  },
  'Clay': {
    N: { val: 70, status: 'Good',       color: '#4caf50', advice: 'Clay retains nitrogen well. Avoid over-application to reduce leaching risk.' },
    P: { val: 50, status: 'Adequate',   color: '#4caf50', advice: 'Phosphorus binds to clay particles — banded application improves efficiency.' },
    K: { val: 82, status: 'High',       color: '#2196f3', advice: 'Potassium is high. Skip K fertiliser this season to avoid luxury uptake.' },
    Ca: { val: 90, status: 'Excellent', color: '#2196f3', advice: 'High calcium is common in clays. May contribute to alkalinity — check pH.' },
    Mg: { val: 65, status: 'Good',      color: '#4caf50', advice: 'Magnesium levels are fine. Continue current management.' },
    S:  { val: 40, status: 'Low',       color: '#f44336', advice: 'Sulphur deficient. Apply 15–20 kg S/ha, especially for oilseeds.' },
  },
  'Silt': {
    N: { val: 63, status: 'Adequate',   color: '#4caf50', advice: 'Silt soils have moderate N retention. Consider slow-release formulations.' },
    P: { val: 55, status: 'Adequate',   color: '#4caf50', advice: 'Phosphorus is sufficient for most crops. Monitor during high-demand stages.' },
    K: { val: 60, status: 'Good',       color: '#4caf50', advice: 'Potassium is healthy. Silt soils hold K well between seasons.' },
    Ca: { val: 75, status: 'Good',      color: '#4caf50', advice: 'Calcium is adequate. Regular liming maintains levels in silt soils.' },
    Mg: { val: 50, status: 'Adequate',  color: '#4caf50', advice: 'Adequate magnesium. No supplementation needed this cycle.' },
    S:  { val: 55, status: 'Adequate',  color: '#4caf50', advice: 'Sulphur is adequate. Review if growing legumes or Brassica crops.' },
  },
  'Peat': {
    N: { val: 88, status: 'Very High',  color: '#2196f3', advice: 'Peat soils are naturally N-rich from organic matter. Avoid additional N application.' },
    P: { val: 30, status: 'Low',        color: '#f44336', advice: 'Phosphorus is deficient in peat. Apply 40–60 kg P₂O₅/ha. Use broadcast + incorporate.' },
    K: { val: 25, status: 'Critical',   color: '#f44336', advice: 'Critical potassium deficiency in peat. Apply 80–120 kg K₂O/ha immediately.' },
    Ca: { val: 40, status: 'Low',       color: '#f44336', advice: 'Peat is typically acidic and low in calcium. Lime aggressively to target pH 5.5–6.5.' },
    Mg: { val: 20, status: 'Critical',  color: '#f44336', advice: 'Very low magnesium. Apply dolomite lime or kieserite at 30–50 kg/ha.' },
    S:  { val: 70, status: 'Good',      color: '#4caf50', advice: 'Peat naturally holds sulphur. Current levels are good.' },
  },
};

const STATUS_BADGE_CLASS = {
  'Critical'  : 'badge-danger',
  'Low'       : 'badge-amber',
  'Marginal'  : 'badge-amber',
  'Adequate'  : 'badge-green',
  'Good'      : 'badge-green',
  'High'      : 'badge-blue',
  'Very High' : 'badge-blue',
  'Excellent' : 'badge-blue',
};

function updateNutrients() {
  const soilType = document.getElementById('soil-type')?.value || 'Sandy Loam';
  const data     = NUTRIENT_DATA[soilType];
  const container = document.getElementById('nutrient-bars');
  if (!container || !data) return;

  container.innerHTML = Object.entries(data).map(([nutrient, info]) => `
    <div class="nutrient-row">
      <div class="nutrient-header">
        <span class="nutrient-name">${nutrient}</span>
        <span class="nutrient-value">${info.val}%</span>
        <span class="badge ${STATUS_BADGE_CLASS[info.status] || 'badge-green'}">${info.status}</span>
      </div>
      <div class="nutrient-bar-track">
        <div class="nutrient-bar-fill" style="width:${info.val}%; background:${info.color}"></div>
      </div>
      <p class="nutrient-advice">${info.advice}</p>
    </div>
  `).join('');
}

/* ══════════════════════════════════════════════════════════
   4.  YIELD TRACKER
   ══════════════════════════════════════════════════════════ */

function addYield() {
  const crop   = document.getElementById('y-crop').value.trim();
  const area   = parseFloat(document.getElementById('y-area').value);
  const yld    = parseFloat(document.getElementById('y-yield').value);
  const season = document.getElementById('y-season').value;

  if (!crop) { showInlineError('y-crop', 'Enter a crop name.'); return; }
  if (isNaN(area) || area <= 0) { showInlineError('y-area', 'Enter a valid area.'); return; }
  if (isNaN(yld)  || yld  < 0) { showInlineError('y-yield', 'Enter a valid yield.'); return; }

  const yields = loadData(STORAGE_KEYS.yields);
  yields.push({
    id     : Date.now(),
    crop,
    area,
    yld,
    total  : +(area * yld).toFixed(2),
    season,
    logged : new Date().toLocaleDateString(),
  });
  saveData(STORAGE_KEYS.yields, yields);

  /* Reset fields */
  document.getElementById('y-crop').value  = '';
  document.getElementById('y-area').value  = '';
  document.getElementById('y-yield').value = '';

  renderYieldList();
}

function renderYieldList() {
  const container = document.getElementById('yield-list');
  const yields    = loadData(STORAGE_KEYS.yields);

  if (!container) return;

  if (!yields.length) {
    container.innerHTML = '<p class="empty-state">No yield records yet. Log your first harvest above.</p>';
    return;
  }

  /* Sort by most recent first */
  const sorted = [...yields].reverse();

  /* Summary stats */
  const totalTons  = yields.reduce((s, y) => s + y.total, 0).toFixed(2);
  const totalAcres = yields.reduce((s, y) => s + y.area, 0).toFixed(1);
  const avgYield   = yields.length
    ? (yields.reduce((s, y) => s + y.yld, 0) / yields.length).toFixed(2)
    : 0;

  container.innerHTML = `
    <div class="yield-summary-row">
      <div class="yield-stat"><span class="yield-stat-num">${yields.length}</span><span class="yield-stat-lbl">Records</span></div>
      <div class="yield-stat"><span class="yield-stat-num">${totalAcres}</span><span class="yield-stat-lbl">Total Acres</span></div>
      <div class="yield-stat"><span class="yield-stat-num">${totalTons}</span><span class="yield-stat-lbl">Total Tons</span></div>
      <div class="yield-stat"><span class="yield-stat-num">${avgYield}</span><span class="yield-stat-lbl">Avg t/acre</span></div>
    </div>
    <table class="data-table" style="margin-top:12px">
      <thead>
        <tr>
          <th>Crop</th>
          <th>Season</th>
          <th>Area (acres)</th>
          <th>Yield (t/acre)</th>
          <th>Total Yield (tons)</th>
          <th>Grade</th>
          <th>Logged</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${sorted.map(y => {
          const grade = yieldGrade(y.yld);
          return `
          <tr>
            <td><strong>${escHtml(y.crop)}</strong></td>
            <td>${escHtml(y.season)}</td>
            <td>${y.area}</td>
            <td>${y.yld}</td>
            <td><strong>${y.total}</strong></td>
            <td><span class="badge ${grade.cls}">${grade.label}</span></td>
            <td>${y.logged}</td>
            <td>
              <button class="btn-icon btn-danger" onclick="deleteYield(${y.id})" title="Delete">
                <i class="ti ti-trash"></i>
              </button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

/** Grade yield performance */
function yieldGrade(val) {
  if (val >= 5)   return { label: 'Excellent', cls: 'badge-blue'  };
  if (val >= 3.5) return { label: 'Good',      cls: 'badge-green' };
  if (val >= 2)   return { label: 'Average',   cls: 'badge-amber' };
  return            { label: 'Low',       cls: 'badge-danger' };
}

function deleteYield(id) {
  const yields = loadData(STORAGE_KEYS.yields).filter(y => y.id !== id);
  saveData(STORAGE_KEYS.yields, yields);
  renderYieldList();
}

/* ══════════════════════════════════════════════════════════
   5.  UTILITY HELPERS
   ══════════════════════════════════════════════════════════ */

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showInlineError(fieldId, msg) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.classList.add('input-error');
  el.setAttribute('placeholder', msg);
  el.value = '';
  el.focus();
  setTimeout(() => {
    el.classList.remove('input-error');
    el.setAttribute('placeholder', el.dataset.placeholder || '');
  }, 2500);
}

/* ══════════════════════════════════════════════════════════
   6.  INLINE CSS INJECTION  (scoped to crop module)
      Adds only what the crop module needs that may not
      already be in styles.css
   ══════════════════════════════════════════════════════════ */
(function injectCropStyles() {
  if (document.getElementById('crop-module-styles')) return;
  const style = document.createElement('style');
  style.id = 'crop-module-styles';
  style.textContent = `
    /* ── Rotation list ─────────────────── */
    .season-dot {
      display: inline-block;
      width: 10px; height: 10px;
      border-radius: 50%;
      margin-right: 5px;
      vertical-align: middle;
    }
    .next-crops { color: var(--text-secondary, #666); font-size: 0.85rem; }
    .btn-icon {
      background: none; border: none; cursor: pointer;
      padding: 4px 6px; border-radius: 4px; font-size: 1rem;
      transition: background 0.15s;
    }
    .btn-icon:hover { background: rgba(0,0,0,0.08); }
    .btn-danger { color: #e53935; }
    .badge-danger { background: #fdecea; color: #b71c1c; }

    /* ── Nutrient bars ─────────────────── */
    .nutrient-row {
      background: var(--card-bg, #fff);
      border: 1px solid var(--border, #e0e0e0);
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 12px;
    }
    .nutrient-header {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 8px;
    }
    .nutrient-name {
      font-weight: 700; font-size: 1rem;
      min-width: 30px;
    }
    .nutrient-value {
      font-size: 0.9rem; color: var(--text-secondary, #555);
      margin-left: auto;
    }
    .nutrient-bar-track {
      background: var(--border, #e9e9e9);
      border-radius: 999px; height: 10px;
      overflow: hidden; margin-bottom: 8px;
    }
    .nutrient-bar-fill {
      height: 100%; border-radius: 999px;
      transition: width 0.6s cubic-bezier(.4,0,.2,1);
    }
    .nutrient-advice {
      font-size: 0.82rem; color: var(--text-secondary, #666);
      margin: 0; line-height: 1.5;
    }

    /* ── Yield tracker ─────────────────── */
    .yield-summary-row {
      display: flex; gap: 16px; flex-wrap: wrap;
      margin-bottom: 4px;
    }
    .yield-stat {
      flex: 1; min-width: 100px;
      background: var(--card-bg, #fff);
      border: 1px solid var(--border, #e0e0e0);
      border-radius: 10px; padding: 14px 18px;
      text-align: center;
    }
    .yield-stat-num {
      display: block; font-size: 1.6rem; font-weight: 700;
      color: var(--primary, #2e7d32);
    }
    .yield-stat-lbl {
      font-size: 0.78rem; color: var(--text-secondary, #666);
    }

    /* ── Empty state ───────────────────── */
    .empty-state {
      color: var(--text-secondary, #888);
      text-align: center; padding: 24px 0;
      font-style: italic;
    }

    /* ── Input error ───────────────────── */
    .input-error {
      border-color: #e53935 !important;
      box-shadow: 0 0 0 2px rgba(229,57,53,0.15) !important;
    }
  `;
  document.head.appendChild(style);
})();
