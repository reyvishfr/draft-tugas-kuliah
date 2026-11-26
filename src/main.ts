import './style.css';
import type { Task, TaskStatus, FilterStatus } from './types';
import { TASKS_STORAGE_KEY, loadFromStorage, saveToStorage } from './storage';

// [Contoh TypeScript: Primitive Types (string, number, boolean)]
// Mengambil nama dan versi aplikasi dari environment variables (.env)
const appName: string = import.meta.env.VITE_APP_NAME || 'Daftar Tugas Kuliah';
const appVersion: string = import.meta.env.VITE_APP_VERSION || '1.0.0';
const maxTitleLength: number = 120;
let isEditMode: boolean = false;
let editingTaskId: string | null = null;
let activeFilter: FilterStatus = 'Semua';

// [Contoh TypeScript: Array of Interface (Task[])]
// Menyimpan daftar tugas kuliah dalam bentuk array bertipe Task[]
let tasks: Task[] = [];

// Data awal contoh jika localStorage masih belum pernah diisi sama sekali
const initialSampleTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Laporan Praktikum Struktur Data & Algoritma',
    course: 'Struktur Data',
    deadline: '2026-12-05',
    status: 'Belum Selesai',
    completed: false,
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'task-2',
    title: 'Implementasi Web App TypeScript + Vite',
    course: 'Pemrograman Web',
    deadline: '2026-11-30',
    status: 'Selesai',
    completed: true,
    createdAt: Date.now() - 43200000,
  },
];

// Memuat data dari localStorage menggunakan fungsi generic loadFromStorage<Task[]>
function initTasks(): void {
  const storedTasks: Task[] | null = loadFromStorage<Task[]>(TASKS_STORAGE_KEY);
  if (storedTasks !== null) {
    tasks = storedTasks;
  } else {
    tasks = initialSampleTasks;
    saveToStorage<Task[]>(TASKS_STORAGE_KEY, tasks);
  }
}

// Menyimpan perubahan daftar tugas ke localStorage
function persistTasks(): void {
  saveToStorage<Task[]>(TASKS_STORAGE_KEY, tasks);
}

// Helper untuk mencegah XSS saat merender teks input user ke HTML
function escapeHtml(text: string): string {
  const div: HTMLDivElement = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Memformat tanggal YYYY-MM-DD menjadi format Bahasa Indonesia yang rapi
function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const parts: string[] = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const year: number = Number(parts[0]);
  const month: number = Number(parts[1]) - 1;
  const day: number = Number(parts[2]);
  const dateObj = new Date(year, month, day);
  return dateObj.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Menambah tugas baru atau menyimpan perubahan edit tugas
function handleFormSubmit(event: SubmitEvent): void {
  event.preventDefault();

  const titleInput = document.querySelector<HTMLInputElement>('#task-title');
  const courseInput = document.querySelector<HTMLInputElement>('#task-course');
  const deadlineInput = document.querySelector<HTMLInputElement>('#task-deadline');

  if (!titleInput || !courseInput || !deadlineInput) return;

  const title: string = titleInput.value.trim().slice(0, maxTitleLength);
  const course: string = courseInput.value.trim();
  const deadline: string = deadlineInput.value.trim();

  if (!title || !course || !deadline) return;

  if (isEditMode && editingTaskId) {
    // Update tugas yang sedang diedit
    tasks = tasks.map((task: Task): Task => {
      if (task.id === editingTaskId) {
        return {
          ...task,
          title,
          course,
          deadline,
        };
      }
      return task;
    });
    cancelEditMode();
  } else {
    // Buat objek tugas baru sesuai interface Task
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      course,
      deadline,
      status: 'Belum Selesai',
      completed: false,
      createdAt: Date.now(),
    };
    tasks = [newTask, ...tasks];
  }

  persistTasks();
  resetFormFields();
  renderTasksAndStats();
}

// Mengubah status tugas ("Belum Selesai" <-> "Selesai")
function toggleTaskStatus(id: string): void {
  tasks = tasks.map((task: Task): Task => {
    if (task.id === id) {
      const nextCompleted: boolean = !task.completed;
      const nextStatus: TaskStatus = nextCompleted ? 'Selesai' : 'Belum Selesai';
      return {
        ...task,
        completed: nextCompleted,
        status: nextStatus,
      };
    }
    return task;
  });

  persistTasks();
  renderTasksAndStats();
}

