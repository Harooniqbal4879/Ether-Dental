window.EtherAIExtractors = window.EtherAIExtractors || {};

window.EtherAIExtractors.generic = {
  name: "Generic Dental PMS",

  detect() {
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
      source: "generic",
    };

    const namePatterns = [
      { selector: '[name*="first" i], [id*="first" i], [placeholder*="first" i]', field: "firstName" },
      { selector: '[name*="last" i], [id*="last" i], [placeholder*="last" i]', field: "lastName" },
      { selector: '[name*="dob" i], [name*="birth" i], [id*="dob" i], [id*="birth" i], [type="date"]', field: "dateOfBirth" },
      { selector: '[name*="member" i], [name*="subscriber" i], [id*="member" i], [id*="subscriber" i]', field: "memberId" },
      { selector: '[name*="payer" i], [name*="carrier" i], [name*="insurance" i], [id*="payer" i]', field: "payerName" },
    ];

    for (const pattern of namePatterns) {
      const el = document.querySelector(pattern.selector);
      if (el) {
        data[pattern.field] = el.value || el.textContent?.trim() || "";
      }
    }

    const labels = document.querySelectorAll("label, .label, [class*='label']");
    for (const label of labels) {
      const text = label.textContent?.toLowerCase().trim() || "";
      const nextInput = label.nextElementSibling;
      const forEl = label.htmlFor ? document.getElementById(label.htmlFor) : null;
      const target = forEl || nextInput;

      if (!target) continue;
      const value = target.value || target.textContent?.trim() || "";
      if (!value) continue;

      if (text.includes("first name") && !data.firstName) data.firstName = value;
      if (text.includes("last name") && !data.lastName) data.lastName = value;
      if ((text.includes("date of birth") || text.includes("dob") || text.includes("birthdate")) && !data.dateOfBirth) data.dateOfBirth = value;
      if ((text.includes("member id") || text.includes("subscriber id") || text.includes("policy")) && !data.memberId) data.memberId = value;
      if ((text.includes("insurance") || text.includes("carrier") || text.includes("payer")) && !data.payerName) data.payerName = value;
    }

    return data;
  },
};
