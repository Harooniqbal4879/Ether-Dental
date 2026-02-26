window.EtherAIExtractors = window.EtherAIExtractors || {};

window.EtherAIExtractors.oryx = {
  name: "Oryx Dental",

  detect() {
    const url = window.location.href.toLowerCase();
    if (url.includes("oryxdental.com") || url.includes("oryx.dental")) return true;
    if (document.title.toLowerCase().includes("oryx")) return true;
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
      source: "oryx",
    };

    const patientArea = document.querySelector(
      '[class*="patient"], [class*="chartHeader"], [class*="profile-header"]'
    );
    if (patientArea) {
      const nameEl = patientArea.querySelector('[class*="name"], h1, h2, h3, [class*="title"]');
      if (nameEl) {
        const text = nameEl.textContent?.trim() || "";
        const parts = text.split(/[,\s]+/).filter(Boolean);
        if (parts.length >= 2) {
          data.firstName = parts[0];
          data.lastName = parts[parts.length - 1];
        }
      }

      const dobEl = patientArea.querySelector('[class*="dob"], [class*="birth"], [class*="date"]');
      if (dobEl) data.dateOfBirth = dobEl.textContent?.trim() || "";
    }

    const insArea = document.querySelector(
      '[class*="insurance"], [class*="coverage"], [class*="benefits"]'
    );
    if (insArea) {
      const memberEl = insArea.querySelector('[class*="member"], [class*="policy"], [class*="subscriber"]');
      if (memberEl) data.memberId = memberEl.value || memberEl.textContent?.trim() || "";

      const payerEl = insArea.querySelector('[class*="carrier"], [class*="payer"], [class*="company"]');
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
