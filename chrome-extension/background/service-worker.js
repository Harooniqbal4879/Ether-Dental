const DEFAULT_API_URL = "http://localhost:5000";

async function getApiUrl() {
  const { apiUrl } = await chrome.storage.local.get("apiUrl");
  return apiUrl || DEFAULT_API_URL;
}

async function getAuthToken() {
  const { authToken } = await chrome.storage.local.get("authToken");
  return authToken;
}

async function handleAuthError() {
  await chrome.storage.local.remove(["isLoggedIn", "adminInfo", "practiceInfo", "authToken"]);
  chrome.action.setBadgeText({ text: "!" });
  chrome.action.setBadgeBackgroundColor({ color: "#dc2626" });
  return { error: "Session expired. Please log in again.", authExpired: true };
}

async function apiRequest(method, path, body = null, retries = 1) {
  const apiUrl = await getApiUrl();
  const headers = { "Content-Type": "application/json" };

  const token = await getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = { method, headers };

  if (body) {
    options.body = JSON.stringify(body);
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${apiUrl}${path}`, options);

      if (response.status === 401) {
        return await handleAuthError();
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        if (attempt < retries && response.status >= 500) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        throw new Error(error.error || `Request failed: ${response.status}`);
      }
      return response.json();
    } catch (err) {
      if (attempt < retries && err.name === "TypeError") {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

async function login(email, password) {
  const apiUrl = await getApiUrl();

  let response;
  try {
    response = await fetch(`${apiUrl}/api/extension/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    throw new Error("Cannot connect to server. Check your API URL in Settings.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Login failed");
  }

  const data = await response.json();

  await chrome.storage.local.set({
    authToken: data.token,
    isLoggedIn: true,
    adminInfo: data.admin,
    practiceInfo: data.practice,
  });

  return data;
}

async function logout() {
  await chrome.storage.local.remove(["isLoggedIn", "adminInfo", "practiceInfo", "authToken"]);
  chrome.action.setBadgeText({ text: "" });
  return { success: true };
}

async function checkEligibility(patientData) {
  return apiRequest("POST", "/api/extension/eligibility/check", patientData);
}

async function summarizeBenefits(benefits, patientName) {
  return apiRequest("POST", "/api/extension/benefits/summarize", { benefits, patientName });
}

async function getOpenShifts() {
  return apiRequest("GET", "/api/extension/shifts/alerts");
}

async function getPayers(type) {
  const query = type ? `?type=${type}` : "";
  return apiRequest("GET", `/api/extension/payers${query}`);
}

async function checkStatus() {
  const apiUrl = await getApiUrl();
  try {
    const response = await fetch(`${apiUrl}/api/extension/status`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Server returned " + response.status);
    return await response.json();
  } catch (err) {
    throw new Error("Cannot connect: " + err.message);
  }
}

async function testConnection(url) {
  try {
    const response = await fetch(`${url}/api/extension/status`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Server returned " + response.status);
    const data = await response.json();
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function updateBadge() {
  try {
    const { isLoggedIn } = await chrome.storage.local.get("isLoggedIn");
    if (!isLoggedIn) {
      chrome.action.setBadgeText({ text: "" });
      return;
    }

    const data = await getOpenShifts();
    if (data.authExpired) return;

    const count = data.openShifts || 0;
    chrome.action.setBadgeText({ text: count > 0 ? String(count) : "" });
    chrome.action.setBadgeBackgroundColor({ color: "#0d9488" });
  } catch {
    chrome.action.setBadgeText({ text: "" });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  chrome.alarms.create("refreshShifts", { periodInMinutes: 5 });
  updateBadge();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "refreshShifts") {
    updateBadge();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = async () => {
    try {
      switch (message.type) {
        case "LOGIN":
          return await login(message.email, message.password);
        case "LOGOUT":
          return await logout();
        case "CHECK_ELIGIBILITY":
          return await checkEligibility(message.data);
        case "SUMMARIZE_BENEFITS":
          return await summarizeBenefits(message.benefits, message.patientName);
        case "GET_OPEN_SHIFTS":
          return await getOpenShifts();
        case "GET_PAYERS":
          return await getPayers(message.payerType);
        case "CHECK_STATUS":
          return await checkStatus();
        case "TEST_CONNECTION":
          return await testConnection(message.url);
        case "PATIENT_DETECTED":
          await chrome.storage.local.set({ detectedPatient: message.data });
          return { success: true };
        case "GET_DETECTED_PATIENT":
          const { detectedPatient } = await chrome.storage.local.get("detectedPatient");
          return detectedPatient || null;
        case "CLEAR_DETECTED_PATIENT":
          await chrome.storage.local.remove("detectedPatient");
          return { success: true };
        case "UPDATE_BADGE":
          await updateBadge();
          return { success: true };
        default:
          throw new Error(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      return { error: error.message };
    }
  };

  handler().then(sendResponse);
  return true;
});
