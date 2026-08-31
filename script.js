const form = document.getElementById('attendance-form');
const clientNameInput = document.getElementById('client-name');
const clientDescInput = document.getElementById('client-desc');
const cardStatusSelect = document.getElementById('card-status');

const board = document.getElementById('board');
const toggleBtn = document.getElementById('toggle-layout-btn');

const containers = {
  pendencia: document.getElementById('container-pendencia'),
  espera: document.getElementById('container-espera'),
  atendimento: document.getElementById('container-atendimento'),
  concluido: document.getElementById('container-concluido')
};

let tasks = JSON.parse(localStorage.getItem('attendance_tasks')) || [];

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
          <option value="pendencia" ${task.status === 'pendencia' ? 'selected' : ''}>📌 Pendência</option>
          <option value="espera" ${task.status === 'espera' ? 'selected' : ''}>⏳ Espera</option>
          <option value="atendimento" ${task.status === 'atendimento' ? 'selected' : ''}>🔄 Em Andamento</option>
          <option value="concluido" ${task.status === 'concluido' ? 'selected' : ''}>✅ Concluído</option>
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

if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    isKanban = !isKanban;

    if (isKanban) {
      board.classList.remove('grid-mode');
      board.classList.add('kanban-mode');
      toggleBtn.innerHTML = '<span>📱</span> Modo Grade (Retrato)';
    } else {
      board.classList.remove('kanban-mode');
      board.classList.add('grid-mode');
      toggleBtn.innerHTML = '<span>↔️</span> Modo Paisagem (Kanban)';
    }
  });
}

renderTasks();