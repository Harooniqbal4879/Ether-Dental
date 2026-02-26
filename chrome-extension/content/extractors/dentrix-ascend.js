window.EtherAIExtractors = window.EtherAIExtractors || {};

window.EtherAIExtractors.dentrixAscend = {
  name: "Dentrix Ascend",

  detect() {
    const url = window.location.href.toLowerCase();
    if (url.includes("dentrixascend.com")) return true;
    if (document.querySelector('meta[name="application-name"][content*="Dentrix"]')) return true;
    if (document.title.toLowerCase().includes("dentrix ascend")) return true;
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
      source: "dentrix-ascend",
    };

    const patientHeader = document.querySelector(
      '.patient-header, .patient-name, [class*="patient-info"], [data-testid*="patient"]'
    );
    if (patientHeader) {
      const nameText = patientHeader.textContent?.trim() || "";
      const nameParts = nameText.split(/[,\s]+/).filter(Boolean);
      if (nameParts.length >= 2) {
        if (nameText.includes(",")) {
          data.lastName = nameParts[0].replace(",", "");
          data.firstName = nameParts[1];
        } else {
          data.firstName = nameParts[0];
          data.lastName = nameParts[nameParts.length - 1];
        }
      }
    }

    const dobSelectors = [
      '[class*="birth"], [class*="dob"]',
      '[data-field="dateOfBirth"], [data-field="dob"]',
      'input[name*="birth" i], input[name*="dob" i]',
    ];
    for (const sel of dobSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        data.dateOfBirth = el.value || el.textContent?.trim() || "";
        if (data.dateOfBirth) break;
      }
    }

    const insuranceSection = document.querySelector(
      '.insurance-section, [class*="insurance"], [class*="coverage"]'
    );
    if (insuranceSection) {
      const memberEl = insuranceSection.querySelector(
        '[class*="member"], [class*="subscriber-id"], [data-field="memberId"]'
      );
      if (memberEl) data.memberId = memberEl.value || memberEl.textContent?.trim() || "";

      const payerEl = insuranceSection.querySelector(
        '[class*="payer"], [class*="carrier"], [class*="plan-name"]'
      );
      if (payerEl) data.payerName = payerEl.value || payerEl.textContent?.trim() || "";

      const subEl = insuranceSection.querySelector('[class*="subscriber-name"]');
      if (subEl) data.subscriberName = subEl.value || subEl.textContent?.trim() || "";
    }

    if (!data.firstName || !data.lastName) {
      const fallback = window.EtherAIExtractors.generic.extract();
      if (!data.firstName) data.firstName = fallback.firstName;
      if (!data.lastName) data.lastName = fallback.lastName;
      if (!data.dateOfBirth) data.dateOfBirth = fallback.dateOfBirth;
      if (!data.memberId) data.memberId = fallback.memberId;
      if (!data.payerName) data.payerName = fallback.payerName;
    }

    return data;
  },
};
