// Ganti dengan URL Render Anda
const API_URL = "https://pirpir-diacheckv2.hf.space";

let currentStep = 1;
const totalSteps = 4;

document.addEventListener("DOMContentLoaded", () => {
  updateWizard();

  // Auto-remove error styling when user interacts with an input
  document.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("change", (e) => {
      const wrapper = e.target.closest(".option-card") || e.target;
      if (wrapper) {
        wrapper.classList.remove("input-error");
        e.target.style.borderColor = "";
      }
    });
  });

  // Enforce weight/height max constraints in JS for safety
  const w = document.getElementById("weight");
  const h = document.getElementById("height");
  if (w)
    w.addEventListener("input", () => {
      if (w.value !== "" && Number(w.value) > 150) {
        w.value = "150";
        w.style.borderColor = "#f59e0b";
      }
      // Update BMI display on weight change
      updateBMI();
    });
  if (h)
    h.addEventListener("input", () => {
      if (h.value !== "" && Number(h.value) > 300) {
        h.value = "300";
        h.style.borderColor = "#f59e0b";
      }
      // Update BMI display on height change
      updateBMI();
    });
  // Initial BMI calculation if values are present
  updateBMI();
});

// Calculate BMI and update the UI element `#bmi-display`
function updateBMI() {
  const wEl = document.getElementById("weight");
  const hEl = document.getElementById("height");
  const display = document.getElementById("bmi-display");
  if (!display) return;

  const weight = wEl && wEl.value !== "" ? Number(wEl.value) : null;
  const heightCm = hEl && hEl.value !== "" ? Number(hEl.value) : null;

  if (!weight || !heightCm || heightCm <= 0) {
    display.innerHTML = 'IMT: — (<span class="bmi-category">—</span>)';
    display.classList.remove(
      "bmi-underweight",
      "bmi-normal",
      "bmi-overweight",
      "bmi-obese"
    );
    return;
  }

  const heightM = heightCm / 100;
  const bmi = weight / (heightM * heightM);
  const bmiRounded = Math.round(bmi * 10) / 10; // one decimal

  let category = "—";
  let cls = "";
  if (bmi < 18.5) {
    category = "Kurus";
    cls = "bmi-underweight";
  } else if (bmi < 25) {
    category = "Normal";
    cls = "bmi-normal";
  } else if (bmi < 30) {
    category = "Gemuk";
    cls = "bmi-overweight";
  } else {
    category = "Obesitas";
    cls = "bmi-obese";
  }

  display.classList.remove(
    "bmi-underweight",
    "bmi-normal",
    "bmi-overweight",
    "bmi-obese"
  );
  if (cls) display.classList.add(cls);
  display.innerHTML = `IMT: <span class="bmi-value">${bmiRounded}</span> (<span class="bmi-category">${category}</span>)`;
}

window.changeStep = changeStep;

function updateWizard() {
  document.querySelectorAll(".step-slide").forEach((el, index) => {
    el.classList.remove("active");
    if (index + 1 === currentStep) el.classList.add("active");
  });

  // Start progress at 0% for step 1, gradually increase
  const percent = ((currentStep - 1) / totalSteps) * 100;
  const progressFill = document.getElementById("progress-fill");
  if (progressFill) progressFill.style.width = percent + "%";

  const stepNum = document.getElementById("step-num");
  if (stepNum) stepNum.innerText = Math.min(currentStep, totalSteps);

  const btnBack = document.getElementById("btn-back");
  if (btnBack) btnBack.disabled = currentStep === 1;

  const nextBtn = document.getElementById("btn-next");
  if (nextBtn) {
    if (currentStep === totalSteps) {
      nextBtn.innerHTML = "Lihat Hasil ⚡";
    } else {
      nextBtn.innerHTML = "Lanjut &rarr;";
    }
  }

  if (currentStep > totalSteps) {
    document.getElementById("wizard-footer").style.display = "none";
  }
}

