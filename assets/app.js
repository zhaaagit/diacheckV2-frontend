// Ganti dengan URL Render Anda
const API_URL = "https://pirpir-diacheckv2.hf.space";

let currentStep = 1;
const totalSteps = 4;

document.addEventListener('DOMContentLoaded', () => {
  updateWizard();

  // Auto-remove error styling when user interacts with an input
  document.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('change', (e) => {
      const wrapper = e.target.closest('.option-card') || e.target;
      if (wrapper) {
        wrapper.classList.remove('input-error');
        e.target.style.borderColor = '';
      }
    });
  });
});

window.changeStep = changeStep;

function updateWizard() {
  document.querySelectorAll('.step-slide').forEach((el, index) => {
    el.classList.remove('active');
    if (index + 1 === currentStep) el.classList.add('active');
  });

  // Start progress at 0% for step 1, gradually increase
  const percent = ((currentStep - 1) / totalSteps) * 100;
  const progressFill = document.getElementById('progress-fill');
  if (progressFill) progressFill.style.width = percent + '%';

  const stepNum = document.getElementById('step-num');
  if (stepNum) stepNum.innerText = Math.min(currentStep, totalSteps);

  const btnBack = document.getElementById('btn-back');
  if (btnBack) btnBack.disabled = (currentStep === 1);

  const nextBtn = document.getElementById('btn-next');
  if (nextBtn) {
    if (currentStep === totalSteps) {
      nextBtn.innerHTML = "Lihat Hasil ⚡";
    } else {
      nextBtn.innerHTML = "Lanjut &rarr;";
    }
  }

  if (currentStep > totalSteps) {
    document.getElementById('wizard-footer').style.display = 'none';
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
    radios.forEach(r => radioGroups.add(r.name));

    let allValid = true;

    // 1. Validate Standard Inputs
    inputs.forEach(inp => {
      if (!inp.value || (inp.type === 'number' && parseFloat(inp.value) <= 0)) {
        inp.style.borderColor = '#ef4444';
        allValid = false;
      } else {
        inp.style.borderColor = '#e2e8f0';
      }
    });

    // 2. Validate Radio Groups
    radioGroups.forEach(name => {
      const isChecked = activeSlide.querySelector(`input[name="${name}"]:checked`);
      const options = activeSlide.querySelectorAll(`input[name="${name}"]`);

      if (!isChecked) {
        allValid = false;
        // Visual feedback for the whole group
        options.forEach(opt => {
          const card = opt.closest('.option-card'); // Assuming your radios are in cards
          if (card) {
            const content = card.querySelector('.option-content');
            if (content) content.style.borderColor = '#ef4444';
          }
        });
      } else {
        options.forEach(opt => {
          const card = opt.closest('.option-card');
          if (card) {
            const content = card.querySelector('.option-content');
            if (content) content.style.borderColor = ''; // Reset
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

  const title = document.getElementById('res-title');
  const desc = document.getElementById('res-desc');
  const scoreDisplay = document.getElementById('res-score');

  title.innerText = "Menganalisis...";
  scoreDisplay.innerText = "...";

  const payload = {
    Sex: getRadio('Sex'),
    weight: getVal('weight'),
    height: getVal('height'),
    age: getVal('age'),
    Smoker: getRadio('Smoker'),
    PhysActivity: getRadio('PhysActivity'),
    HighBP: getRadio('HighBP'),
    HighChol: getRadio('HighChol'),
    HeartAttackOrStroke: getRadio('HeartAttackOrStroke'),
    DiffWalk: getRadio('DiffWalk'),
    GenHlth: getRadio('GenHlth'),
    Education: getVal('education'),
    Income: getVal('income'),
    NoDoc: getRadio('NoDoc')
  };

  // Guard: if any required field is null, show error and stop
  const missingKeys = Object.entries(payload)
    .filter(([_, v]) => v === null)
    .map(([k]) => k);
  if (missingKeys.length) {
    title.innerText = "Data belum lengkap";
    title.style.color = '#f59e0b';
    desc.innerText = `Lengkapi: ${missingKeys.join(', ')}`;
    return;
  }

  // Optional debug: inspect payload being sent
  console.log('Payload to /predict:', payload);

  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('Response from /predict:', result);
    if (result.error) throw new Error(result.error);

    // If backend returns 0-1 scale, multiply by 100; if already 0-100, leave as-is
    let percent = result.risk_score;
    if (typeof percent === 'number' && percent <= 1) {
      percent = Math.round(percent * 100);
    } else {
      percent = Math.round(percent);
    }
    const ring = document.getElementById('result-ring');

    // Animate the number counting up
    let start = 0;
    const duration = 1000;
    const startTime = performance.now();

    function animateScore(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out logic
      const currentVal = Math.floor(progress * percent);
      scoreDisplay.innerText = currentVal + '%';

      if (progress < 1) {
        requestAnimationFrame(animateScore);
      } else {
        finalizeResult(percent, ring, title, desc);
      }
    }
    requestAnimationFrame(animateScore);

  } catch (error) {
    console.error(error);
    title.innerText = "Gagal";
    title.style.color = '#ef4444';
    desc.innerText = "Koneksi ke server AI gagal. Coba lagi nanti.";
  }
}

function finalizeResult(percent, ring, title, desc) {
  let color = '#10b981'; // Green
  let riskLabel = "Risiko Rendah";
  let riskDesc = "Profil kesehatan Anda baik. Pertahankan pola hidup sehat!";

  if (percent > 40) {
    color = '#f59e0b'; // Amber
    riskLabel = "Risiko Sedang";
    riskDesc = "Terdeteksi beberapa faktor risiko. Mulailah perbaiki pola makan dan olahraga.";
  }
  if (percent > 70) {
    color = '#ef4444'; // Red
    riskLabel = "Risiko Tinggi";
    riskDesc = "Disarankan untuk melakukan pemeriksaan gula darah ke dokter.";
  }

  ring.style.setProperty('--risk-color', color);
  ring.style.setProperty('--risk-deg', (percent * 3.6) + 'deg');
  title.innerText = riskLabel;
  title.style.color = color;
  desc.innerText = riskDesc;
}