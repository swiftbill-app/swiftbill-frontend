document.addEventListener("DOMContentLoaded", () => {
  // Navigation Tabs & Sections
  const tabLoginBtn = document.getElementById("tabLoginBtn");
  const tabRegisterBtn = document.getElementById("tabRegisterBtn");

  const loginSection = document.getElementById("loginSection");
  const registerSection = document.getElementById("registerSection");
  const submittedSection = document.getElementById("submittedSection");
  const authAlert = document.getElementById("authAlert");
  const backToLoginBtn = document.getElementById("backToLoginBtn");

  // Admin Modal Elements
  const adminToggleBtn = document.getElementById("adminToggleBtn");
  const adminModal = document.getElementById("adminModal");
  const closeAdminModalBtn = document.getElementById("closeAdminModalBtn");
  const adminLoginForm = document.getElementById("adminLoginForm");

  const numericInput = document.getElementById("regPhone");

  // Forgot Password Elements
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  const forgotPasswordModal = document.getElementById("forgotPasswordModal");
  const closeForgotModalBtn = document.getElementById("closeForgotModalBtn");
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");

  if (forgotPasswordLink && forgotPasswordModal) {
    forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault();
      forgotPasswordModal.classList.remove("hidden");
    });
  }

  if (closeForgotModalBtn && forgotPasswordModal) {
    closeForgotModalBtn.addEventListener("click", () => {
      forgotPasswordModal.classList.add("hidden");
    });
  }

  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const identifier = document.getElementById("forgotIdentifier").value.trim();
      const method = document.querySelector('input[name="resetMethod"]:checked').value;

      try {
        const response = await apiRequest("/auth/forgot-password", "POST", {
          identifier: identifier,
          method: method
        });

        forgotPasswordModal.classList.add("hidden");
        showAlert(response.message, false);
      } catch (err) {
        showAlert(err.message || "Failed to request password reset.", true);
      }
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
  
  // Helper Methods for Banners
  function showAlert(message, isError = true) {
    if (!authAlert) return;
    authAlert.textContent = message;
    authAlert.className = `mb-4 ${isError ? "alert-error" : "alert-success"}`;
    authAlert.classList.remove("hidden");
  }

  function clearAlert() {
    if (!authAlert) return;
    authAlert.classList.add("hidden");
    authAlert.textContent = "";
  }

  // Native CSS Active Tab Toggling
  function showLoginTab() {
    clearAlert();
    loginSection.classList.remove("hidden");
    registerSection.classList.add("hidden");
    if (submittedSection) submittedSection.classList.add("hidden");

    tabLoginBtn.classList.add("active");
    tabRegisterBtn.classList.remove("active");
  }

  function showRegisterTab() {
    clearAlert();
    registerSection.classList.remove("hidden");
    loginSection.classList.add("hidden");
    if (submittedSection) submittedSection.classList.add("hidden");

    tabRegisterBtn.classList.add("active");
    tabLoginBtn.classList.remove("active");
  }

  tabLoginBtn.addEventListener("click", showLoginTab);
  tabRegisterBtn.addEventListener("click", showRegisterTab);
  
  if (backToLoginBtn) {
    backToLoginBtn.addEventListener("click", showLoginTab);
  }

  // Login Form Submission
  const loginForm = document.getElementById("loginForm");
  const usernameInput = document.getElementById("loginUsername");
  const rememberMeCheckbox = document.getElementById("rememberMe")

  const savedUsername = localStorage.getItem("remembered_username");
  if (savedUsername && usernameInput && rememberMeCheckbox) {
    usernameInput.value = savedUsername;
    rememberMeCheckbox.checked = true;
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAlert();
      
      const username = document.getElementById("loginUsername").value.trim();
      const password = document.getElementById("loginPassword").value;
      const rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : false;

      const payload = {
        username: username,
        password: password
      };

      try {
        const response = await apiRequest("/auth/login", "POST", payload);

        // if (rememberMe) {
          localStorage.setItem("remembered_username", username); 
          localStorage.setItem("authToken", response.access_token);
          localStorage.setItem("username", response.username);
        // } else {
          // localStorage.removeItem("remembered_username");
          // localStorage.removeItem("authToken");
          // localStorage.removeItem("username");

          sessionStorage.setItem("authToken", response.access_token);
          sessionStorage.setItem("username", response.username);
        // }
        
        window.location.href = "client-dashboard.html";
      } catch (err) {
        showAlert(err.message || "Invalid credentials. Please try again.", true);
      }
    });
  }
  
  // Registration Form Submission
  const registerForm = document.getElementById("registerForm");
  
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAlert();
            
      const fullName = document.getElementById("regFullName").value.trim();
      const username = document.getElementById("regUsername").value.trim();
      const rawPhone = document.getElementById("regPhone").value.replace(/\s+/g, "")
      const email = document.getElementById("regEmail").value.trim();
      const password = document.getElementById("regPassword").value;
      const confirmPassword = document.getElementById("regConfirmPassword").value;

      if (password !== confirmPassword) {
        showAlert("Passwords do not match.", true);
        return;
      }

      // Payload aligned with FastAPI UserCreate schema
      const payload = {
        full_name: fullName,
        username: username,
        phone_number: rawPhone,
        password: password
      };

      if (email !== "") {
        payload.email = email;
      }

      try {
        await apiRequest("/auth/register", "POST", payload);

        // Clear form and display submitted confirmation section
        registerForm.reset();
        if (registerSection) {
          registerSection.classList.add("hidden");
        }

        if (submittedSection) {
          submittedSection.classList.remove("hidden");
          submittedSection.style.display = "block";
        } else {
          showAlert("Account submitted successfully! Pending admin approval.", false);
        }
      } catch (err) {
        showAlert(err.message || "Registration failed. Please check your inputs.", true);
      }

      return false;
    });
  }

  // Admin Modal Handlers
  if (adminToggleBtn && adminModal) {
    adminToggleBtn.addEventListener("click", () => adminModal.classList.remove("hidden"));
  }

  if (closeAdminModalBtn && adminModal) {
    closeAdminModalBtn.addEventListener("click", () => adminModal.classList.add("hidden"));
  }

  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAlert();

      const passcode = document.getElementById("adminPasscode").value;

      try {
        const response = await apiRequest("/auth/admin-login", "POST", { passcode });
        localStorage.setItem("adminToken", response.access_token);
        window.location.href = "admin-dashboard.html";
      } catch (err) {
        showAlert(err.message || "Invalid admin passcode.", true);
      }
    });
  }
});