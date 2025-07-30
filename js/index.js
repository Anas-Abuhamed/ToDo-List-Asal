// Delete & update popup, search, array for items, global tasks
const addBtn = document.getElementById("add-btn");
const taskInput = document.getElementById("task-input");
const serachInput = document.getElementById("search-input")
const taskList = document.getElementById("task-list");
let tasks = getTasksFromStorage();  // Do global tasks, to just do like one request in whole project
tasks.forEach((task) => { // Get Tasks from localStroge and view them in page
  taskList.appendChild(createItem(task));
});
taskInput.focus();
serachInput.addEventListener("input", function () { // Search event listener
  search(serachInput)
});
taskList.addEventListener("click", function (e) { // Eventlisteners for actions events
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
    deleteItem(li, id);
  }
});

addBtn.addEventListener("click", addItem); // AddItem, it's text is what the user entered
taskInput.addEventListener("keydown", function (e) { // AddItem, but with keys
  if (e.key === "Enter") addItem();
  else if (e.key === "Escape") taskInput.value = "";
});

function addItem() { // Handle addItem, and after that add it in storage with unique id using Date.now()
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
  tasks.push(task);
  saveTasksToStorage(tasks);
  taskList.appendChild(createItem(task));
  taskInput.value = "";
}

function handleEdit(li, id) { // Edit task, by replace span with input to let user add edited text in it
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

  function saveEdit() { // To save edit, when user finished of editing
    if (editSaved) return;
    editSaved = true;

    const newText = input.value.trim();
    if (newText === "") {
      li.replaceChild(span, input);
      return
    }
    showPopup("Are you sure you want to edit?", function (confirmed) {
      if (confirmed) {
        span.textContent = newText;
        li.replaceChild(span, input);

        const task = tasks.find((t) => t.id === id);
        if (task) {
          task.text = newText;
          saveTasksToStorage(tasks);
        }
      } else {
        li.replaceChild(span, input);
      }
    });
  }

  function cancelEdit() { // If user want to stop edit action
    if (editSaved) return;
    editSaved = true;
    li.replaceChild(span, input);
  }
}

function deleteItem(item, id) { // To delete item, with popup for confirmation
  showPopup("Are you sure you want delete ?", function (confirmed) {
    if (confirmed) {
      item.remove();
      tasks = tasks.filter((t) => t.id !== id);
      saveTasksToStorage(tasks);
    }
  })
}
function search(element) {
  const query = element.value.trim().toLowerCase();
  const tasks = taskList.querySelectorAll("li");
  tasks.forEach((li) => {
    const text = li.querySelector(".task-text")?.textContent.toLowerCase() || "";
    li.style.display = text.includes(query) ? "" : "none"
  })
}

function createItem(task) { // To add item in page
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

function createIcon(className) { // To create icons actions in item
  const icon = document.createElement("i");
  icon.className = className;
  const parts = className.split(" ");
  icon.title = parts[parts.length - 1];
  return icon;
}

function getTasksFromStorage() { // get tasks from localStorage (as small database)
  return JSON.parse(localStorage.getItem("tasks")) || [];
}

function saveTasksToStorage(tasks) { // save updated tasks in localStorage
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function doneLocalStorage(id, li) { // to update done flag for specific task
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.done = li.classList.contains("done");
    saveTasksToStorage(tasks);
  }
}


// Drag & Drop
let draggedItem = null;
let dragStartX = 0;

taskList.addEventListener("dragstart", (e) => { // EventListener when user select item to drag it
  if (e.target.tagName === "LI") {
    draggedItem = e.target;
    dragStartX = e.clientX;
    draggedItem.classList.add("dragging");
  }
});

taskList.addEventListener("dragover", (e) => { // EventListener when user moving the element to drag it
  e.preventDefault();
  const afterElement = getDragAfterElement(taskList, e.clientY);
  if (afterElement == null) {
    taskList.appendChild(draggedItem);
  } else {
    taskList.insertBefore(draggedItem, afterElement);
  }
});

taskList.addEventListener("drop", (e) => { // EventListener when user drag the element in valid place
  e.preventDefault();
  updateOrderInStorage();
});

taskList.addEventListener("dragend", (e) => { // EventListener when drag operation end
  if (e.target.tagName === "LI") {
    draggedItem.classList.remove("dragging");

    const dragEndX = e.clientX;
    const deltaX = dragEndX - dragStartX;

    const id = +draggedItem.dataset.id;

    if (deltaX > 100) {
      handleEdit(draggedItem, id);
    } else if (deltaX < -100) {
      deleteItem(draggedItem, id)
    }

    updateOrderInStorage();
    draggedItem = null;
    dragStartX = 0;
  }
});

function getDragAfterElement(container, y) { // to see where the element dragged
  const draggableElements = Array.from(container.querySelectorAll("li:not(.dragging)"));
  for (const child of draggableElements) {
    const box = child.getBoundingClientRect();
    const center = box.top + box.height / 2;
    if (y < center) return child;
  }
  return null;
}

function updateOrderInStorage() { // After drag operation finished, it will update the order in task, then in local storage
  const newTasks = [];
  const items = taskList.querySelectorAll("li");
  items.forEach((li) => {
    newTasks.push({
      id: +li.dataset.id,
      text: li.querySelector(".task-text")?.textContent || li.querySelector(".edit-input")?.value,
      done: li.classList.contains("done"),
    });
  });

  saveTasksToStorage(newTasks);
}

// popup

function showPopup(message, callback) { // popup for add & delete confirmation
  const popup = document.querySelector(".popup");
  popup.innerHTML = `
    <div class="popup-overlay">
      <div class="popup-content">
        <p>${message}</p>
        <button class="cancel btn">Cancel</button>
        <button class="confirm btn">Confirm</button>
      </div>
    </div>
  `;
  popup.classList.add("show");

  const cancelBtn = popup.querySelector(".cancel");
  const confirmBtn = popup.querySelector(".confirm");

  function close(result) { // To close popup
    popup.classList.remove("show");
    document.removeEventListener("keydown", handleKey);
    callback(result);
  }

  cancelBtn.onclick = () => close(false);
  confirmBtn.onclick = () => close(true);

  function handleKey(e) { // for key actions
    if (e.key === "Enter") {
      close(true);
    } else if (e.key === "Escape") {
      close(false);
    }
  }

  document.addEventListener("keydown", handleKey);
}

