/** Simple BookList: LocalStorage-based CRUD + Search
 *  Foto: isi nama file yang ada di folder ./img/, contoh: "atomic-habits.jpg"
 */
const LS_KEY = "booklist_data_v1";
const $ = (sel) => document.querySelector(sel);

const state = {
  books: [],
  editingNumber: null,
};

let nextNumber = 1; // untuk auto increment nomor buku

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    state.books = raw ? JSON.parse(raw) : seedIfEmpty();

    // cari nomor terbesar dari data lama
    if (state.books.length > 0) {
      const maxNo = Math.max(
        ...state.books.map((b) => parseInt(b.nomor, 10) || 0)
      );
      nextNumber = maxNo + 1;
    }
  } catch (e) {
    state.books = seedIfEmpty();
  }
}

function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(state.books));
}

function seedIfEmpty() {
  // contoh data awal / demo
  return [
    {
      nomor: 1,
      foto: "atomic_habits.png",
      nama: "Atomic Habits",
      penulis: "James Clear",
      genre: "Self-Improvement",
      status: "Finish",
      halaman: 320,
      rating: 9,
      sinopsis: "Kebiasaan kecil yang membawa perubahan besar.",
    },
    {
      nomor: 2,
      foto: "python_implementasi.png",
      nama: "Python: Implementasi Algoritma Kompleks dalam Era Industri 5.0 dan Society 5.0",
      penulis: "I Gusti Ngurah Suryantara",
      genre: "Teknologi",
      status: "Reading",
      halaman: 520,
      rating: 8,
      sinopsis:
        "Algoritma Kompleks adalah serangkaian langkah terstruktur yang dirancang untuk memecahkan masalah yang rumit dan sulit.",
    },
  ];
}

function renderTable(filterText = "") {
  const tbody = $("#bookTbody");
  tbody.innerHTML = "";

  const q = filterText.trim().toLowerCase();

  const filtered = state.books.filter((b) => {
    if (!q) return true;
    const hay = [b.nama, b.penulis, b.genre, b.status, b.sinopsis]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });

  if (filtered.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 10;
    td.className = "muted";
    td.textContent = "Tidak ada data yang cocok.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  for (const b of filtered) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${b.nomor}</td>
      <td>
        <img class="thumb" src="img/${b.foto || "placeholder.png"}" alt="${
      b.nama
    }"
             onerror="this.onerror=null;this.src='img/placeholder.png';" />
      </td>
      <td>${escapeHtml(b.nama)}</td>
      <td>${escapeHtml(b.penulis)}</td>
      <td>${escapeHtml(b.genre)}</td>
      <td>${escapeHtml(b.status)}</td>
      <td>${Number(b.halaman) || "-"}</td>
      <td>${Number(b.rating) || "-"}</td>
      <td style="max-width:320px">${escapeHtml(b.sinopsis || "")}</td>
      <td class="actions">
        <button class="btn edit" data-edit="${b.nomor}">Edit</button>
        <button class="btn hapus" data-del="${b.nomor}">Hapus</button>
      </td>
    `;

    // actions
    tr.querySelector(`[data-edit="${b.nomor}"]`).addEventListener("click", () =>
      openEdit(b.nomor)
    );
    tr.querySelector(`[data-del="${b.nomor}"]`).addEventListener("click", () =>
      remove(b.nomor)
    );
    tbody.appendChild(tr);
  }
}

function escapeHtml(str = "") {
  return String(str).replace(
    /[&<>"']/g,
    (s) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      }[s])
  );
}

/* Dialog helpers */
const dialog = $("#bookDialog");
$("#btnAdd").addEventListener("click", () => openAdd());
$("#btnCancel").addEventListener("click", () => dialog.close());

$("#bookForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const payload = {
    nomor: $("#bookNumber").value || nextNumber,
    nama: $("#nama").value.trim(),
    penulis: $("#penulis").value.trim(),
    genre: $("#genre").value,
    status: $("#status").value,
    halaman: parseInt($("#halaman").value, 10),
    rating: parseInt($("#rating").value, 10),
    sinopsis: $("#sinopsis").value.trim(),
    foto: ($("#foto").value || "").trim(),
  };

  if (
    !payload.nama ||
    !payload.penulis ||
    !payload.genre ||
    !payload.status ||
    !payload.halaman ||
    !payload.rating
  ) {
    alert("Mohon lengkapi data yang wajib.");
    return;
  }

  if (state.editingNumber) {
    // update
    const idx = state.books.findIndex((b) => b.nomor === state.editingNumber);
    if (idx >= 0) state.books[idx] = payload;
  } else {
    // create
    state.books.push(payload);
    nextNumber++; // naikkan nomor berikutnya
  }

  save();
  dialog.close();
  state.editingNumber = null;
  renderTable($("#searchInput").value);
});

function openAdd() {
  state.editingNumber = null;
  $("#dialogTitle").textContent = "Tambah Buku";
  $("#bookNumber").value = "";
  $("#nama").value = "";
  $("#penulis").value = "";
  $("#genre").value = "";
  $("#status").value = "";
  $("#halaman").value = "";
  $("#rating").value = "";
  $("#sinopsis").value = "";
  $("#foto").value = "";
  dialog.showModal();
}

function openEdit(nomor) {
  const b = state.books.find((x) => x.nomor === nomor);
  if (!b) return;

  state.editingNumber = nomor;
  $("#dialogTitle").textContent = "Edit Buku";
  $("#bookNumber").value = b.nomor;
  $("#nama").value = b.nama;
  $("#penulis").value = b.penulis;
  $("#genre").value = b.genre;
  $("#status").value = b.status;
  $("#halaman").value = b.halaman;
  $("#rating").value = b.rating;
  $("#sinopsis").value = b.sinopsis || "";
  $("#foto").value = b.foto || "";
  dialog.showModal();
}

function remove(nomor) {
  if (!confirm("Yakin ingin menghapus buku ini?")) return;
  state.books = state.books.filter((b) => b.nomor !== nomor);
  save();
  renderTable($("#searchInput").value);
}

/* Search */
$("#searchInput").addEventListener("input", (e) => {
  renderTable(e.target.value);
});

/* Init */
load();
renderTable();