// Memulai mode edit untuk tugas tertentu
function startEditTask(id: string): void {
  const targetTask: Task | undefined = tasks.find((t: Task) => t.id === id);
  if (!targetTask) return;

  isEditMode = true;
  editingTaskId = targetTask.id;

  const titleInput = document.querySelector<HTMLInputElement>('#task-title');
  const courseInput = document.querySelector<HTMLInputElement>('#task-course');
  const deadlineInput = document.querySelector<HTMLInputElement>('#task-deadline');
  const formHeading = document.querySelector<HTMLElement>('#form-heading');
  const formSubtitle = document.querySelector<HTMLElement>('#form-subtitle');
  const submitBtn = document.querySelector<HTMLButtonElement>('#submit-btn');
  const cancelBtn = document.querySelector<HTMLButtonElement>('#cancel-edit-btn');

  if (titleInput) titleInput.value = targetTask.title;
  if (courseInput) courseInput.value = targetTask.course;
  if (deadlineInput) deadlineInput.value = targetTask.deadline;
  if (formHeading) formHeading.textContent = 'Edit Tugas Kuliah';
  if (formSubtitle) formSubtitle.textContent = 'Perbarui informasi tugas yang sedang dipilih';
  if (submitBtn) submitBtn.textContent = 'Simpan Perubahan';
  if (cancelBtn) cancelBtn.classList.remove('hidden');

  titleInput?.focus();
  renderTasksAndStats();
}

// Membatalkan mode edit dan mengembalikan form ke mode tambah tugas
function cancelEditMode(): void {
  isEditMode = false;
  editingTaskId = null;

  const formHeading = document.querySelector<HTMLElement>('#form-heading');
  const formSubtitle = document.querySelector<HTMLElement>('#form-subtitle');
  const submitBtn = document.querySelector<HTMLButtonElement>('#submit-btn');
  const cancelBtn = document.querySelector<HTMLButtonElement>('#cancel-edit-btn');

  if (formHeading) formHeading.textContent = 'Tambah Tugas Baru';
  if (formSubtitle) formSubtitle.textContent = 'Catat tugas baru agar tidak terlewat tenggat waktu';
  if (submitBtn) submitBtn.textContent = '+ Tambah Tugas';
  if (cancelBtn) cancelBtn.classList.add('hidden');

  resetFormFields();
  renderTasksAndStats();
}

// Mengosongkan input form
function resetFormFields(): void {
  const form = document.querySelector<HTMLFormElement>('#task-form');
  form?.reset();
}

// Menghapus tugas berdasarkan ID
function deleteTask(id: string): void {
  tasks = tasks.filter((task: Task) => task.id !== id);
  if (editingTaskId === id) {
    cancelEditMode();
  }
  persistTasks();
  renderTasksAndStats();
}

