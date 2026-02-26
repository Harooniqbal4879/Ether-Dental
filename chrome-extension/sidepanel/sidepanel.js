document.addEventListener("DOMContentLoaded", () => {
  const views = {
    login: document.getElementById("view-login"),
    eligibility: document.getElementById("view-eligibility"),
    benefits: document.getElementById("view-benefits"),
    shifts: document.getElementById("view-shifts"),
    settings: document.getElementById("view-settings"),
  };

  const tabNav = document.getElementById("tab-nav");
  const btnLogout = document.getElementById("btn-logout");
  const btnSettings = document.getElementById("btn-settings");
  const tabs = document.querySelectorAll(".tab");

  let currentBenefits = null;
  let currentPatientName = "";
  let insuranceType = "dental";

  function showView(name) {
    Object.values(views).forEach((v) => v.classList.remove("active"));
    views[name]?.classList.add("active");
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  }

  async function checkAuth() {
    const { isLoggedIn, adminInfo } = await chrome.storage.local.get(["isLoggedIn", "adminInfo"]);
    if (isLoggedIn && adminInfo) {
      tabNav.style.display = "flex";
      btnLogout.style.display = "flex";
      showView("eligibility");
      loadPayers();
      checkDetectedPatient();
      loadShifts();
    } else {
      tabNav.style.display = "none";
      btnLogout.style.display = "none";
      showView("login");
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      showView(tab.dataset.tab);
      if (tab.dataset.tab === "shifts") loadShifts();
    });
  });

  btnSettings.addEventListener("click", () => {
    const isSettingsVisible = views.settings.classList.contains("active");
    if (isSettingsVisible) {
      checkAuth();
    } else {
      showView("settings");
      loadSettings();
    }
  });

  btnLogout.addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ type: "LOGOUT" });
    checkAuth();
  });

  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const btn = document.getElementById("btn-login");

    btn.disabled = true;
    btn.textContent = "Signing in...";
    loginError.style.display = "none";

    try {
      const result = await chrome.runtime.sendMessage({
        type: "LOGIN",
        email,
        password,
      });

      if (result.error) throw new Error(result.error);
      checkAuth();
    } catch (err) {
      loginError.textContent = err.message;
      loginError.style.display = "block";
    } finally {
      btn.disabled = false;
      btn.textContent = "Sign In";
    }
  });

  const toggleDental = document.getElementById("toggle-dental");
  const toggleMedical = document.getElementById("toggle-medical");

  toggleDental.addEventListener("click", () => {
    insuranceType = "dental";
    toggleDental.classList.add("active");
    toggleMedical.classList.remove("active");
    loadPayers();
  });

  toggleMedical.addEventListener("click", () => {
    insuranceType = "medical";
    toggleMedical.classList.add("active");
    toggleDental.classList.remove("active");
    loadPayers();
  });

  async function loadPayers() {
    const select = document.getElementById("elig-payer");
    select.innerHTML = '<option value="">Loading payers...</option>';

    try {
      const result = await chrome.runtime.sendMessage({
        type: "GET_PAYERS",
        payerType: insuranceType,
      });

      if (result.error) throw new Error(result.error);

      select.innerHTML = '<option value="">Select a payer...</option>';
      const payers = result.payers || result;
      if (Array.isArray(payers)) {
        payers.forEach((payer) => {
          const opt = document.createElement("option");
          opt.value = payer.payerId || payer.id;
          opt.textContent = payer.name;
          opt.dataset.payerName = payer.name;
          select.appendChild(opt);
        });
      }
    } catch {
      select.innerHTML = '<option value="">Failed to load payers</option>';
    }
  }

  async function checkDetectedPatient() {
    try {
      const result = await chrome.runtime.sendMessage({ type: "GET_DETECTED_PATIENT" });
      const banner = document.getElementById("detected-banner");

      if (result && (result.firstName || result.lastName)) {
        document.getElementById("detected-sor").textContent = result.detectedSystem || "PMS";
        banner.style.display = "flex";

        document.getElementById("btn-use-detected").onclick = () => {
          if (result.firstName) document.getElementById("elig-first-name").value = result.firstName;
          if (result.lastName) document.getElementById("elig-last-name").value = result.lastName;
          if (result.dateOfBirth) document.getElementById("elig-dob").value = result.dateOfBirth;
          if (result.memberId) document.getElementById("elig-member-id").value = result.memberId;
          banner.style.display = "none";
          chrome.runtime.sendMessage({ type: "CLEAR_DETECTED_PATIENT" });
        };
      } else {
        banner.style.display = "none";
      }
    } catch {
      document.getElementById("detected-banner").style.display = "none";
    }
  }

  const eligForm = document.getElementById("eligibility-form");
  const eligError = document.getElementById("eligibility-error");
  const eligResult = document.getElementById("eligibility-result");

  eligForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btn-check-eligibility");
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> Verifying...';
    eligError.style.display = "none";
    eligResult.style.display = "none";

    const payerSelect = document.getElementById("elig-payer");
    const selectedOption = payerSelect.options[payerSelect.selectedIndex];

    const data = {
      firstName: document.getElementById("elig-first-name").value,
      lastName: document.getElementById("elig-last-name").value,
      dateOfBirth: document.getElementById("elig-dob").value,
      memberId: document.getElementById("elig-member-id").value,
      payerId: payerSelect.value,
      payerName: selectedOption?.dataset?.payerName || selectedOption?.textContent || "",
      insuranceType,
    };

    currentPatientName = `${data.firstName} ${data.lastName}`;

    try {
      const result = await chrome.runtime.sendMessage({
        type: "CHECK_ELIGIBILITY",
        data,
      });

      if (result.error) throw new Error(result.error);
      displayEligibilityResult(result);
    } catch (err) {
      eligError.textContent = err.message;
      eligError.style.display = "block";
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg> Verify Eligibility`;
    }
  });

  function displayEligibilityResult(result) {
    eligResult.style.display = "block";

    const status = document.getElementById("result-status");
    const verification = result.verification || {};
    const coverageStatus = verification.coverageStatus || result.coverage?.status || "unknown";

    status.className = `result-status ${coverageStatus}`;
    status.textContent = coverageStatus === "active" ? "Active" : coverageStatus === "inactive" ? "Inactive" : "Unknown";

    document.getElementById("result-date").textContent = new Date().toLocaleDateString();

    const details = document.getElementById("result-details");
    const rows = [];

    if (verification.planDescription || result.coverage?.planName) {
      rows.push({ label: "Plan", value: verification.planDescription || result.coverage.planName });
    }
    if (verification.effectiveDate) {
      rows.push({ label: "Effective", value: new Date(verification.effectiveDate).toLocaleDateString() });
    }
    if (verification.terminationDate) {
      rows.push({ label: "Terminates", value: new Date(verification.terminationDate).toLocaleDateString() });
    }

    details.innerHTML = rows
      .map((r) => `<div class="result-row"><span class="result-label">${r.label}</span><span class="result-value">${r.value}</span></div>`)
      .join("");

    const benefits = result.benefits || [];
    if (benefits.length > 0) {
      currentBenefits = benefits;
      const btnBenefits = document.getElementById("btn-view-benefits");
      btnBenefits.style.display = "block";
      btnBenefits.onclick = () => {
        showView("benefits");
        tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === "benefits"));
        displayBenefits(benefits);
      };
    }
  }

  async function displayBenefits(benefits) {
    const container = document.getElementById("benefits-content");
    container.innerHTML = '<div class="loading" style="display:flex;"><div class="spinner"></div><span>Generating AI summary...</span></div>';

    try {
      const result = await chrome.runtime.sendMessage({
        type: "SUMMARIZE_BENEFITS",
        benefits,
        patientName: currentPatientName,
      });

      if (result.error) throw new Error(result.error);

      let html = '<div class="benefits-summary">';
      html += '<h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 110 20 10 10 0 010-20z"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg> AI Benefits Summary</h3>';
      html += `<div class="benefits-text">${result.summary || "No summary available"}</div>`;
      html += "</div>";

      html += '<details class="benefits-raw"><summary>View Raw Benefits Data</summary>';
      html += '<table class="benefits-table"><thead><tr><th>Type</th><th>Amount</th><th>Network</th></tr></thead><tbody>';
      benefits.forEach((b) => {
        const type = b.benefitType || b.serviceTypeName || b.type || "N/A";
        const amount = b.amount || b.percent || b.coinsurancePercent || b.copayAmount || "N/A";
        const network = b.inNetwork ? "In-Network" : b.network || "N/A";
        html += `<tr><td>${type}</td><td>${amount}</td><td>${network}</td></tr>`;
      });
      html += "</tbody></table></details>";

      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = `<div class="error-msg">${err.message}</div>`;
    }
  }

  async function loadShifts() {
    const container = document.getElementById("shifts-list");
    const loading = container.previousElementSibling;
    loading.style.display = "flex";
    container.innerHTML = "";

    try {
      const result = await chrome.runtime.sendMessage({ type: "GET_OPEN_SHIFTS" });
      loading.style.display = "none";

      if (result.error) throw new Error(result.error);

      const shifts = result.shifts || [];
      const count = result.openShifts || shifts.length;

      let html = `<div class="shift-count-badge">${count} Open Shift${count !== 1 ? "s" : ""}</div>`;

      if (shifts.length === 0) {
        html += '<div class="empty-state"><p>No open shifts at this time</p></div>';
      } else {
        shifts.forEach((shift) => {
          const date = shift.date ? new Date(shift.date).toLocaleDateString() : "TBD";
          html += `
            <div class="shift-card">
              <div class="shift-role">${shift.role || shift.requiredRole || "Staff"}</div>
              <div class="shift-meta">
                <span>${date} ${shift.startTime || ""} - ${shift.endTime || ""}</span>
                <span>${shift.locationName || shift.location || ""}</span>
                <span>$${shift.hourlyRate || shift.rate || "N/A"}/hr</span>
              </div>
            </div>
          `;
        });
      }

      container.innerHTML = html;
    } catch (err) {
      loading.style.display = "none";
      container.innerHTML = `<div class="error-msg">${err.message}</div>`;
    }
  }

  async function loadSettings() {
    const { apiUrl } = await chrome.storage.local.get("apiUrl");
    document.getElementById("settings-api-url").value = apiUrl || "";

    try {
      const result = await chrome.runtime.sendMessage({ type: "CHECK_STATUS" });
      const statusEl = document.getElementById("connection-status");
      if (result.error) {
        statusEl.innerHTML = '<span class="status-dot disconnected"></span><span>Disconnected</span>';
      } else {
        statusEl.innerHTML = '<span class="status-dot connected"></span><span>Connected</span>';
      }
    } catch {
      document.getElementById("connection-status").innerHTML =
        '<span class="status-dot disconnected"></span><span>Disconnected</span>';
    }
  }

  const settingsForm = document.getElementById("settings-form");
  settingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const url = document.getElementById("settings-api-url").value.replace(/\/$/, "");
    await chrome.storage.local.set({ apiUrl: url });

    const status = document.getElementById("settings-status");
    status.textContent = "Settings saved successfully";
    status.style.display = "block";
    setTimeout(() => (status.style.display = "none"), 3000);

    loadSettings();
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.detectedPatient) {
      checkDetectedPatient();
    }
  });

  checkAuth();
});
