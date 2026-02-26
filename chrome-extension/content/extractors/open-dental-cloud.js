window.EtherAIExtractors = window.EtherAIExtractors || {};

window.EtherAIExtractors.openDentalCloud = {
  name: "Open Dental Cloud",

  detect() {
    const url = window.location.href.toLowerCase();
    if (url.includes("opendental.com") || url.includes("opendentalcloud")) return true;
    if (document.title.toLowerCase().includes("open dental")) return true;
    if (document.querySelector('[class*="od-"], [id*="od-"]')) return true;
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
      source: "open-dental-cloud",
    };

    const patientArea = document.querySelector(
      '[class*="patient-select"], [class*="PatientInfo"], [class*="patInfo"]'
    );
    if (patientArea) {
      const nameEl = patientArea.querySelector('[class*="name"], h2, h3');
      if (nameEl) {
        const text = nameEl.textContent?.trim() || "";
        const parts = text.split(/[,\s]+/).filter(Boolean);
        if (parts.length >= 2) {
          if (text.includes(",")) {
            data.lastName = parts[0].replace(",", "");
            data.firstName = parts[1];
          } else {
            data.firstName = parts[0];
            data.lastName = parts[parts.length - 1];
          }
        }
      }

      const dobEl = patientArea.querySelector('[class*="birth"], [class*="dob"]');
      if (dobEl) data.dateOfBirth = dobEl.textContent?.trim() || "";
    }

    const insPanel = document.querySelector(
      '[class*="insPlan"], [class*="insurance"], [class*="InsPlan"]'
    );
    if (insPanel) {
      const subEl = insPanel.querySelector('[class*="subscriberId"], [class*="member"]');
      if (subEl) data.memberId = subEl.value || subEl.textContent?.trim() || "";

      const carrierEl = insPanel.querySelector('[class*="carrier"], [class*="CarrierName"]');
      if (carrierEl) data.payerName = carrierEl.value || carrierEl.textContent?.trim() || "";
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
