document.addEventListener('DOMContentLoaded', () => {
  const titleInput = document.getElementById('siteTitle');
  const urlInput = document.getElementById('siteUrl');
  const categorySelect = document.getElementById('siteCategory');
  const saveBtn = document.getElementById('saveBtn');
  const container = document.getElementById('categoriesContainer');

  // 1. Auto-fill current active browser tab details into the inputs
  if (chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        titleInput.value = tabs[0].title || '';
        urlInput.value = tabs[0].url || '';
      }
    });
  }

  // 2. Load existing bookmarks from chrome.storage
  loadBookmarks();

  // 3. Save new bookmark
  saveBtn.addEventListener('click', () => {
    const title = titleInput.value.trim();
    const url = urlInput.value.trim();
    const category = categorySelect.value;

    if (!title || !url) return;

    chrome.storage.local.get({ bookmarks: [] }, (data) => {
      const updatedBookmarks = [...data.bookmarks, { id: Date.now().toString(), title, url, category }];
      chrome.storage.local.set({ bookmarks: updatedBookmarks }, () => {
        loadBookmarks();
      });
    });
  });

  // 4. Render categories & links
  function loadBookmarks() {
    chrome.storage.local.get({ bookmarks: [] }, (data) => {
      container.innerHTML = '';

      if (data.bookmarks.length === 0) {
        container.innerHTML = `<div class="empty-msg">No saved websites yet. Click Save above!</div>`;
        return;
      }

      // Group bookmarks by category
      const grouped = {};
      data.bookmarks.forEach(b => {
        if (!grouped[b.category]) grouped[b.category] = [];
        grouped[b.category].push(b);
      });

      // Render grouped lists
      for (const [category, items] of Object.entries(grouped)) {
        const catDiv = document.createElement('div');
        catDiv.className = 'category-group';

        catDiv.innerHTML = `
          <div class="category-title">📁 ${category}</div>
          <ul class="site-list">
            ${items.map(item => `
              <li class="site-item">
                <a href="${item.url}" target="_blank" class="site-link" title="${item.url}">${item.title}</a>
                <button class="delete-btn" data-id="${item.id}">✕</button>
              </li>
            `).join('')}
          </ul>
        `;

        container.appendChild(catDiv);
      }

      // Attach delete action listeners
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idToDelete = e.target.getAttribute('data-id');
          deleteBookmark(idToDelete);
        });
      });
    });
  }

  // 5. Delete bookmark
  function deleteBookmark(id) {
    chrome.storage.local.get({ bookmarks: [] }, (data) => {
      const filtered = data.bookmarks.filter(b => b.id !== id);
      chrome.storage.local.set({ bookmarks: filtered }, () => {
        loadBookmarks();
      });
    });
  }
});