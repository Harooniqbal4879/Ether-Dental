(function () {
  const extractors = window.EtherAIExtractors || {};

  const sorSystems = [
    extractors.dentrixAscend,
    extractors.curveDental,
    extractors.openDentalCloud,
    extractors.tab32,
    extractors.oryx,
  ].filter(Boolean);

  let detectedSOR = null;
  let lastExtractedData = null;

  function detectSOR() {
    for (const extractor of sorSystems) {
      if (extractor.detect()) {
        return extractor;
      }
    }
    return null;
  }

  function extractPatientData() {
    const extractor = detectedSOR || extractors.generic;
    if (!extractor) return null;

    try {
      const data = extractor.extract();
      const hasData = data.firstName || data.lastName || data.memberId;
      if (hasData) {
        return {
          ...data,
          detectedSystem: extractor.name,
          extractedAt: new Date().toISOString(),
          pageUrl: window.location.href,
        };
      }
    } catch (err) {
      console.warn("[EtherAI] Extraction error:", err);
    }
    return null;
  }

  function sendPatientData(data) {
    if (!data) return;

    const dataStr = JSON.stringify(data);
    if (dataStr === JSON.stringify(lastExtractedData)) return;

    lastExtractedData = data;
    chrome.runtime.sendMessage({
      type: "PATIENT_DETECTED",
      data: data,
    });
  }

  function init() {
    detectedSOR = detectSOR();

    if (detectedSOR) {
      console.log(`[EtherAI] Detected SOR: ${detectedSOR.name}`);
      const data = extractPatientData();
      if (data) sendPatientData(data);

      const observer = new MutationObserver(() => {
        clearTimeout(observer._debounce);
        observer._debounce = setTimeout(() => {
          const newData = extractPatientData();
          if (newData) sendPatientData(newData);
        }, 1000);
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "EXTRACT_PATIENT") {
      const data = extractPatientData();
      sendResponse(data);
    }
    if (message.type === "GET_DETECTED_SOR") {
      sendResponse({
        detected: !!detectedSOR,
        name: detectedSOR?.name || null,
      });
    }
    return true;
  });

  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init);
  }
})();
