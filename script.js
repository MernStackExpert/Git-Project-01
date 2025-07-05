document.addEventListener("DOMContentLoaded", () => {
  const getEl = (id) => document.getElementById(id);
  // --- DOM Elements ---
  const homeBtn = getEl("home-btn"),
    newNoteBtn = getEl("new-note-btn"),
    notesListEl = getEl("notes-list"),
    searchInput = getEl("search-input"),
    homeView = getEl("home-view"),
    editorView = getEl("editor-view"),
    noteTitleEl = getEl("note-title"),
    noteContentEl = getEl("note-content"),
    toolbar = getEl("toolbar"),
    saveNoteBtn = getEl("save-note-btn"),
    saveBtnText = getEl("save-btn-text"),
    deleteNoteBtn = getEl("delete-note-btn"),
    deleteModal = getEl("delete-modal"),
    cancelDeleteBtn = getEl("cancel-delete-btn"),
    confirmDeleteBtn = getEl("confirm-delete-btn"),
    newNoteModal = getEl("new-note-modal"),
    newNoteForm = getEl("new-note-form"),
    newNoteTitleInput = getEl("new-note-title-input"),
    cancelNewNoteBtn = getEl("cancel-new-note-btn"),
    sidebar = getEl("sidebar"),
    sidebarToggle = getEl("sidebar-toggle"),
    mobileHeaderTitle = getEl("mobile-header-title"),
    makePrivateCheckbox = getEl("make-private-checkbox"),
    passwordFieldContainer = getEl("password-field-container"),
    newNotePasswordInput = getEl("new-note-password-input"),
    unlockNoteModal = getEl("unlock-note-modal"),
    unlockNoteForm = getEl("unlock-note-form"),
    unlockPasswordInput = getEl("unlock-password-input"),
    cancelUnlockBtn = getEl("cancel-unlock-btn"),
    unlockError = getEl("unlock-error"),
    sidebarActions = getEl("sidebar-actions"),
    selectionActions = getEl("selection-actions"),
    selectBtn = getEl("select-btn"),
    cancelSelectBtn = getEl("cancel-select-btn"),
    deleteSelectedBtn = getEl("delete-selected-btn"),
    dashboardGrid = getEl("dashboard-grid"),
    deleteModalTitle = getEl("delete-modal-title"),
    deleteModalText = getEl("delete-modal-text"),
    layoutToggle = getEl("layout-toggle"),
    themeBtn = getEl("theme-btn"),
    themeDropdown = getEl("theme-dropdown"),
    aboutMeBtn = getEl("about-me-btn"),
    aboutMeModal = getEl("about-me-modal"),
    closeAboutModalBtn = getEl("close-about-modal-btn"),
    homeAboutBtn = getEl("home-about-btn");

  // --- State ---
  let notes = [],
    activeNoteId = null,
    noteToUnlockId = null,
    noteToDeleteId = null,
    isSelectMode = false,
    selectedNoteIds = new Set(),
    currentLayout = "grid",
    currentTheme = "dark";

  // --- Functions ---
  const saveNotes = () =>
    localStorage.setItem("vip-notes-pro", JSON.stringify(notes));
  const loadNotes = () => {
    notes = JSON.parse(localStorage.getItem("vip-notes-pro")) || [];
    notes.forEach((note) => {
      if (typeof note.isSaved === "undefined") note.isSaved = true;
    });
  };

  const encrypt = (text) => btoa(unescape(encodeURIComponent(text)));
  const decrypt = (text) => decodeURIComponent(escape(atob(text)));

  const applyTheme = (theme) => {
    document.body.dataset.theme = theme;
    localStorage.setItem("vip-notes-theme", theme);
    currentTheme = theme;
  };

  const applyLayout = (layout) => {
    dashboardGrid.className =
      layout === "grid"
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        : "flex flex-col gap-4";
    localStorage.setItem("vip-notes-layout", layout);
    currentLayout = layout;
    layoutToggle.querySelectorAll("button").forEach((btn) => {
      btn.classList.toggle("bg-blue-600", btn.dataset.layout === layout);
    });
  };

  const showView = (viewToShow) => {
    [homeView, editorView].forEach((view) => view.classList.add("hidden"));
    if (viewToShow) {
      viewToShow.classList.remove("hidden");
      viewToShow.classList.add("flex");
      viewToShow.classList.remove("view-container");
      void viewToShow.offsetWidth;
      viewToShow.classList.add("view-container");
    }
    if (mobileHeaderTitle) {
      if (viewToShow === homeView) mobileHeaderTitle.innerText = "Home";
      else if (viewToShow === editorView && activeNoteId) {
        const note = notes.find((n) => n.id === activeNoteId);
        mobileHeaderTitle.innerText = note ? note.title : "Editor";
      }
    }
  };

  const renderNoteList = (filter = "") => {
    notesListEl.innerHTML = "";
    const filteredNotes = notes
      .filter((note) => note.title.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => b.timestamp - a.timestamp);

    if (filteredNotes.length === 0) {
      notesListEl.innerHTML = `<p class="text-center text-gray-500 p-4">No notes found.</p>`;
    } else {
      filteredNotes.forEach((note) => {
        const item = document.createElement("div");
        let stateClasses = note.id === activeNoteId ? "active" : "";
        if (note.isSaved) stateClasses += " saved";
        if (isSelectMode) stateClasses += " selection-mode";
        if (selectedNoteIds.has(note.id)) stateClasses += " selected";

        item.className = `note-item p-4 rounded-lg cursor-pointer border-l-4 flex justify-between items-center ${stateClasses}`;
        item.dataset.id = note.id;

        const contentWrapper = document.createElement("div");
        contentWrapper.className = "flex items-center gap-3 flex-grow";

        if (isSelectMode) {
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.className =
            "w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 shrink-0";
          checkbox.checked = selectedNoteIds.has(note.id);
          checkbox.onchange = (e) => {
            e.stopPropagation();
            toggleNoteSelection(note.id);
          };
          contentWrapper.appendChild(checkbox);
        }

        const titleWrapper = document.createElement("div");
        titleWrapper.className = "flex flex-col overflow-hidden";
        const title = document.createElement("h3");
        title.className = "font-bold truncate";
        title.textContent = note.title;
        titleWrapper.appendChild(title);

        if (!note.isSaved) {
          const unsavedBadge = document.createElement("span");
          unsavedBadge.className = "text-xs text-yellow-400 font-semibold";
          unsavedBadge.textContent = "Unsaved";
          titleWrapper.appendChild(unsavedBadge);
        }
        contentWrapper.appendChild(titleWrapper);
        item.appendChild(contentWrapper);

        if (note.isPrivate) {
          const lockIcon = document.createElement("span");
          lockIcon.className = "shrink-0 ml-2";
          lockIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" /></svg>`;
          item.appendChild(lockIcon);
        }
        notesListEl.appendChild(item);
      });
    }
  };

  const renderDashboard = () => {
    dashboardGrid.innerHTML = "";
    const savedNotes = notes
      .filter((n) => n.isSaved)
      .sort((a, b) => b.timestamp - a.timestamp);

    const createCard = document.createElement("div");
    createCard.className =
      "border-2 border-dashed flex items-center justify-center rounded-lg cursor-pointer transition-colors hover:border-blue-500 hover:text-blue-500";
    createCard.style.borderColor = "var(--bg-tertiary)";
    createCard.style.color = "var(--text-secondary)";
    createCard.innerHTML = `<div class="text-center p-4"><svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span class="mt-2 block font-semibold">Create New Note</span></div>`;
    createCard.onclick = () => newNoteModal.classList.remove("hidden");
    dashboardGrid.appendChild(createCard);

    if (savedNotes.length > 0) {
      savedNotes.forEach((note) => {
        const card = document.createElement("div");
        card.className = "p-4 rounded-lg cursor-pointer transition-colors";
        card.style.backgroundColor = "var(--bg-secondary)";
        card.dataset.id = note.id;
        card.innerHTML = `<h3 class="font-bold truncate">${
          note.title
        }</h3><p class="text-sm mt-1" style="color: var(--text-secondary)">Last updated: ${new Date(
          note.timestamp
        ).toLocaleDateString()}</p>`;
        card.onclick = () => selectNote(note.id);
        dashboardGrid.appendChild(card);
      });
    }
  };

  const renderEditor = (decryptedContent = null) => {
    const activeNote = notes.find((note) => note.id === activeNoteId);
    if (activeNote) {
      showView(editorView);
      noteTitleEl.innerText = activeNote.title;
      noteContentEl.innerHTML =
        decryptedContent !== null
          ? decryptedContent
          : activeNote.isPrivate
          ? ""
          : activeNote.content;
    } else {
      renderDashboard();
      showView(homeView);
    }
  };

  const createNewNote = (title, isPrivate, password) => {
    const newNote = {
      id: Date.now(),
      title,
      content: "",
      timestamp: Date.now(),
      isPrivate,
      password: isPrivate ? encrypt(password) : null,
      isSaved: false,
    };
    notes.unshift(newNote);
    activeNoteId = newNote.id;
    saveNotes();
    renderNoteList();
    renderEditor();
    const newNoteEl = notesListEl.querySelector(`[data-id='${newNote.id}']`);
    if (newNoteEl) newNoteEl.classList.add("new-note-anim");
    if (window.innerWidth < 767) sidebar.classList.add("hidden-mobile");
  };

  const selectNote = (id) => {
    if (isSelectMode) {
      toggleNoteSelection(id);
      return;
    }
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    if (note.isPrivate) {
      noteToUnlockId = id;
      unlockPasswordInput.value = "";
      unlockError.classList.add("hidden");
      unlockNoteModal.classList.remove("hidden");
    } else {
      activeNoteId = id;
      renderNoteList(searchInput.value);
      renderEditor(note.content);
      if (window.innerWidth < 767) sidebar.classList.add("hidden-mobile");
    }
  };

  const saveCurrentNote = () => {
    const activeNote = notes.find((note) => note.id === activeNoteId);
    if (activeNote) {
      activeNote.content = activeNote.isPrivate
        ? encrypt(noteContentEl.innerHTML)
        : noteContentEl.innerHTML;
      activeNote.timestamp = Date.now();
      activeNote.isSaved = true;
      saveNotes();
      renderNoteList(searchInput.value);
      if (saveBtnText && saveNoteBtn) {
        saveBtnText.innerText = "Saved!";
        saveNoteBtn.classList.add("text-green-400");
        setTimeout(() => {
          saveBtnText.innerText = "Save Note";
          saveNoteBtn.classList.remove("text-green-400");
        }, 2000);
      }
    }
  };

  const deleteNote = (id) => {
    const noteEl = notesListEl.querySelector(`[data-id='${id}']`);
    if (noteEl) {
      noteEl.classList.add("deleting");
      noteEl.addEventListener(
        "animationend",
        () => {
          notes = notes.filter((note) => note.id !== id);
          if (activeNoteId === id) activeNoteId = null;
          saveNotes();
          renderNoteList(searchInput.value);
          renderEditor();
        },
        { once: true }
      );
    }
  };

  const toggleSelectMode = () => {
    isSelectMode = !isSelectMode;
    selectedNoteIds.clear();
    sidebarActions.classList.toggle("hidden");
    selectionActions.classList.toggle("hidden");
    renderNoteList(searchInput.value);
  };

  const toggleNoteSelection = (id) => {
    if (selectedNoteIds.has(id)) selectedNoteIds.delete(id);
    else selectedNoteIds.add(id);
    renderNoteList(searchInput.value);
  };

  const deleteSelected = () => {
    notes = notes.filter((note) => !selectedNoteIds.has(note.id));
    selectedNoteIds.forEach((id) => {
      if (activeNoteId === id) activeNoteId = null;
    });
    saveNotes();
    toggleSelectMode();
    renderEditor();
  };

  // --- Event Listeners ---
  homeBtn.addEventListener("click", () => {
    activeNoteId = null;
    renderNoteList();
    renderDashboard();
    showView(homeView);
    if (window.innerWidth < 767) sidebar.classList.add("hidden-mobile");
  });
  newNoteBtn.addEventListener("click", () =>
    newNoteModal.classList.remove("hidden")
  );
  cancelNewNoteBtn.addEventListener("click", () =>
    newNoteModal.classList.add("hidden")
  );
  makePrivateCheckbox.addEventListener("change", () =>
    passwordFieldContainer.classList.toggle("hidden")
  );
  newNoteForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = newNoteTitleInput.value.trim();
    const isPrivate = makePrivateCheckbox.checked;
    const password = newNotePasswordInput.value;
    if (isPrivate && !password) {
      alert("Password is required for private notes.");
      return;
    }
    if (title) {
      createNewNote(title, isPrivate, password);
      newNoteModal.classList.add("hidden");
      newNoteForm.reset();
      passwordFieldContainer.classList.add("hidden");
    }
  });
  unlockNoteForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const note = notes.find((n) => n.id === noteToUnlockId);
    const enteredPassword = unlockPasswordInput.value;
    if (note && enteredPassword && decrypt(note.password) === enteredPassword) {
      activeNoteId = noteToUnlockId;
      renderNoteList();
      renderEditor(decrypt(note.content));
      unlockNoteModal.classList.add("hidden");
      noteToUnlockId = null;
      if (window.innerWidth < 767) sidebar.classList.add("hidden-mobile");
    } else {
      unlockError.classList.remove("hidden");
      unlockNoteModal.querySelector(".modal-box").classList.add("shake");
      setTimeout(
        () =>
          unlockNoteModal.querySelector(".modal-box").classList.remove("shake"),
        500
      );
    }
  });
  cancelUnlockBtn.addEventListener("click", () =>
    unlockNoteModal.classList.add("hidden")
  );
  notesListEl.addEventListener("click", (e) => {
    const noteItem = e.target.closest(".note-item");
    if (noteItem) selectNote(Number(noteItem.dataset.id));
  });
  searchInput.addEventListener("input", () =>
    renderNoteList(searchInput.value)
  );
  saveNoteBtn.addEventListener("click", saveCurrentNote);
  toolbar.addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (button && button.dataset.command)
      document.execCommand(
        button.dataset.command,
        false,
        button.dataset.value || null
      );
  });
  deleteNoteBtn.addEventListener("click", () => {
    if (activeNoteId) {
      noteToDeleteId = activeNoteId;
      deleteModalTitle.innerText = "Delete Note";
      deleteModalText.innerText = "Are you sure you want to delete this note?";
      deleteModal.classList.remove("hidden");
    }
  });
  selectBtn.addEventListener("click", toggleSelectMode);
  cancelSelectBtn.addEventListener("click", toggleSelectMode);
  deleteSelectedBtn.addEventListener("click", () => {
    if (selectedNoteIds.size > 0) {
      noteToDeleteId = null;
      deleteModalTitle.innerText = `Delete ${selectedNoteIds.size} Notes`;
      deleteModalText.innerText = `Are you sure you want to delete these ${selectedNoteIds.size} notes?`;
      deleteModal.classList.remove("hidden");
    }
  });
  cancelDeleteBtn.addEventListener("click", () =>
    deleteModal.classList.add("hidden")
  );
  confirmDeleteBtn.addEventListener("click", () => {
    if (noteToDeleteId) deleteNote(noteToDeleteId);
    else deleteSelected();
    deleteModal.classList.add("hidden");
  });
  sidebarToggle.addEventListener("click", () =>
    sidebar.classList.toggle("hidden-mobile")
  );
  themeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    themeDropdown.classList.toggle("hidden");
  });
  themeDropdown.addEventListener("click", (e) => {
    e.preventDefault();
    if (e.target.tagName === "A") {
      applyTheme(e.target.dataset.theme);
      themeDropdown.classList.add("hidden");
    }
  });
  layoutToggle.addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (button) applyLayout(button.dataset.layout);
  });
  aboutMeBtn.addEventListener("click", () =>
    aboutMeModal.classList.remove("hidden")
  );
  closeAboutModalBtn.addEventListener("click", () =>
    aboutMeModal.classList.add("hidden")
  );
  if (homeAboutBtn)
    homeAboutBtn.addEventListener("click", () =>
      aboutMeModal.classList.remove("hidden")
    );
  window.addEventListener("click", (e) => {
    if (!themeBtn.contains(e.target)) themeDropdown.classList.add("hidden");
  });

  // --- Initial Load ---
  loadNotes();
  const savedTheme = localStorage.getItem("vip-notes-theme") || "dark";
  const savedLayout = localStorage.getItem("vip-notes-layout") || "grid";
  applyTheme(savedTheme);
  applyLayout(savedLayout);
  renderNoteList();
  renderDashboard();
  showView(homeView);
});
