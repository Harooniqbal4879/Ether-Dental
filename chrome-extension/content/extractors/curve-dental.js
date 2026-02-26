window.EtherAIExtractors = window.EtherAIExtractors || {};

window.EtherAIExtractors.curveDental = {
  name: "Curve Dental",

  detect() {
    const url = window.location.href.toLowerCase();
    if (url.includes("curvedental.com")) return true;
    if (document.title.toLowerCase().includes("curve dental")) return true;
    if (document.querySelector('[class*="curve-"], [id*="curve-"]')) return true;
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
      source: "curve-dental",
    };

    const patientBanner = document.querySelector(
      '.patient-banner, [class*="patientBanner"], [class*="patient-detail"]'
    );
    if (patientBanner) {
      const nameEl = patientBanner.querySelector('h1, h2, [class*="name"]');
      if (nameEl) {
        const nameText = nameEl.textContent?.trim() || "";
        const parts = nameText.split(/[,\s]+/).filter(Boolean);
        if (parts.length >= 2) {
          data.firstName = parts[0];
          data.lastName = parts[parts.length - 1];
        }
      }

      const dobEl = patientBanner.querySelector('[class*="dob"], [class*="birth"]');
      if (dobEl) data.dateOfBirth = dobEl.textContent?.trim() || "";
    }

    const insSection = document.querySelector(
      '[class*="insurance"], [class*="coverage"], [class*="benefits"]'
    );
    if (insSection) {
      const memberEl = insSection.querySelector('[class*="member"], [class*="policy"]');
      if (memberEl) data.memberId = memberEl.value || memberEl.textContent?.trim() || "";

      const carrierEl = insSection.querySelector('[class*="carrier"], [class*="payer"]');
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
