document.addEventListener("DOMContentLoaded", async () => {
  const adminToken = localStorage.getItem("adminToken");

  // Redirect to auth page if no admin token is present
  if (!adminToken) {
    window.location.href = "auth.html";
    return;
  }

  const adminLogoutBtn = document.getElementById("adminLogoutBtn");
  const userTableBody = document.getElementById("adminUserTable") || document.getElementById("usersTableBody");
  const filterButtons = document.querySelectorAll(".filter-btn");

  // Metrics elements
  const statPending = document.getElementById("statPending");
  const statApproved = document.getElementById("statApproved");
  const statRejected = document.getElementById("statRejected");
  const statTotal = document.getElementById("statTotal");

  // Modal & Action Triggers
  const statusModal = document.getElementById("statusModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalUserSelect = document.getElementById("modalUserSelect");
  const btnModalConfirm = document.getElementById("btnModalConfirm");
  const btnModalCancel = document.getElementById("btnModalCancel");

  const btnApproveTrigger = document.getElementById("btnApproveTrigger");
  const btnRejectTrigger = document.getElementById("btnRejectTrigger");

  let allUsers = [];
  let currentFilter = "ALL";
  let targetActionStatus = null; // Stores target status ('APPROVED', or 'REJECTED')

  // Handle Logout
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener("click", () => {
      if (typeof logoutUser === "function") {
        logoutUser();
      } else {
        localStorage.removeItem("adminToken");
        window.location.href = "auth.html";
      }
    });
  }

  // Filter Tab Wiring
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      currentFilter = (btn.dataset.filter || "ALL").toUpperCase();
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderUserTable();
    });
  });

  // Action Button Triggers -> Open Dialog
  if (btnApproveTrigger) {
    btnApproveTrigger.addEventListener("click", () => openActionModal("APPROVED", "Approve User Account"));
  }
  if (btnRejectTrigger) {
    btnRejectTrigger.addEventListener("click", () => openActionModal("REJECTED", "Reject User Account"));
  }

  // Modal Cancel / Close
  if (btnModalCancel) {
    btnModalCancel.addEventListener("click", closeModal);
  }

  // Modal Confirmation Handler with Response Error Parsing
  if (btnModalConfirm) {
    btnModalConfirm.addEventListener("click", async () => {
      const selectedUserId = modalUserSelect ? modalUserSelect.value : null;

      if (!selectedUserId) {
        alert("Please select a user account.");
        return;
      }

      try {
        await apiRequest(`/admin/users/${selectedUserId}/status`, "PATCH", { 
          status: targetActionStatus 
        });
        
        closeModal();
        await loadDashboardData();
      } catch (err) {
        let errorDetails = "An unexpected error occurred.";

        // Handle Response objects, FastAPI detail objects, or strings
        if (err instanceof Response) {
          try {
            const data = await err.json();
            errorDetails = data.detail || data.message || JSON.stringify(data);
          } catch {
            errorDetails = `HTTP Error ${err.status}: ${err.statusText}`;
          }
        } else if (typeof err === "object" && err !== null) {
          errorDetails = err.detail || err.message || err.error || JSON.stringify(err);
        } else if (typeof err === "string") {
          errorDetails = err;
        }

        alert(`Failed to update status: ${errorDetails}`);
      }
    });
  }

  function openActionModal(status, titleText) {
    if (!allUsers || allUsers.length === 0) {
      alert("No client user accounts available.");
      return;
    }

    targetActionStatus = status;
    if (modalTitle) modalTitle.textContent = titleText;

    // Populate dropdown (handles both user.id and MongoDB user._id)
    if (modalUserSelect) {
      modalUserSelect.innerHTML = allUsers.map(u => {
        const userId = u.id || u._id;
        return `
          <option value="${userId}">
            ${escapeHtml(u.full_name || u.username || 'N/A')} (@${escapeHtml(u.username)}) - Status: ${u.status || 'PENDING'}
          </option>
        `;
      }).join('');
    }

    if (statusModal) statusModal.style.display = "flex";
  }

  function closeModal() {
    targetActionStatus = null;
    if (statusModal) statusModal.style.display = "none";
  }

  // Load Dashboard Data
  async function loadDashboardData() {
    try {
      const response = await apiRequest("/admin/users", "GET");
      allUsers = response.users || response || [];
      updateMetrics();
      renderUserTable();
    } catch (err) {
      console.error("Failed to load admin data:", err.message || err);
    }
  }

  // Update Metric Counters
  function updateMetrics() {
    const pendingCount = allUsers.filter(u => (u.status || "").toUpperCase() === "PENDING").length;
    const approvedCount = allUsers.filter(u => (u.status || "").toUpperCase() === "APPROVED").length;
    const rejectedCount = allUsers.filter(u => (u.status || "").toUpperCase() === "REJECTED").length;

    if (statPending) statPending.textContent = pendingCount;
    if (statApproved) statApproved.textContent = approvedCount;
    if (statRejected) statRejected.textContent = rejectedCount;
    if (statTotal) statTotal.textContent = allUsers.length;
  }

  // Render Rows in Client Table
  function renderUserTable() {
    if (!userTableBody) return;

    const filteredUsers = allUsers.filter(user => {
      const userStatus = (user.status || "PENDING").toUpperCase();
      if (currentFilter === "ALL") return true;
      return userStatus === currentFilter;
    });

    if (filteredUsers.length === 0) {
      userTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-muted" style="text-align: center; padding: 1.5rem;">
            No accounts found for this filter.
          </td>
        </tr>
      `;
      return;
    }

    userTableBody.innerHTML = filteredUsers.map(user => `
      <tr>
        <td class="font-bold">${escapeHtml(user.full_name || 'N/A')}</td>
        <td class="text-muted">@${escapeHtml(user.username)}</td>
        <td class="text-muted">${escapeHtml(user.phone_number || 'N/A')}</td>
        <td class="font-bold">₵${parseFloat(user.balance || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
        <td>
          <span class="status-badge ${getStatusBadgeClass(user.status)}">${escapeHtml(user.status || 'PENDING')}</span>
        </td>
      </tr>
    `).join('');
  }

  // Badge Style Helper
  function getStatusBadgeClass(status) {
    const formattedStatus = (status || "").toUpperCase();
    switch (formattedStatus) {
      case "APPROVED":
        return "status-badge-approved";
      case "PENDING":
        return "status-badge-pending";
      case "REJECTED":
        return "status-badge-rejected";
      default:
        return "status-badge-pending";
    }
  }

  // Sanitize Output
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[m]);
  }

  // Initial Load
  await loadDashboardData();
});