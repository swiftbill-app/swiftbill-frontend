document.addEventListener("DOMContentLoaded", () => {
  const depositModal = document.getElementById("depositModal");
  // Fixed: HTML button is "topUpBtn", not "openDepositBtn" — this
  // mismatch meant clicking "Top Up" previously did nothing.
  const openDepositBtn = document.getElementById("topUpBtn");
  const closeDepositBtn = document.getElementById("closeDepositBtn");
  const depositForm = document.getElementById("depositForm");
  const depositError = document.getElementById("depositError");
  const depositConfirmView = document.getElementById("depositConfirmView");
  const backDepositBtn = document.getElementById("backDepositBtn");
  const executeDepositBtn = document.getElementById("executeDepositBtn");

  let pendingDepositData = null;

  if (openDepositBtn) {
    openDepositBtn.addEventListener("click", () => {
      depositModal.classList.remove("hidden");
      depositForm.classList.remove("hidden");
      depositConfirmView.classList.add("hidden");
      depositError.classList.add("hidden");
    });
  }

  if (closeDepositBtn) {
    closeDepositBtn.addEventListener("click", () => {
      depositModal.classList.add("hidden");
    });
  }

  if (depositForm) {
    depositForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const amount = parseFloat(document.getElementById("depositAmount").value);
      const phone = document.getElementById("depositPhone").value;
      const method = document.getElementById("depositMethod").value;

      // Validate Max Limit
      if (amount > 10000) {
        depositError.textContent = "The maximum per transaction is ₵10,000.00.";
        depositError.classList.remove("hidden");
        return;
      }

      depositError.classList.add("hidden");
      // Fixed: backend's DepositRequest schema expects payment_method /
      // phone_number, not method / phone — this was causing every
      // deposit to fail with a 422 validation error.
      pendingDepositData = { amount, phone_number: phone, payment_method: method };

      // Populate & Show Confirmation View
      document.getElementById("confirmMethod").textContent = method;
      document.getElementById("confirmPhone").textContent = phone;
      document.getElementById("confirmAmount").textContent = `₵${amount.toLocaleString('en-US', {minimumFractionDigits: 2})}`;

      depositForm.classList.add("hidden");
      depositConfirmView.classList.remove("hidden");
    });
  }

  if (backDepositBtn) {
    backDepositBtn.addEventListener("click", () => {
      depositConfirmView.classList.add("hidden");
      depositForm.classList.remove("hidden");
    });
  }

  if (executeDepositBtn) {
    executeDepositBtn.addEventListener("click", async () => {
      try {
        await apiRequest("/wallet/deposit", "POST", pendingDepositData);
        alert("Deposit successful!");
        depositModal.classList.add("hidden");
        location.reload();
      } catch (err) {
        alert(`Deposit failed: ${err.message}`);
      }
    });
  }
});