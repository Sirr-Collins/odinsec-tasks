import appLogic from './appLogic.js';
import Todo from './Todo.js';
import { format, parseISO } from 'date-fns';

const dom = (() => {
  const app = document.getElementById('app');
  
  let currentProject = appLogic.getProjects()[0]; 
  let editingTodoId = null; // Tracks which task is being edited

  const renderLayout = () => {
    // SECURE: Static shell only. No user input is passed into innerHTML here.
    app.innerHTML = `
      <div id="sidebar">
        <div class="brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <h2>OdinSec Tasks</h2>
        </div>
        <ul id="project-list"></ul>
        <button id="new-project-btn" class="action-btn outline-btn">+ New Project</button>
      </div>
      <div id="main-content">
        <div class="content-header">
          <h1 id="current-project-title"></h1>
          <button id="new-todo-btn" class="action-btn primary-btn">+ Create Task</button>
        </div>
        <div id="todo-list"></div>
      </div>

      <dialog id="todo-modal">
        <form id="todo-form" method="dialog">
          <h3 id="modal-title">New Task</h3>
          <!-- Defensive Security: Enforce strict boundaries on input length -->
          <input type="text" id="todo-title" placeholder="Task Title" maxlength="60" required />
          <textarea id="todo-desc" placeholder="Description (Optional)" maxlength="300" rows="3"></textarea>
          <div class="form-row">
            <input type="date" id="todo-date" required />
            <select id="todo-priority">
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority</option>
            </select>
          </div>
          <div class="modal-buttons">
            <button type="button" id="close-modal-btn" class="action-btn ghost-btn">Cancel</button>
            <button type="submit" class="action-btn primary-btn">Save Task</button>
          </div>
        </form>
      </dialog>
    `;
    
    document.getElementById('new-project-btn').addEventListener('click', () => {
      const projectName = prompt("Enter the new project name:");
      if (projectName && projectName.trim() !== '') {
        appLogic.addProject(projectName.trim()); 
        renderProjects(); 
      }
    });

    const modal = document.getElementById('todo-modal');
    const form = document.getElementById('todo-form');
    
    document.getElementById('new-todo-btn').addEventListener('click', () => {
      editingTodoId = null;
      document.getElementById('modal-title').textContent = 'New Task';
      modal.showModal();
    });
    
    document.getElementById('close-modal-btn').addEventListener('click', () => {
      modal.close();
      form.reset(); 
      editingTodoId = null;
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault(); 
      
      const title = document.getElementById('todo-title').value.trim();
      const desc = document.getElementById('todo-desc').value.trim();
      const date = document.getElementById('todo-date').value;
      const priority = document.getElementById('todo-priority').value;

      if (editingTodoId) {
        // Edit Mode
        const todoToEdit = currentProject.todos.find(t => t.id === editingTodoId);
        if (todoToEdit) {
          todoToEdit.updateDetails(title, desc, date, priority);
        }
      } else {
        // Create Mode
        const newTodo = new Todo(title, desc, date, priority);
        currentProject.addTodo(newTodo);
      }

      appLogic.saveToStorage();
      renderTodos();
      
      modal.close();
      form.reset();
      editingTodoId = null; 
      document.getElementById('modal-title').textContent = 'New Task';
    });
  };

  const renderProjects = () => {
    const projectList = document.getElementById('project-list');
    projectList.innerHTML = ''; 
    
    const projects = appLogic.getProjects();
    
    projects.forEach(project => {
      const li = document.createElement('li');
      li.classList.add('project-list-item');
      
      const projectName = document.createElement('span');
      projectName.textContent = project.name;
      li.appendChild(projectName);
      
      if (project.id === currentProject.id) {
        li.classList.add('active-project');
      }

      // Create the delete button for the project
      const deleteProjBtn = document.createElement('button');
      deleteProjBtn.innerHTML = '&times;'; // An HTML entity for a multiplication sign (looks like an X)
      deleteProjBtn.classList.add('delete-proj-btn');
      deleteProjBtn.setAttribute('aria-label', 'Delete Project');

      // Attach delete logic
      deleteProjBtn.addEventListener('click', (e) => {
        // e.stopPropagation() stops the click from "bubbling up" and triggering the li click event
        e.stopPropagation(); 
        
        // Add a simple confirmation dialog so users don't accidentally delete all their tasks
        if (confirm(`Are you sure you want to delete "${project.name}" and all its tasks?`)) {
          appLogic.deleteProject(project.id);
          
          // If they deleted the project they are currently viewing, bounce them back to the first available project
          if (currentProject.id === project.id) {
            currentProject = appLogic.getProjects()[0];
          }
          
          renderProjects();
          renderTodos();
        }
      });

      li.appendChild(deleteProjBtn);

      // Make the list item clickable to switch projects
      li.addEventListener('click', () => {
        currentProject = project; 
        renderProjects(); 
        renderTodos(); 
      });

      projectList.appendChild(li);
    });
  };

  const renderTodos = () => {
    const todoList = document.getElementById('todo-list');
    const title = document.getElementById('current-project-title');
    
    todoList.innerHTML = ''; 
    title.textContent = currentProject.name; // SECURE text insertion

    currentProject.todos.forEach(todo => {
      // SECURE: Constructing the complex card strictly using standard DOM methods
      const todoCard = document.createElement('div');
      todoCard.classList.add('todo-card');
      if (todo.isComplete) todoCard.classList.add('completed');

      const cardHeader = document.createElement('div');
      cardHeader.classList.add('todo-main-info');

      const leftSection = document.createElement('div');
      leftSection.classList.add('todo-left-section');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = todo.isComplete;
      checkbox.classList.add('custom-checkbox');

      const todoTitle = document.createElement('strong');
      todoTitle.textContent = todo.title;

      const priorityBadge = document.createElement('span');
      priorityBadge.classList.add('badge', `badge-${todo.priority.toLowerCase()}`);
      priorityBadge.textContent = todo.priority;

      leftSection.appendChild(checkbox);
      leftSection.appendChild(todoTitle);
      leftSection.appendChild(priorityBadge);

      const rightSection = document.createElement('div');
      rightSection.classList.add('todo-right-section');

      const dateSpan = document.createElement('span');
      dateSpan.classList.add('todo-date');
      
      // Ensure date exists before formatting to prevent date-fns crash
      if (todo.dueDate) {
        dateSpan.textContent = format(parseISO(todo.dueDate), 'MMM do, yyyy');
      }

      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.classList.add('action-btn', 'ghost-btn');

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.classList.add('delete-btn');

      rightSection.appendChild(dateSpan);
      rightSection.appendChild(editBtn);
      rightSection.appendChild(deleteBtn);

      cardHeader.appendChild(leftSection);
      cardHeader.appendChild(rightSection);

      const details = document.createElement('details');
      details.classList.add('todo-details');
      
      const summary = document.createElement('summary');
      summary.textContent = 'View Details';
      
      const description = document.createElement('p');
      description.textContent = todo.description || "No description provided.";

      details.appendChild(summary);
      details.appendChild(description);

      todoCard.appendChild(cardHeader);
      todoCard.appendChild(details);

      // Event Listeners
      checkbox.addEventListener('change', () => {
        todo.toggleComplete();
        appLogic.saveToStorage(); 
        renderTodos(); 
      });

      editBtn.addEventListener('click', () => {
        editingTodoId = todo.id;
        document.getElementById('modal-title').textContent = 'Edit Task';
        
        document.getElementById('todo-title').value = todo.title;
        document.getElementById('todo-desc').value = todo.description;
        document.getElementById('todo-date').value = todo.dueDate;
        document.getElementById('todo-priority').value = todo.priority;
        
        document.getElementById('todo-modal').showModal();
      });

      deleteBtn.addEventListener('click', () => {
        currentProject.deleteTodo(todo.id);
        appLogic.saveToStorage(); 
        renderTodos(); 
      });

      todoList.appendChild(todoCard);
    });
  };

  const initialRender = () => {
    renderLayout();
    renderProjects();
    renderTodos(); 
  };

  return { initialRender };
})();

export default dom;

