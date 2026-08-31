const form = document.getElementById('attendance-form');
const clientNameInput = document.getElementById('client-name');
const clientDescInput = document.getElementById('client-desc');
const cardStatusSelect = document.getElementById('card-status');
const board = document.getElementById('board');

const toggleLayoutBtn = document.querySelectorAll('.btn-layout')[2];
const toggleThemeBtn = document.getElementById('toggle-theme-btn');
const openSettingsBtn = document.getElementById('open-settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const addColumnBtn = document.getElementById('add-column-btn');
const columnsConfigList = document.getElementById('columns-config-list');

let tasks = JSON.parse(localStorage.getItem('attendance_tasks')) || [];

// Estrutura padrão das colunas (permite adicionar, alterar nomes, emojis e cores)
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
    colDiv.setAttribute('ondragleave', 'removeDropStyle(event)');
    colDiv.setAttribute('ondrop', `dropTask(event, '${col.id}')`);

    colDiv.innerHTML = `
      <h3 style="color: ${col.color}; border-color: ${col.color}33;">${escapeHTML(col.name)}</h3>
      <div class="cards-container" id="container-${col.id}"></div>
    `;
    board.appendChild(colDiv);
  });
}

function renderStatusSelects() {
  cardStatusSelect.innerHTML = '';
  columns.forEach(col => {
    const option = document.createElement('option');
    option.value = col.id;
    option.textContent = col.name;
    cardStatusSelect.appendChild(option);
  });
}

// Modal de Configurações Dinâmicas
openSettingsBtn.addEventListener('click', () => {
  renderColumnsConfigInputs();
  settingsModal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
  settingsModal.style.display = 'none';
});

function renderColumnsConfigInputs() {
  columnsConfigList.innerHTML = '';
  columns.forEach((col, index) => {
    const row = document.createElement('div');
    row.classList.add('column-config-row');
    row.innerHTML = `
      <input type="text" value="${escapeHTML(col.name)}" data-index="${index}" class="col-name-input" placeholder="Ex: 🚀 Nome e Emoji">
      <input type="color" value="${col.color}" data-index="${index}" class="col-color-input">
      <button class="btn-remove-col" onclick="removeColumnConfig(${index})">🗑️</button>
    `;
    columnsConfigList.appendChild(row);
  });
}

window.removeColumnConfig = function(index) {
  if (columns.length <= 1) {
    alert('Você precisa ter pelo menos uma coluna.');
    return;
  }
  columns.splice(index, 1);
  renderColumnsConfigInputs();
};

addColumnBtn.addEventListener('click', () => {
  const newId = 'col_' + Date.now();
  columns.push({ id: newId, name: '📋 Nova Coluna', color: '#6366f1' });
  renderColumnsConfigInputs();
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

// Gerenciamento de Tema
const savedTheme = localStorage.getItem('dashboard_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeButtonText(savedTheme);

if (toggleThemeBtn) {
  toggleThemeBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('dashboard_theme', newTheme);
    updateThemeButtonText(newTheme);
  });
}

function updateThemeButtonText(theme) {
  if (!toggleThemeBtn) return;
  if (theme === 'light') {
    toggleThemeBtn.innerHTML = '<span>🌙</span> Tema Escuro';
  } else {
    toggleThemeBtn.innerHTML = '<span>☀️</span> Tema Claro';
  }
}

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
    card.dataset.index = index;
    card.style.borderLeft = `4px solid ${colInfo.color}`;

    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', index);
      setTimeout(() => card.classList.add('dragging'), 0);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.column').forEach(col => col.classList.remove('drag-over'));
    });

    let optionsHTML = columns.map(c => `
      <option value="${c.id}" ${task.status === c.id ? 'selected' : ''}>${escapeHTML(c.name)}</option>
    `).join('');

    card.innerHTML = `
      <h4>${escapeHTML(task.name)}</h4>
      <p>${escapeHTML(task.desc || 'Sem descrição')}</p>
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
  const column = e.target.closest('.column');
  if (column) column.classList.add('drag-over');
};

window.removeDropStyle = function(e) {
  const column = e.target.closest('.column');
  if (column) column.classList.remove('drag-over');
};

window.dropTask = function(e, newStatus) {
  e.preventDefault();
  const column = e.target.closest('.column');
  if (column) column.classList.remove('drag-over');

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
  const taskName = tasks[index] ? tasks[index].name : 'este item';
  const confirmed = confirm(`Tem certeza que deseja excluir "${taskName}"?`);
  
  if (confirmed) {
    tasks.splice(index, 1);
    saveAndRender();
  }
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

let isKanban = false;

if (toggleLayoutBtn) {
  toggleLayoutBtn.addEventListener('click', () => {
    isKanban = !isKanban;

    if (isKanban) {
      board.classList.remove('grid-mode');
      board.classList.add('kanban-mode');
      toggleLayoutBtn.innerHTML = '<span>📱</span> Modo Grade (Retrato)';
    } else {
      board.classList.remove('kanban-mode');
      board.classList.add('grid-mode');
      toggleLayoutBtn.innerHTML = '<span>↔️</span> Modo Paisagem (Kanban)';
    }
  });
}

initDashboard();
