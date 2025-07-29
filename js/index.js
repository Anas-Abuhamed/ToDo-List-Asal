const addBtn = document.getElementById("add-btn");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
getTasksFromStorage().forEach((task) => {
  taskList.appendChild(createItem(task));
});
taskInput.focus();
taskList.addEventListener("click", function (e) {
  const li = e.target.closest("li");
  if (!li) return;

  const id = +li.dataset.id;

  if (e.target.classList.contains("complete")) {
    li.classList.toggle("done");
    doneLocalStorage(id, li);
  }

  if (e.target.classList.contains("edit")) {
    handleEdit(li, id);
  }

  if (e.target.classList.contains("delete")) {
    li.remove();
    const tasks = getTasksFromStorage().filter((t) => t.id !== id);
    saveTasksToStorage(tasks);
  }
});

addBtn.addEventListener("click", addItem);
taskInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") addItem();
  else if (e.key === "Escape") taskInput.value = "";
});

function addItem() {
  const taskText = taskInput.value.trim();
  if (taskText === "") {
    const alert = document.querySelector(".alert");
    alert.style.display = "block";
    setTimeout(() => {
      alert.style.display = "none";
      taskInput.focus();
    }, 2000);
    return;
  }

  const task = { id: Date.now(), text: taskText, done: false };
  const tasks = getTasksFromStorage();
  tasks.push(task);
  saveTasksToStorage(tasks);
  taskList.appendChild(createItem(task));
  taskInput.value = "";
}

function handleEdit(li, id) {
  const span = li.querySelector(".task-text");

  if (li.querySelector(".edit-input")) return;

  const input = document.createElement("input");
  input.type = "text";
  input.value = span.textContent;
  input.className = "edit-input";
  li.replaceChild(input, span);
  input.focus();

  let editSaved = false;

  input.addEventListener("blur", saveEdit);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") saveEdit();
    else if (e.key === "Escape") cancelEdit();
  });

  function saveEdit() {
    if (editSaved) return;
    editSaved = true;

    const newText = input.value.trim();
    if (newText !== "") {
      span.textContent = newText;
    }
    li.replaceChild(span, input);

    const tasks = getTasksFromStorage();
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.text = newText || task.text;
      saveTasksToStorage(tasks);
    }
  }

  function cancelEdit() {
    if (editSaved) return;
    editSaved = true;
    li.replaceChild(span, input);
  }
}

function createItem(task) {
  const li = document.createElement("li");
  li.dataset.id = task.id;
  li.setAttribute("draggable", "true")
  if (task.done) li.classList.add("done");

  const span = document.createElement("span");
  span.textContent = task.text;
  span.className = "task-text";

  const actions = document.createElement("div");
  actions.className = "actions";
  actions.append(
    createIcon("fas fa-check complete"),
    createIcon("fas fa-edit edit"),
    createIcon("fas fa-trash delete")
  );

  li.append(span, actions);
  return li;
}

function createIcon(className) {
  const icon = document.createElement("i");
  icon.className = className;
  const parts = className.split(" ");
  icon.title = parts[parts.length - 1];
  return icon;
}

function getTasksFromStorage() {
  return JSON.parse(localStorage.getItem("tasks")) || [];
}

function saveTasksToStorage(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function doneLocalStorage(id, li) {
  const tasks = getTasksFromStorage();
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.done = li.classList.contains("done");
    saveTasksToStorage(tasks);
  }
}

// Drag & Drop

let draggedItem = null;
let dragStartX = 0;

taskList.addEventListener("dragstart", (e) => {
  if (e.target.tagName === "LI") {
    draggedItem = e.target;
    dragStartX = e.clientX;
    draggedItem.classList.add("dragging");
  }
});

taskList.addEventListener("dragover", (e) => {
  e.preventDefault(); 
  const afterElement = getDragAfterElement(taskList, e.clientY);
  if (afterElement == null) {
    taskList.appendChild(draggedItem);
  } else {
    taskList.insertBefore(draggedItem, afterElement);
  }
});

taskList.addEventListener("drop", (e) => {
  e.preventDefault();
  updateOrderInStorage();
});

taskList.addEventListener("dragend", (e) => {
  if (e.target.tagName === "LI") {
    draggedItem.classList.remove("dragging");

    const dragEndX = e.clientX;
    const deltaX = dragEndX - dragStartX;

    const id = +draggedItem.dataset.id;

    if (deltaX > 100) {
      handleEdit(draggedItem, id);
    } else if (deltaX < -100) {
      draggedItem.remove();
      const tasks = getTasksFromStorage().filter((t) => t.id !== id);
      saveTasksToStorage(tasks);
    }

    updateOrderInStorage();
    draggedItem = null;
    dragStartX = 0;
  }
});

function getDragAfterElement(container, y) {
  const draggableElements = Array.from(container.querySelectorAll("li:not(.dragging)"));
  for (const child of draggableElements) {
    const box = child.getBoundingClientRect();
    const center = box.top + box.height / 2;
    if (y < center) return child;
  }
  return null; 
}

function updateOrderInStorage() {
  const newTasks = [];
  const items = taskList.querySelectorAll("li");
  items.forEach((li) => {
    newTasks.push({
      id: +li.dataset.id,
      text: li.querySelector(".task-text").textContent,
      done: li.classList.contains("done"),
    });
  });

  saveTasksToStorage(newTasks);
}
