window.EtherAIExtractors = window.EtherAIExtractors || {};

window.EtherAIExtractors.tab32 = {
  name: "tab32",

  detect() {
    const url = window.location.href.toLowerCase();
    if (url.includes("tab32.com")) return true;
    if (document.title.toLowerCase().includes("tab32")) return true;
    return false;
  },

  extract() {
    const data = {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      memberId: "",
      payerName: "",
      subscriberName: "",
      source: "tab32",
    };

    const patientInfo = document.querySelector(
      '[class*="patient-info"], [class*="patientInfo"], [class*="patient-header"]'
    );
    if (patientInfo) {
      const nameEl = patientInfo.querySelector('[class*="name"], h1, h2, h3');
      if (nameEl) {
        const text = nameEl.textContent?.trim() || "";
        const parts = text.split(/[,\s]+/).filter(Boolean);
        if (parts.length >= 2) {
          data.firstName = parts[0];
          data.lastName = parts[parts.length - 1];
        }
      }

      const dobEl = patientInfo.querySelector('[class*="dob"], [class*="birth"]');
      if (dobEl) data.dateOfBirth = dobEl.textContent?.trim() || "";
    }

    const insSection = document.querySelector(
      '[class*="insurance"], [class*="coverage"], [class*="plan"]'
    );
    if (insSection) {
      const memberEl = insSection.querySelector('[class*="member"], [class*="subscriber"]');
      if (memberEl) data.memberId = memberEl.value || memberEl.textContent?.trim() || "";

      const payerEl = insSection.querySelector('[class*="payer"], [class*="carrier"]');
      if (payerEl) data.payerName = payerEl.value || payerEl.textContent?.trim() || "";
    }

    if (!data.firstName) {
      const fallback = window.EtherAIExtractors.generic.extract();
      Object.keys(data).forEach((key) => {
        if (!data[key] && fallback[key]) data[key] = fallback[key];
      });
    }

    return data;
  },
};