function changeStep(dir) {
  // Validate ONLY when moving forward (dir === 1)
  if (dir === 1 && currentStep <= totalSteps) {
    const activeSlide = document.getElementById(`slide-${currentStep}`);

    // Find all required inputs (text, number, select)
    const inputs = activeSlide.querySelectorAll('input[type="number"], select');
    // Find all radio groups (by finding unique names)
    const radios = activeSlide.querySelectorAll('input[type="radio"]');
    const radioGroups = new Set();
    radios.forEach((r) => radioGroups.add(r.name));

    let allValid = true;

    // 1. Validate Standard Inputs
    inputs.forEach((inp) => {
      if (!inp.value || (inp.type === "number" && parseFloat(inp.value) <= 0)) {
        inp.style.borderColor = "#ef4444";
        allValid = false;
      } else {
        inp.style.borderColor = "#e2e8f0";
      }
    });

    // 2. Validate Radio Groups
    radioGroups.forEach((name) => {
      const isChecked = activeSlide.querySelector(
        `input[name="${name}"]:checked`
      );
      const options = activeSlide.querySelectorAll(`input[name="${name}"]`);

      if (!isChecked) {
        allValid = false;
        // Visual feedback for the whole group
        options.forEach((opt) => {
          const card = opt.closest(".option-card"); // Assuming your radios are in cards
          if (card) {
            const content = card.querySelector(".option-content");
            if (content) content.style.borderColor = "#ef4444";
          }
        });
      } else {
        options.forEach((opt) => {
          const card = opt.closest(".option-card");
          if (card) {
            const content = card.querySelector(".option-content");
            if (content) content.style.borderColor = ""; // Reset
          }
        });
      }
    });

    if (!allValid) {
      // Optional: Shake animation or toast message
      return;
    }
  }

  currentStep += dir;
  if (currentStep > totalSteps) calculateRisk();
  updateWizard();
}

async function calculateRisk() {
  // Get numeric value from inputs; return null if empty
  const getVal = (id) => {
    const v = document.getElementById(id)?.value;
    if (v === undefined || v === null || v === "") return null;
    const num = Number(v);
    return Number.isFinite(num) ? num : null;
  };
  // Get numeric value from radios; return null if not selected
  const getRadio = (name) => {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    if (!el) return null;
    const num = Number(el.value);
    return Number.isFinite(num) ? num : null;
  };

  const title = document.getElementById("res-title");
  const desc = document.getElementById("res-desc");
  const scoreDisplay = document.getElementById("res-score");

  title.innerText = "Menganalisis...";
  scoreDisplay.innerText = "...";

  const payload = {
    Sex: getRadio("Sex"),
    weight: getVal("weight"),
    height: getVal("height"),
    age: getVal("age"),
    Smoker: getRadio("Smoker"),
    PhysActivity: getRadio("PhysActivity"),
    HighBP: getRadio("HighBP"),
    HighChol: getRadio("HighChol"),
    HeartAttackOrStroke: getRadio("HeartAttackOrStroke"),
    DiffWalk: getRadio("DiffWalk"),
    GenHlth: getRadio("GenHlth"),
    Education: getVal("education"),
    Income: getVal("income"),
    NoDoc: getRadio("NoDoc"),
  };

  // Guard: if any required field is null, show error and stop
  const missingKeys = Object.entries(payload)
    .filter(([_, v]) => v === null)
    .map(([k]) => k);
  if (missingKeys.length) {
    title.innerText = "Data belum lengkap";
    title.style.color = "#f59e0b";
    desc.innerText = `Lengkapi: ${missingKeys.join(", ")}`;
    return;
  }

  // Optional debug: inspect payload being sent
  console.log("Payload to /predict:", payload);

  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log("Response from /predict:", result);
    if (result.error) throw new Error(result.error);

    // Normalize to 0-100
    let percent = result.risk_score;
    if (typeof percent === "number" && percent <= 1) {
      percent = percent * 100;
    }
    // Display mapping: keep low-mid ranges similar, add more separation above 70
    // This is UI-only; model output remains unchanged server-side.
    const p = Math.max(0, Math.min(100, percent));
    let mapped = p;
    if (p < 30) {
      mapped = p * 0.9; // slightly conservative below 30
    } else if (p < 70) {
      mapped = p; // keep mid-range as-is
    } else {
      mapped = 70 + (p - 70) * 1.5; // stretch high-end for clearer differentiation
    }
    mapped = Math.min(99, Math.round(mapped));
    const ring = document.getElementById("result-ring");

    // Animate the number counting up
    let start = 0;
    const duration = 1000;
    const startTime = performance.now();

    function animateScore(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out logic
      const currentVal = Math.floor(progress * mapped);
      scoreDisplay.innerText = currentVal + "%";

      if (progress < 1) {
        requestAnimationFrame(animateScore);
      } else {
        finalizeResult(mapped, ring, title, desc);
      }
    }
    requestAnimationFrame(animateScore);
  } catch (error) {
    console.error(error);
    title.innerText = "Gagal";
    title.style.color = "#ef4444";
    desc.innerText = "Koneksi ke server AI gagal. Coba lagi nanti.";
  }
}

