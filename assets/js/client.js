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

  const numericInput = document.getElementById("depositPhone");
  const rawPhone = document.getElementById("regPhone").value.replace(/\s+/g, "")

  const userMenuBtn = document.getElementById("userMenuBtn");
  const userDropdown = document.getElementById("userDropdown");
  const openProfileModalBtn = document.getElementById("openProfileModalBtn");
  const closeProfileModalBtn = document.getElementById("closeProfileModalBtn");
  const cancelProfileBtn = document.getElementById("cancelProfileBtn");
  const profileModal = document.getElementById("profileModal");
  const profileForm = document.getElementById("profileForm");
  const logoutBtn = document.getElementById("logoutBtn");

  if (userMenuBtn && userDropdown) {
        // Click trigger to toggle menu
        userMenuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle("hidden");
        });

        // Prevent clicks inside the dropdown from closing it immediately
        userDropdown.addEventListener("click", (e) => {
            e.stopPropagation();
        });

        // Click anywhere outside to close menu
        document.addEventListener("click", () => {
            userDropdown.classList.add("hidden");
        });
    }

  // Modal Handlers
  const openModal = () => {
    userDropdown.classList.add("hidden");
    profileModal.classList.remove("hidden");
  };

  const closeModal = () => {
    profileModal.classList.add("hidden");
  };

  openProfileModalBtn?.addEventListener("click", openModal);
  closeProfileModalBtn?.addEventListener("click", closeModal);
  cancelProfileBtn?.addEventListener("click", closeModal);

  // Profile Form Submit
  profileForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = document.getElementById("editFullName").value;
    const phone = document.getElementById("editPhone").value;

    try {
      await apiRequest("/auth/profile", "PUT", { full_name: fullName, phone_number: phone });
      alert("Profile updated successfully!");
      closeModal();
      location.reload();
    } catch (err) {
      alert(err.message || "Failed to update profile.");
    }
  });

  // Logout Handler
  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("adminToken");
    window.location.href = "/login";
  });

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

  if (numericInput) {
    numericInput.addEventListener("input", (e) => {
      let rawDigits = e.target.value.replace(/\D/g, "")
      
      if (rawDigits.length > 10) {
        rawDigits = rawDigits.substring(0, 10);
      }
      
      let formatted = "";
      if (rawDigits.length > 0) {
        formatted = rawDigits.substring(0, 3);
      }
      if (rawDigits.length > 3) {
        formatted += " " + rawDigits.substring(3, 6);
      }
      if (rawDigits.length > 6) {
        formatted += " " + rawDigits.substring(6, 10);
      }
      
      e.target.value = formatted;
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
      // Fixed: backend's DepositRequest schema expects payment_method phone_number, not method / phone 
      pendingDepositData = { amount, phone_number: rawPhone, payment_method: method };

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