// Merender statistik dan daftar kartu tugas
function renderTasksAndStats(): void {
  const totalCount: number = tasks.length;
  const completedCount: number = tasks.filter((t: Task) => t.status === 'Selesai').length;
  const pendingCount: number = totalCount - completedCount;
  const progressPercent: number = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const totalEl = document.querySelector<HTMLElement>('#stat-total');
  const pendingEl = document.querySelector<HTMLElement>('#stat-pending');
  const completedEl = document.querySelector<HTMLElement>('#stat-completed');
  const progressBarEl = document.querySelector<HTMLElement>('#progress-fill');
  const progressTextEl = document.querySelector<HTMLElement>('#progress-text');

  if (totalEl) totalEl.textContent = String(totalCount);
  if (pendingEl) pendingEl.textContent = String(pendingCount);
  if (completedEl) completedEl.textContent = String(completedCount);
  if (progressBarEl) progressBarEl.style.width = `${progressPercent}%`;
  if (progressTextEl) progressTextEl.textContent = `${progressPercent}% Selesai`;

  // Update tombol filter aktif
  const filterButtons = document.querySelectorAll<HTMLButtonElement>('.filter-btn');
  filterButtons.forEach((btn: HTMLButtonElement) => {
    const filterValue = btn.dataset.filter as FilterStatus;
    if (filterValue === activeFilter) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Filter daftar tugas sesuai tab yang dipilih
  const filteredTasks: Task[] = tasks.filter((task: Task): boolean => {
    if (activeFilter === 'Semua') return true;
    return task.status === activeFilter;
  });

  const taskListEl = document.querySelector<HTMLElement>('#task-list');
  if (!taskListEl) return;

  if (filteredTasks.length === 0) {
    taskListEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-illustration" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
            <path d="m9 16 2 2 4-4"></path>
          </svg>
        </div>
        <p class="empty-title">Belum ada tugas pada daftar ini</p>
        <p class="empty-desc">
          ${
            activeFilter === 'Semua'
              ? 'Semua tugas kuliah Anda akan tampil di sini. Tambahkan tugas baru melalui formulir di sebelah kiri.'
              : `Tidak ada tugas kuliah dengan status "${activeFilter}".`
          }
        </p>
      </div>
    `;
    return;
  }

  taskListEl.innerHTML = filteredTasks
    .map((task: Task): string => {
      const isDone: boolean = task.status === 'Selesai';
      const isBeingEdited: boolean = isEditMode && editingTaskId === task.id;
      return `
        <article class="task-card ${isDone ? 'task-done' : ''} ${isBeingEdited ? 'task-editing' : ''}" data-id="${escapeHtml(task.id)}">
          <div class="task-card-body">
            <button
              type="button"
              class="check-circle ${isDone ? 'checked' : ''}"
              data-action="toggle"
              data-id="${escapeHtml(task.id)}"
              aria-label="Toggle status selesai"
              title="${isDone ? 'Tandai Belum Selesai' : 'Tandai Selesai'}"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>

            <div class="task-info">
              <div class="task-badges">
                <span class="course-badge">${escapeHtml(task.course)}</span>
                <span class="status-badge ${isDone ? 'status-selesai' : 'status-belum'}">
                  <span class="status-dot"></span>
                  ${escapeHtml(task.status)}
                </span>
              </div>
              <h3 class="task-title">${escapeHtml(task.title)}</h3>
              <div class="task-meta">
                <span class="deadline-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  Tenggat: <strong>${escapeHtml(formatDate(task.deadline))}</strong>
                </span>
              </div>
            </div>
          </div>

          <div class="task-actions">
            <button
              type="button"
              class="btn btn-toggle ${isDone ? 'btn-mark-undone' : 'btn-mark-done'}"
              data-action="toggle"
              data-id="${escapeHtml(task.id)}"
            >
              ${isDone ? 'Batalkan Selesai' : 'Tandai Selesai'}
            </button>
            <div class="action-group-right">
              <button
                type="button"
                class="btn btn-edit"
                data-action="edit"
                data-id="${escapeHtml(task.id)}"
              >
                Edit
              </button>
              <button
                type="button"
                class="btn btn-delete"
                data-action="delete"
                data-id="${escapeHtml(task.id)}"
              >
                Hapus
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

// Merender kerangka utama aplikasi dan memasang event listener
function initApp(): void {
  document.title = `${appName} v${appVersion}`;
  const appContainer = document.querySelector<HTMLDivElement>('#app');
  if (!appContainer) return;

  appContainer.innerHTML = `
    <header class="app-header">
      <div class="container header-inner">
        <div class="brand">
          <div class="brand-logo" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
              <path d="m9 9.5 2 2 4-4"></path>
            </svg>
          </div>
          <div>
            <div class="title-row">
              <h1 class="app-title">${escapeHtml(appName)}</h1>
              <span class="version-pill">v${escapeHtml(appVersion)}</span>
            </div>
            <p class="app-subtitle">Dashboard pengelolaan tugas & jadwal tenggat perkuliahan</p>
          </div>
        </div>

        <div class="header-progress">
          <div class="progress-info">
            <span class="progress-label">Progres Penyelesaian</span>
            <strong id="progress-text" class="progress-percentage">0% Selesai</strong>
          </div>
          <div class="progress-track">
            <div id="progress-fill" class="progress-fill" style="width: 0%"></div>
          </div>
        </div>
      </div>
    </header>

    <main class="container main-content">
      <!-- Ringkasan Statistik -->
      <section class="stats-grid" aria-label="Ringkasan Tugas">
        <div class="stat-card">
          <div class="stat-icon stat-icon-blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">Total Tugas</span>
            <strong class="stat-value" id="stat-total">0</strong>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon-amber">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">Belum Selesai</span>
            <strong class="stat-value stat-value-amber" id="stat-pending">0</strong>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon-emerald">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">Sudah Selesai</span>
            <strong class="stat-value stat-value-emerald" id="stat-completed">0</strong>
          </div>
        </div>
      </section>

      <div class="workspace-grid">
        <!-- Panel Form Tambah / Edit Tugas -->
        <aside class="form-panel">
          <div class="card">
            <div class="card-header">
              <h2 id="form-heading" class="section-title">Tambah Tugas Baru</h2>
              <p id="form-subtitle" class="section-desc">Catat tugas baru agar tidak terlewat tenggat waktu</p>
            </div>

            <form id="task-form" class="task-form">
              <div class="form-group">
                <label for="task-title">Judul Tugas</label>
                <input
                  type="text"
                  id="task-title"
                  name="title"
                  placeholder="Contoh: Makalah Kecerdasan Buatan"
                  required
                />
              </div>

              <div class="form-group">
                <label for="task-course">Mata Kuliah</label>
                <input
                  type="text"
                  id="task-course"
                  name="course"
                  placeholder="Contoh: Pemrograman Web"
                  required
                />
              </div>

              <div class="form-group">
                <label for="task-deadline">Tenggat Pengumpulan</label>
                <input
                  type="date"
                  id="task-deadline"
                  name="deadline"
                  required
                />
              </div>

              <div class="form-buttons">
                <button type="submit" id="submit-btn" class="btn btn-primary">
                  + Tambah Tugas
                </button>
                <button type="button" id="cancel-edit-btn" class="btn btn-secondary hidden">
                  Batal Edit
                </button>
              </div>
            </form>
          </div>
        </aside>

        <!-- Panel Daftar Tugas -->
        <section class="list-panel">
          <div class="list-header">
            <div>
              <h2 class="section-title">Daftar Tugas Kuliah</h2>
              <p class="section-desc">Klik lingkaran centang atau tombol aksi untuk memperbarui tugas</p>
            </div>
            <div class="filter-tabs" role="tablist" aria-label="Filter Status Tugas">
              <button type="button" class="filter-btn active" data-filter="Semua">Semua</button>
              <button type="button" class="filter-btn" data-filter="Belum Selesai">Belum Selesai</button>
              <button type="button" class="filter-btn" data-filter="Selesai">Selesai</button>
            </div>
          </div>

          <div id="task-list" class="task-list"></div>
        </section>
      </div>
    </main>
  `;

  initTasks();
  renderTasksAndStats();

  // Event listener form submit & batal edit
  const formEl = document.querySelector<HTMLFormElement>('#task-form');
  formEl?.addEventListener('submit', handleFormSubmit);

  const cancelBtn = document.querySelector<HTMLButtonElement>('#cancel-edit-btn');
  cancelBtn?.addEventListener('click', cancelEditMode);

  // Event listener untuk tombol filter
  const filterContainer = document.querySelector<HTMLElement>('.filter-tabs');
  filterContainer?.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const btn = target.closest<HTMLButtonElement>('.filter-btn');
    if (!btn || !btn.dataset.filter) return;

    activeFilter = btn.dataset.filter as FilterStatus;
    renderTasksAndStats();
  });

  // Event delegation untuk aksi pada kartu tugas (toggle status, edit, hapus)
  const taskListEl = document.querySelector<HTMLElement>('#task-list');
  taskListEl?.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const actionBtn = target.closest<HTMLButtonElement>('button[data-action]');
    if (!actionBtn) return;

    const action: string | undefined = actionBtn.dataset.action;
    const taskId: string | undefined = actionBtn.dataset.id;
    if (!taskId) return;

    if (action === 'toggle') {
      toggleTaskStatus(taskId);
    } else if (action === 'edit') {
      startEditTask(taskId);
    } else if (action === 'delete') {
      deleteTask(taskId);
    }
  });
}

initApp();
