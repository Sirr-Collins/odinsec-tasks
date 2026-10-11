import Project from './Project.js';
import Todo from './Todo.js';

const appLogic = (() => {
  let projects = [];

  const saveToStorage = () => {
    // Convert the entire projects array into a JSON text string and save it
    localStorage.setItem('todoListProjects', JSON.stringify(projects));
  };

  const loadFromStorage = () => {
    const storedData = localStorage.getItem('todoListProjects');
    
    if (storedData) {
      // 1. Parse the raw JSON text back into generic JavaScript objects
      const parsedData = JSON.parse(storedData);
      
      // 2. Map over the generic data and rebuild true Project and Todo class instances
      projects = parsedData.map(projectData => {
        const project = new Project(projectData.name);
        project.id = projectData.id; // Keep the original ID
        
        projectData.todos.forEach(todoData => {
          const todo = new Todo(
            todoData.title, 
            todoData.description, 
            todoData.dueDate, 
            todoData.priority, 
            todoData.notes, 
            todoData.checklist
          );
          todo.id = todoData.id;
          todo.isComplete = todoData.isComplete;
          project.addTodo(todo); // Now this method works again!
        });
        return project;
      });
    } else {
      // If no data exists (first time opening the app), create the default Inbox
      const defaultProject = new Project("Inbox");
      projects.push(defaultProject);
    }
  };

  // Load data immediately when this file is first read
  loadFromStorage();

  const getProjects = () => projects;

  const addProject = (name) => {
    const newProject = new Project(name);
    projects.push(newProject);
    saveToStorage(); // Save every time a new project is created
    return newProject;
  };

  const deleteProject = (projectId) => {
    projects = projects.filter(project => project.id !== projectId);
    
    // Defensive Security: Prevent the app from ever having zero projects (which would crash the UI)
    if (projects.length === 0) {
      const defaultProject = new Project("Inbox");
      projects.push(defaultProject);
    }
    
    saveToStorage();
  };

  const getProjectById = (projectId) => {
    return projects.find(project => project.id === projectId);
  };

  return {
    getProjects,
    addProject,
    deleteProject,
    getProjectById,
    saveToStorage // Expose save so the DOM can trigger it when modifying Todos
  };
})();

export default appLogic;

