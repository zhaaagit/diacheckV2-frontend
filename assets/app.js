// Ganti dengan URL Render Anda setelah deploy
const API_URL = "[https://diacheckv2-backend.onrender.com/](https://diacheckv2-backend.onrender.com/)"; 

let currentStep = 1;
const totalSteps = 4; // Sekarang 4 Langkah

document.addEventListener('DOMContentLoaded', updateWizard);
window.changeStep = changeStep;

function updateWizard() {
  document.querySelectorAll('.step-slide').forEach((el, index) => {
    el.classList.remove('active');
    if (index + 1 === currentStep) el.classList.add('active');
  });

  const percent = (currentStep / (totalSteps + 1)) * 100;
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
      nextBtn.innerHTML = "Lanjut";
    }
  }

  if (currentStep > totalSteps) {
    document.getElementById('wizard-footer').style.display = 'none';
  }
}

function changeStep(dir) {
  if (dir === 1 && currentStep <= totalSteps) {
    const activeSlide = document.getElementById(`slide-${currentStep}`);
    const inputs = activeSlide.querySelectorAll('input[required], select');
    let allValid = true;
    
    inputs.forEach(inp => {
      if ((inp.type === 'radio' && !document.querySelector(`input[name="${inp.name}"]:checked`)) || 
          (!inp.value && inp.type !== 'radio') || 
          (inp.type === 'number' && parseFloat(inp.value) <= 0)) 
      {
        if(inp.type !== 'radio') inp.style.borderColor = '#ef4444';
        allValid = false;
      } else {
        if(inp.type !== 'radio') inp.style.borderColor = '#e2e8f0';
      }
    });
    
    if (!allValid) return; 
  }

  currentStep += dir;
  if (currentStep > totalSteps) calculateRisk();
  updateWizard();
}

async function calculateRisk() {
  const getVal = (id) => document.getElementById(id)?.value || 0;
  const getRadio = (name) => {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : 0;
  };

  const title = document.getElementById('res-title');
  const desc = document.getElementById('res-desc');
  const scoreDisplay = document.getElementById('res-score');
  
  title.innerText = "Menganalisis...";
  scoreDisplay.innerText = "...";

  // Payload dengan Income & Education
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
    Education: getVal('education'), // RESTORED
    Income: getVal('income'),       // RESTORED
    // Defaulted values (Not asking users)
    Diet: 1, // Assume healthy
    NoDoc: 0 // Assume access ok
  };

  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (result.error) throw new Error(result.error);

    const percent = Math.round(result.risk_score * 100);
    const ring = document.getElementById('result-ring');
    scoreDisplay.innerText = percent + '%';
    
    let color = '#10b981';
    let riskLabel = "Risiko Rendah";
    let riskDesc = "Profil kesehatan Anda baik. Pertahankan!";

    if (percent > 40) { 
       color = '#f59e0b';
       riskLabel = "Risiko Sedang";
       riskDesc = "Terdeteksi beberapa faktor risiko. Mulailah pola hidup sehat.";
    }
    if (percent > 70) {
       color = '#ef4444';
       riskLabel = "Risiko Tinggi";
       riskDesc = "Sangat disarankan untuk cek gula darah ke dokter.";
    }

    ring.style.setProperty('--risk-color', color);
    ring.style.setProperty('--risk-deg', (percent * 3.6) + 'deg');
    title.innerText = riskLabel;
    title.style.color = color;
    desc.innerText = riskDesc;

  } catch (error) {
    console.error(error);
    title.innerText = "Gagal";
    desc.innerText = "Koneksi ke server AI gagal.";
  }
}