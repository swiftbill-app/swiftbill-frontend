document.addEventListener("DOMContentLoaded", async () => {
  const authToken = localStorage.getItem("authToken");

  // Redirect to auth page if no client token is present
  if (!authToken) {
    window.location.href = "auth.html";
    return;
  }

  const username = localStorage.getItem("username") || "Client";

  const clientNameEl = document.getElementById("clientName");
  const clientUsernameEl = document.getElementById("clientUsername");
  const userAvatarEl = document.getElementById("userAvatar");
  const walletBalanceEl = document.getElementById("walletBalance");
  const transactionTableBody = document.getElementById("transactionTable");
  const logoutBtn = document.getElementById("logoutBtn");

  // Populate identity — full_name isn't returned by /auth/login, so we
  // display username here. If you want the real full name shown, add a
  // GET /api/v1/auth/me endpoint that returns UserResponse and call it
  // here instead.
  if (clientNameEl) clientNameEl.textContent = username;
  if (clientUsernameEl) clientUsernameEl.textContent = `@${username}`;
  if (userAvatarEl) userAvatarEl.textContent = username.charAt(0).toUpperCase();

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => logoutUser());
  }

  async function loadBalance() {
    try {
      const wallet = await apiRequest("/wallet/balance", "GET");
      if (walletBalanceEl) {
        walletBalanceEl.textContent = `₵${parseFloat(wallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      }
    } catch (err) {
      console.error("Failed to load balance:", err.message);
    }
  }

  async function loadTransactions() {
    try {
      const transactions = await apiRequest("/wallet/transactions", "GET");
      renderTransactions(transactions);
    } catch (err) {
      console.error("Failed to load transactions:", err.message);
    }
  }

  function renderTransactions(transactions) {
    if (!transactionTableBody) return;

    if (!transactions || transactions.length === 0) {
      transactionTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center" style="padding: 1.5rem; color: var(--text-muted);">
            No transactions found.
          </td>
        </tr>
      `;
      return;
    }

    transactionTableBody.innerHTML = transactions.map(tx => `
      <tr>
        <td>${escapeHtml(tx.type)}</td>
        <td>${escapeHtml(tx.category)}</td>
        <td>₵${parseFloat(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td><span class="${getStatusBadgeClass(tx.status)}">${escapeHtml(tx.status)}</span></td>
        <td class="text-gray-400" style="font-size: 11px;">${new Date(tx.created_at).toLocaleDateString()}</td>
      </tr>
    `).join('');
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case "SUCCESS":
        return "badge badge-success";
      case "PENDING":
        return "badge badge-pending";
      case "FAILED":
        return "badge badge-rejected";
      default:
        return "badge badge-pending";
    }
  }

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

  // ---- Pay Bill modal wiring ----
  const payBillBtn = document.getElementById("payBillBtn");
  const payBillModal = document.getElementById("payBillModal");
  const closePayBillBtn = document.getElementById("closePayBillBtn");
  const payBillForm = document.getElementById("payBillForm");
  const payBillError = document.getElementById("payBillError");

  if (payBillBtn && payBillModal) {
    payBillBtn.addEventListener("click", () => {
      payBillModal.classList.remove("hidden");
      if (payBillError) payBillError.classList.add("hidden");
    });
  }

  if (closePayBillBtn && payBillModal) {
    closePayBillBtn.addEventListener("click", () => {
      payBillModal.classList.add("hidden");
    });
  }

  if (payBillForm) {
    payBillForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (payBillError) payBillError.classList.add("hidden");

      const category = document.getElementById("billCategory").value;
      const account_reference = document.getElementById("billAccountRef").value.trim();
      const amount = parseFloat(document.getElementById("billAmount").value);

      try {
        await apiRequest("/wallet/pay-bill", "POST", { category, account_reference, amount });
        payBillModal.classList.add("hidden");
        payBillForm.reset();
        alert("Bill payment successful!");
        await Promise.all([loadBalance(), loadTransactions()]);
      } catch (err) {
        if (payBillError) {
          payBillError.textContent = err.message || "Payment failed. Please try again.";
          payBillError.classList.remove("hidden");
        } else {
          alert(`Payment failed: ${err.message}`);
        }
      }
    });
  }

  // Refresh balance/transactions after a deposit closes the modal on
  // success (client.js reloads the page on success, which re-runs this
  // whole script — so no extra wiring needed there).
  await Promise.all([loadBalance(), loadTransactions()]);
});