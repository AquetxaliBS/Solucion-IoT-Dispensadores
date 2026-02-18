// js/control.js
// Simulación local de 3 dispensadores.
// No se leen estados desde la API para mostrar control.
// Cada activación registra un evento en MockAPI.

const DISPENSERS = [
  { id: "1", deviceName: "Dispensador 1", description: "Zacate", statusCode: 1, weight: randWeight(), dispenseWeight: 0, dateTime: null },
  { id: "2", deviceName: "Dispensador 2", description: "Alfalfa", statusCode: 1, weight: randWeight(), dispenseWeight: 0, dateTime: null },
  { id: "3", deviceName: "Dispensador 3", description: "Grano", statusCode: 1, weight: randWeight(), dispenseWeight: 0, dateTime: null }
];

/* =========================
   Helpers
========================= */
function randWeight() {
  return Math.floor(Math.random() * 40001); // 0..40000
}

function newRandomDifferent(prev) {
  let v = prev;
  let tries = 0;
  while (v === prev && tries < 10) {
    v = randWeight();
    tries++;
  }
  return v;
}

function statusText(code) {
  if (code === 1) return "Apagado";
  if (code === 2) return "Dispensando";
  if (code === 3) return "Error";
  return "Desconocido";
}

function statusClass(code) {
  if (code === 1) return "status-off";
  if (code === 2) return "status-on";
  if (code === 3) return "status-err";
  return "status-off";
}

function levelLabel(weight) {
  if (weight >= 40000) return "Lleno";
  if (weight >= 20000) return "Medio";
  if (weight < 5000) return "Vacío";
  return "Bajo";
}

function barClassByWeight(weight) {
  if (weight < 5000) return "bar-low";
  if (weight < 20000) return "bar-mid";
  return "bar-full";
}

function formatGrams(n) {
  return `${n} gr`;
}

function getLocalDateTime() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

/* =========================
   Render UI
========================= */
function renderControl() {
  const container = document.getElementById("controlDevices");
  container.innerHTML = "";

  DISPENSERS.forEach(d => {
    const col = document.createElement("div");
    col.className = "col-md-4 mb-4";

    const card = document.createElement("div");
    card.className = "card card-device h-100";

    const body = document.createElement("div");
    body.className = "card-body d-flex flex-column";

    // Title
    const title = document.createElement("h5");
    title.textContent = d.deviceName;
    body.appendChild(title);

    // Description
    const desc = document.createElement("p");
    desc.className = "small-note mb-2";
    desc.textContent = d.description;
    body.appendChild(desc);

    // Status + Level text
    const statusWrap = document.createElement("div");
    statusWrap.className = "d-flex align-items-center mb-2";

    const badge = document.createElement("span");
    badge.id = `status-badge-${d.id}`;
    badge.className = `status-badge ${statusClass(d.statusCode)}`;
    badge.textContent = statusText(d.statusCode);
    statusWrap.appendChild(badge);

    const levelText = document.createElement("small");
    levelText.id = `level-text-${d.id}`;
    levelText.className = "ms-auto small-note";
    levelText.textContent = `${levelLabel(d.weight)} • ${formatGrams(d.weight)}`;
    statusWrap.appendChild(levelText);

    body.appendChild(statusWrap);

    // Level bar
    const progressWrap = document.createElement("div");
    progressWrap.className = "progress-level mb-3";
    const pct = Math.min((d.weight / 40000) * 100, 100);
    progressWrap.innerHTML = `
      <div class="bar ${barClassByWeight(d.weight)}" 
           id="level-bar-${d.id}" 
           style="width:${pct}%"></div>
    `;
    body.appendChild(progressWrap);

    // Input
    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.placeholder = "Peso a dispensar (gr)";
    input.className = "form-control mb-2";
    input.id = `input-dispense-${d.id}`;
    body.appendChild(input);

    // Button
    const btn = document.createElement("button");
    btn.className = "btn btn-primary mt-auto";
    btn.id = `btn-activate-${d.id}`;
    btn.textContent = "Activar";
    btn.onclick = () => onActivateClicked(d.id);
    body.appendChild(btn);

    // Note
    const note = document.createElement("div");
    note.className = "mt-2 small-note text-danger";
    note.id = `note-${d.id}`;
    body.appendChild(note);

    card.appendChild(body);
    col.appendChild(card);
    container.appendChild(col);
  });
}

/* =========================
   Actions
========================= */
async function onActivateClicked(id) {
  const d = DISPENSERS.find(x => x.id === id);
  if (!d) return;

  const input = document.getElementById(`input-dispense-${id}`);
  const btn = document.getElementById(`btn-activate-${id}`);
  const note = document.getElementById(`note-${id}`);
  note.textContent = "";

  const toDispense = parseInt(input.value, 10);
  if (!Number.isFinite(toDispense) || toDispense <= 0) {
    note.textContent = "Introduce una cantidad válida";
    return;
  }

  const currentWeight = d.weight;
  btn.disabled = true;

  // ERROR
  if (currentWeight < toDispense) {
    d.statusCode = 3;
    updateCardUI(d);

    await postEvent({
      deviceName: d.deviceName,
      description: d.description,
      statusCode: 3,
      weight: currentWeight,
      dispenseWeight: toDispense,
      dateTime: getLocalDateTime()
    }).catch(err => note.textContent = "Error al registrar evento");

    setTimeout(() => {
      d.weight = newRandomDifferent(currentWeight);
      d.statusCode = 1;
      updateCardUI(d);
      btn.disabled = false;
      input.value = "";
    }, 4000);
    return;
  }

  // OK
  d.statusCode = 2;
  updateCardUI(d);

  await postEvent({
    deviceName: d.deviceName,
    description: d.description,
    statusCode: 2,
    weight: currentWeight,
    dispenseWeight: toDispense,
    dateTime: getLocalDateTime()
  }).catch(err => note.textContent = "Error al registrar evento");

  setTimeout(() => {
    d.weight = newRandomDifferent(currentWeight);
    d.statusCode = 1;
    updateCardUI(d);
    btn.disabled = false;
    input.value = "";
  }, 4000);
}

/* =========================
   UI Update
========================= */
function updateCardUI(d) {
  const badge = document.getElementById(`status-badge-${d.id}`);
  const levelText = document.getElementById(`level-text-${d.id}`);
  const levelBar = document.getElementById(`level-bar-${d.id}`);

  if (badge) {
    badge.className = `status-badge ${statusClass(d.statusCode)}`;
    badge.textContent = statusText(d.statusCode);
  }

  if (levelText) {
    levelText.textContent = `${levelLabel(d.weight)} • ${formatGrams(d.weight)}`;
  }

  if (levelBar) {
    const pct = Math.min((d.weight / 40000) * 100, 100);
    levelBar.className = `bar ${barClassByWeight(d.weight)}`;
    levelBar.style.width = pct + "%";
  }
}

/* =========================
   Export
========================= */
window.renderControl = renderControl;
