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
const saveLabelsBtn = document.getElementById('save-labels-btn');

const inputLabelPendencia = document.getElementById('label-pendencia');
const inputLabelEspera = document.getElementById('label-espera');
const inputLabelAtendimento = document.getElementById('label-atendimento');
const inputLabelConcluido = document.getElementById('label-concluido');

const titlePendencia = document.getElementById('title-pendencia');
const titleEspera = document.getElementById('title-espera');
const titleAtendimento = document.getElementById('title-atendimento');
const titleConcluido = document.getElementById('title-concluido');

const optPendencia = document.getElementById('opt-pendencia');
const optEspera = document.getElementById('opt-espera');
const optAtendimento = document.getElementById('opt-atendimento');
const optConcluido = document.getElementById('opt-concluido');

const containers = {
  pendencia: document.getElementById('container-pendencia'),
  espera: document.getElementById('container-espera'),
  atendimento: document.getElementById('container-atendimento'),
  concluido: document.getElementById('container-concluido')
};

let tasks = JSON.parse(localStorage.getItem('attendance_tasks')) || [];

// Padrões de Etiquetas
let labels = JSON.parse(localStorage.getItem('dashboard_labels')) || {
  pendencia: '📌 Pendências',
  espera: '⏳ Em Espera',
  atendimento: '🔄 Em Andamento',
  concluido: '✅ Concluído'
};

function applyLabels() {
  titlePendencia.textContent = labels.pendencia;
  titleEspera.textContent = labels.espera;
  titleAtendimento.textContent = labels.atendimento;
  titleConcluido.textContent = labels.concluido;

  optPendencia.textContent = labels.pendencia;
  optEspera.textContent = labels.espera;
  optAtendimento.textContent = labels.atendimento;
  optConcluido.textContent = labels.concluido;

  inputLabelPendencia.value = labels.pendencia;
  inputLabelEspera.value = labels.espera;
  inputLabelAtendimento.value = labels.atendimento;
  inputLabelConcluido.value = labels.concluido;
}

applyLabels();

// Modal de Configuração
openSettingsBtn.addEventListener('click', () => {
  settingsModal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
  settingsModal.style.display = 'none';
});

saveLabelsBtn.addEventListener('click', () => {
  labels.pendencia = inputLabelPendencia.value.trim() || '📌 Pendências';
  labels.espera = inputLabelEspera.value.trim() || '⏳ Em Espera';
  labels.atendimento = inputLabelAtendimento.value.trim() || '🔄 Em Andamento';
  labels.concluido = inputLabelConcluido.value.trim() || '✅ Concluído';

  localStorage.setItem('dashboard_labels', JSON.stringify(labels));
  applyLabels();
  renderTasks();
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
  Object.values(containers).forEach(container => {
    if (container) container.innerHTML = '';
  });

  tasks.forEach((task, index) => {
    const targetContainer = containers[task.status];
    if (!targetContainer) return;

    const card = document.createElement('div');
    card.classList.add('item-card');
    card.setAttribute('draggable', 'true');
    card.dataset.index = index;

    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', index);
      setTimeout(() => card.classList.add('dragging'), 0);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.column').forEach(col => col.classList.remove('drag-over'));
    });

    card.innerHTML = `
      <h4>${escapeHTML(task.name)}</h4>
      <p>${escapeHTML(task.desc || 'Sem descrição')}</p>
      <div class="item-actions">
        <select onchange="changeTaskStatus(${index}, this.value)">
          <option value="pendencia" ${task.status === 'pendencia' ? 'selected' : ''}>${labels.pendencia}</option>
          <option value="espera" ${task.status === 'espera' ? 'selected' : ''}>${labels.espera}</option>
          <option value="atendimento" ${task.status === 'atendimento' ? 'selected' : ''}>${labels.atendimento}</option>
          <option value="concluido" ${task.status === 'concluido' ? 'selected' : ''}>${labels.concluido}</option>
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

renderTasks();