function finalizeResult(percent, ring, title, desc) {
  let color = "#10b981"; // Green
  let riskLabel = "Risiko Rendah";
  let riskDesc = "Profil kesehatan Anda baik. Pertahankan pola hidup sehat!";
  let extraNote = "";

  // Adjusted bands to align with mapped display
  if (percent >= 35) {
    color = "#f59e0b"; // Amber
    riskLabel = "Risiko Sedang";
    riskDesc =
      "Terdeteksi beberapa faktor risiko. Mulailah perbaiki pola makan dan olahraga.";
    extraNote =
      "Jika ada keluhan (sering haus/lapar, sering buang air kecil, mudah lelah, luka sulit sembuh), coba bicarakan dengan tenaga kesehatan.";
  }
  if (percent >= 65) {
    color = "#ef4444"; // Red
    riskLabel = "Risiko Tinggi";
    riskDesc = "Sangat dianjurkan untuk melakukan pemeriksaan gula darah ke dokter.";
    extraNote = "Jika ada keluhan (sering haus/lapar, sering buang air kecil, mudah lelah, luka sulit sembuh), coba bicarakan dengan tenaga kesehatan.";
  }

  ring.style.setProperty("--risk-color", color);
  ring.style.setProperty("--risk-deg", percent * 3.6 + "deg");
  title.innerText = riskLabel;
  title.style.color = color;
  desc.innerText = riskDesc + (extraNote ? "\n\n" + extraNote : "");

  // Build activity recommendations based on risk band and BMI
  try {
    const recRoot = document.getElementById("rec-content");
    if (recRoot) {
      // Determine simple band: low <35, medium 35-64, high >=65
      const band = percent >= 65 ? "high" : percent >= 35 ? "medium" : "low";

      
      let items = [];
      if (band === "low") {
        items = [
          "Pertahankan pola makan seimbang (buah, sayur, protein, serat).",
          "Aktivitas fisik teratur: minimal 150 menit/minggu (mis. 30 menit/hari).",
          "Pertahankan berat badan ideal dan kontrol asupan gula/lemak jenuh.",
          "Cek kesehatan rutin setiap 6-12 bulan.",
        ];
      } else if (band === "medium") {
        items = [
          "Tingkatkan frekuensi aktivitas fisik menjadi rutin (jalan cepat, bersepeda, senam).",
          "Kurangi makanan olahan dan minuman manis; perhatikan porsi makan.",
          "Pantau berat badan dan tekanan darah secara berkala.",
          "Pertimbangkan konsultasi gizi atau pemeriksaan gula darah.",
        ];
      } else {
        items = [
          "Segera konsultasi dengan dokter atau mengikuti program rehabilitasi/penurunan berat badan.",
          "Batasi konsumsi gula sederhana dan minuman manis.",
          "Mulai program perubahan gaya hidup terawasi: diet rendah gula & lemak, latihan terstruktur.",
          "Tetapkan jadwal aktivitas fisik rendah dampak (jalan cepat/bersepeda/berenang) 30 menit/hari, 5–6 hari/minggu, sesuai arahan tenaga kesehatan.",
        ];
      }
      
      // Get BMI if available (use current form inputs)
      const w = Number(document.getElementById("weight")?.value) || null;
      const h = Number(document.getElementById("height")?.value) || null;
      let bmiNote = "";
      if (w && h) {
        const bmiVal = Math.round((w / ((h / 100) * (h / 100))) * 10) / 10;
        if (bmiVal >= 30)
          bmiNote =
            "Catatan: IMT menunjukkan obesitas — pertimbangkan program penurunan berat badan.";
        else if (bmiVal >= 25)
          bmiNote =
            "Catatan: IMT menunjukkan kelebihan berat badan — fokus pada penurunan berat badan 5-10%.";
      }
      // If there's a BMI-related note, add it at the end
      if (bmiNote) items.push(bmiNote);
      
      recRoot.innerHTML =
      '<ul class="rec-list">' +
      items.map((i) => `<li>${i}</li>`).join("") +
        "</ul>";

      // Add a small badge indicating band
      const badgeHtml = `<div style="margin-bottom:8px;"><span class="rec-tag ${band}">${
        band === "low"
          ? "Risiko Rendah"
          : band === "medium"
          ? "Risiko Sedang"
          : "Risiko Tinggi"
      }</span></div>`;
      recRoot.parentElement
        .querySelector("h3")
        .insertAdjacentHTML("afterend", badgeHtml);
    }
  } catch (e) {
    console.warn("Could not populate recommendations", e);
  }
}
