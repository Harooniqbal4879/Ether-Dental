const DEFAULT_API_URL = "http://localhost:5000";

async function getApiUrl() {
  const { apiUrl } = await chrome.storage.local.get("apiUrl");
  return apiUrl || DEFAULT_API_URL;
}

async function getAuthToken() {
  const { authToken } = await chrome.storage.local.get("authToken");
  return authToken;
}

async function apiRequest(method, path, body = null) {
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

  const response = await fetch(`${apiUrl}${path}`, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

async function login(email, password) {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/api/extension/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

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
  return apiRequest("GET", "/api/extension/status");
}

async function updateBadge() {
  try {
    const { isLoggedIn } = await chrome.storage.local.get("isLoggedIn");
    if (!isLoggedIn) {
      chrome.action.setBadgeText({ text: "" });
      return;
    }

    const data = await getOpenShifts();
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
