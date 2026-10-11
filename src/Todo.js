

export default class Todo {
  constructor(title, description, dueDate, priority, notes = "", checklist = []) {
    this.id = Date.now().toString(); 
    this.title = title;
    this.description = description;
    this.dueDate = dueDate; 
    this.priority = priority; 
    this.notes = notes;
    this.checklist = checklist;
    this.isComplete = false;
  }

  toggleComplete() {
    this.isComplete = !this.isComplete;
  }

  // New method to handle task edits safely
  updateDetails(newTitle, newDesc, newDate, newPriority) {
    this.title = newTitle;
    this.description = newDesc;
    this.dueDate = newDate;
    this.priority = newPriority;
  }
}