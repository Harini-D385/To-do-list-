// app.js
const STORAGE_KEY = 'todo.tasks.v1';

let tasks = [];
let filter = 'all'; // all | active | completed

// DOM
const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const list = document.getElementById('task-list');
const message = document.getElementById('message');
const countEl = document.getElementById('task-count');
const btnClearCompleted = document.getElementById('clear-completed');
const filterAll = document.getElementById('filter-all');
const filterActive = document.getElementById('filter-active');
const filterCompleted = document.getElementById('filter-completed');

document.addEventListener('DOMContentLoaded', init);

function init(){
  loadTasks();
  render();
  form.addEventListener('submit', onAdd);
  list.addEventListener('click', onListClick);
  list.addEventListener('change', onListChange);
  btnClearCompleted.addEventListener('click', clearCompleted);
  filterAll.addEventListener('click', ()=> setFilter('all'));
  filterActive.addEventListener('click', ()=> setFilter('active'));
  filterCompleted.addEventListener('click', ()=> setFilter('completed'));
}

function showMessage(text, isError = true){
  message.textContent = text || '';
  message.style.color = isError ? '' : 'var(--success)';
  if(text) setTimeout(()=> { message.textContent = '' }, 3000);
}

function onAdd(e){
  e.preventDefault();
  const text = input.value.trim();
  if(!text){
    showMessage('Please enter a non-empty task.');
    return;
  }
  addTask(text);
  input.value = '';
  render();
}

function addTask(text){
  const task = {
    id: Date.now().toString() + Math.floor(Math.random()*1000),
    text,
    completed: false,
    createdAt: Date.now()
  };
  tasks.push(task);
  saveTasks();
}

function onListChange(e){
  if(e.target.matches('.toggle')) {
    const li = e.target.closest('li.task');
    const id = li.dataset.id;
    toggleCompleted(id, e.target.checked);
  }
}

function onListClick(e){
  const li = e.target.closest('li.task');
  if(!li) return;
  const id = li.dataset.id;

  if(e.target.matches('.delete-btn')){
    deleteTask(id);
  } else if(e.target.matches('.edit-btn')){
    enterEditMode(li, id);
  } else if(e.target.matches('.save-btn')){
    const inputEdit = li.querySelector('.edit-input');
    saveEdit(id, inputEdit.value);
  } else if(e.target.matches('.cancel-btn')){
    render(); // cancel edit
  }
}

// toggle completed
function toggleCompleted(id, checked){
  const t = tasks.find(x => x.id === id);
  if(!t) return;
  t.completed = !!checked;
  saveTasks();
  render();
}

// delete
function deleteTask(id){
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  render();
}

// edit mode: replace text with input + save/cancel
function enterEditMode(li, id){
  const t = tasks.find(x => x.id === id);
  if(!t) return;
  li.innerHTML = `
    <div class="left" style="flex:1">
      <input class="edit-input" type="text" value="${escapeHtml(t.text)}" />
    </div>
    <div class="actions">
      <button class="action-btn save-btn">Save</button>
      <button class="action-btn cancel-btn">Cancel</button>
    </div>
  `;
  const editInput = li.querySelector('.edit-input');
  editInput.focus();
  // handle Enter key in edit input
  editInput.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){ saveEdit(id, editInput.value); }
    if(e.key === 'Escape'){ render(); }
  });
}

function saveEdit(id, newText){
  const trimmed = (newText || '').trim();
  if(!trimmed){
    showMessage('Task cannot be empty.');
    return;
  }
  const t = tasks.find(x => x.id === id);
  if(!t) return;
  t.text = trimmed;
  saveTasks();
  render();
}

function clearCompleted(){
  const before = tasks.length;
  tasks = tasks.filter(t => !t.completed);
  if(tasks.length === before){
    showMessage('No completed tasks to clear.', true);
    return;
  }
  saveTasks();
  render();
}

function setFilter(f){
  filter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if(f === 'all') filterAll.classList.add('active');
  if(f === 'active') filterActive.classList.add('active');
  if(f === 'completed') filterCompleted.classList.add('active');
  render();
}

function render(){
  // create html for tasks based on filter
  const filtered = tasks.filter(t => {
    if(filter === 'active') return !t.completed;
    if(filter === 'completed') return t.completed;
    return true;
  });

  if(filtered.length === 0){
    list.innerHTML = `<li class="task empty">No tasks yet.</li>`;
  } else {
    list.innerHTML = filtered.map(t => taskToHTML(t)).join('');
  }

  countEl.textContent = `${tasks.length} task${tasks.length === 1 ? '' : 's'}`;
}

function taskToHTML(t){
  return `
  <li class="task ${t.completed ? 'completed': ''}" data-id="${t.id}">
    <div class="left">
      <input class="toggle" type="checkbox" ${t.completed ? 'checked' : ''} aria-label="Mark task completed" />
      <span class="text">${escapeHtml(t.text)}</span>
    </div>
    <div class="actions">
      <button class="action-btn edit-btn" aria-label="Edit task">Edit</button>
      <button class="action-btn delete-btn" aria-label="Delete task">Delete</button>
    </div>
  </li>`;
}

function saveTasks(){
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
    showMessage('Unable to save tasks (storage full or blocked).');
  }
}

function loadTasks(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) { tasks = []; return; }
    tasks = JSON.parse(raw) || [];
  } catch (e) {
    console.error('Failed reading tasks', e);
    tasks = [];
  }
}

// simple HTML escape
function escapeHtml(str){
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}
