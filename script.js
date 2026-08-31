const form = document.getElementById('attendance-form');
const clientNameInput = document.getElementById('client-name');
const clientDescInput = document.getElementById('client-desc');
const cardStatusSelect = document.getElementById('card-status');
const board = document.getElementById('board');

const openSettingsBtn = document.getElementById('open-settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const addLabelBtn = document.getElementById('add-label-btn');
const labelsConfigList = document.getElementById('labels-config-list');

let tasks = JSON.parse(localStorage.getItem('attendance_tasks')) || [];

let columns = JSON.parse(localStorage.getItem('dashboard_columns')) || [
  { id: 'pendencia', name: '📌 Pendências', color: '#dc2626' },
  { id: 'espera', name: '⏳ Em Espera', color: '#d97706' },
  { id: 'atendimento', name: '🔄 Em Andamento', color: '#0284c7' },
  { id: 'concluido', name: '✅ Concluído', color: '#059669' }
];

function initDashboard() {
  renderBoardStructure();
  renderStatusSelects();
  renderTasks();
}

function renderBoardStructure() {
  board.innerHTML = '';
  
  columns.forEach(col => {
    const colDiv = document.createElement('div');
    colDiv.classList.add('column');
    colDiv.id = `col-${col.id}`;
    colDiv.setAttribute('ondragover', 'allowDrop(event)');
    colDiv.setAttribute('ondragdrop', 'removeDropStyle(event)');
    colDiv.setAttribute('ondrop', `dropTask(event, '${col.id}')`);

    colDiv.innerHTML = `
      <h3 style="color: ${col.color};" title="Clique para alterar o nome" onclick="quickEditColumnName('${col.id}')">${escapeHTML(col.name)}</h3>
      <div class="cards-container" id="container-${col.id}"></div>
    `;
    board.appendChild(colDiv);
  });

  const addColDiv = document.createElement('div');
  addColDiv.classList.add('column-add');
  addColDiv.innerHTML = `
    <button class="add-column-card-btn" onclick="promptAddColumn()" title="Adicionar nova coluna">+</button>
  `;
  board.appendChild(addColDiv);
}

window.promptAddColumn = function() {
  const newName = prompt('Digite o nome da nova coluna (pode usar emojis):');
  if (newName && newName.trim() !== '') {
    const newId = 'col_' + Date.now();
    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    columns.push({ id: newId, name: newName.trim(), color: randomColor });
    localStorage.setItem('dashboard_columns', JSON.stringify(columns));
    initDashboard();
  }
};

window.quickEditColumnName = function(colId) {
  const col = columns.find(c => c.id === colId);
  if (!col) return;

  const newName = prompt('Altere o nome da coluna:', col.name);
  if (newName !== null && newName.trim() !== '') {
    col.name = newName.trim();
    localStorage.setItem('dashboard_columns', JSON.stringify(columns));
    initDashboard();
  }
};

function renderStatusSelects() {
  cardStatusSelect.innerHTML = '';
  columns.forEach(col => {
    const option = document.createElement('option');
    option.value = col.id;
    option.textContent = col.name;
    cardStatusSelect.appendChild(option);
  });
}

openSettingsBtn.addEventListener('click', () => {
  renderLabelsConfigInputs();
  settingsModal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
  settingsModal.style.display = 'none';
});

function renderLabelsConfigInputs() {
  labelsConfigList.innerHTML = '';
  columns.forEach((col, index) => {
    const row = document.createElement('div');
    row.classList.add('column-config-row');
    row.innerHTML = `
      <input type="text" value="${escapeHTML(col.name)}" data-index="${index}" class="col-name-input">
      <input type="color" value="${col.color}" data-index="${index}" class="col-color-input">
      <button class="btn-remove-col" onclick="removeLabelConfig(${index})">🗑️</button>
    `;
    labelsConfigList.appendChild(row);
  });
}

window.removeLabelConfig = function(index) {
  if (columns.length <= 1) {
    alert('Mantenha pelo menos uma coluna.');
    return;
  }
  columns.splice(index, 1);
  renderLabelsConfigInputs();
};

addLabelBtn.addEventListener('click', () => {
  const newId = 'col_' + Date.now();
  columns.push({ id: newId, name: '📌 Nova Coluna', color: '#6366f1' });
  renderLabelsConfigInputs();
});

saveSettingsBtn.addEventListener('click', () => {
  const nameInputs = document.querySelectorAll('.col-name-input');
  const colorInputs = document.querySelectorAll('.col-color-input');

  columns = columns.map((col, index) => {
    return {
      id: col.id,
      name: nameInputs[index].value.trim() || 'Coluna',
      color: colorInputs[index].value
    };
  });

  localStorage.setItem('dashboard_columns', JSON.stringify(columns));
  initDashboard();
  settingsModal.style.display = 'none';
});

function renderTasks() {
  columns.forEach(col => {
    const container = document.getElementById(`container-${col.id}`);
    if (container) container.innerHTML = '';
  });

  tasks.forEach((task, index) => {
    const targetContainer = document.getElementById(`container-${task.status}`);
    if (!targetContainer) return;

    const colInfo = columns.find(c => c.id === task.status) || { color: '#2563eb' };

    const card = document.createElement('div');
    card.classList.add('item-card');
    card.setAttribute('draggable', 'true');
    card.style.borderLeft = `4px solid ${colInfo.color}`;

    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', index);
    });

    let optionsHTML = columns.map(c => `
      <option value="${c.id}" ${task.status === c.id ? 'selected' : ''}>${escapeHTML(c.name)}</option>
    `).join('');

    card.innerHTML = `
      <h4>${escapeHTML(task.name)}</h4>
      <p>${escapeHTML(task.desc || '')}</p>
      <div class="item-actions">
        <select onchange="changeTaskStatus(${index}, this.value)">
          ${optionsHTML}
        </select>
        <button class="btn-delete" onclick="deleteTask(${index})">Excluir</button>
      </div>
    `;

    targetContainer.appendChild(card);
  });
}

window.allowDrop = function(e) {
  e.preventDefault();
};

window.dropTask = function(e, newStatus) {
  e.preventDefault();
  const taskIndex = e.dataTransfer.getData('text/plain');
  if (taskIndex !== '' && tasks[taskIndex]) {
    tasks[taskIndex].status = newStatus;
    saveAndRender();
  }
};

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const newTask = {
    name: clientNameInput.value.trim(),
    desc: clientDescInput.value.trim(),
    status: cardStatusSelect.value
  };

  if (!newTask.name) return;

  tasks.push(newTask);
  saveAndRender();

  clientNameInput.value = '';
  clientDescInput.value = '';
  clientNameInput.focus();
});

window.changeTaskStatus = function(index, newStatus) {
  tasks[index].status = newStatus;
  saveAndRender();
};

window.deleteTask = function(index) {
  tasks.splice(index, 1);
  saveAndRender();
};

function saveAndRender() {
  localStorage.setItem('attendance_tasks', JSON.stringify(tasks));
  renderTasks();
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

initDashboard();
