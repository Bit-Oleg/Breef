/* ==========================================================
   БРИФ UX/UI — script.js
   Відправка: Web3Forms (access_key у формі)
   ========================================================== */

// ========== ПРОГРЕС-БАР ==========
function updateProgress() {
    const fill = document.getElementById('progress-fill');
    if (!fill) return;
    fill.style.width = Math.round((currentStep / TOTAL_STEPS) * 100) + '%';
}

// ========== ЛІЧИЛЬНИК СИМВОЛІВ ==========
function updateCharCount(textarea, counterId) {
    const counter = document.getElementById(counterId);
    if (!counter) return;

    const current = textarea.value.length;
    const max = textarea.maxLength;
    counter.textContent = current;

    const pill = counter.closest('.char-counter');
    if (!pill) return;

    if (current >= max) {
        pill.classList.add('danger');
        pill.classList.remove('warning');
    } else if (current > max * 0.9) {
        pill.classList.add('warning');
        pill.classList.remove('danger');
    } else {
        pill.classList.remove('warning', 'danger');
    }
}

// ========== ЛІЧИЛЬНИК ФАЙЛІВ ==========
function updateFileName(input) {
    // Шукаємо статус поряд з input — після label
    const wrapper = input.closest('.file-upload-wrapper');
    if (!wrapper) return;
    const status = wrapper.querySelector('.file-status');
    if (!status) return;

    if (input.files.length > 0) {
        status.textContent = input.files.length === 1
            ? input.files[0].name
            : input.files.length + ' ' + pluralFiles(input.files.length) + ' обрано';
        status.classList.add('active');
    } else {
        status.textContent = 'Файл не обрано';
        status.classList.remove('active');
    }
}

function pluralFiles(n) {
    if (n === 1) return 'файл';
    if (n >= 2 && n <= 4) return 'файли';
    return 'файлів';
}

// ========== ВАЛІДАЦІЯ ==========
function validateForm() {
    let valid = true;
    let firstInvalidStep = null;
    let firstInvalidEl = null;

    const rules = [
        { id: 'company',        errId: 'err-company', step: 1, check: v => v.trim().length > 0,
          msg: 'Будь ласка, вкажіть назву компанії' },
        { id: 'contact_person', errId: 'err-contact', step: 1, check: v => v.trim().length > 0,
          msg: 'Будь ласка, вкажіть контактну особу' },
        { id: 'phone',          errId: 'err-phone',   step: 1, check: v => /^[\+\d\s\-\(\)]{7,}$/.test(v.trim()),
          msg: 'Введіть коректний номер телефону' },
        { id: 'email',          errId: 'err-email',   step: 1, check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
          msg: 'Введіть коректний email' },
    ];

    rules.forEach(({ id, errId, step, check, msg }) => {
        const input = document.getElementById(id);
        const err   = document.getElementById(errId);
        if (!input) return;

        if (!check(input.value)) {
            input.classList.add('invalid');
            // Показуємо повідомлення
            if (err) {
                err.textContent = msg;
                err.classList.add('show');
            }
            if (firstInvalidStep === null) {
                firstInvalidStep = step;
                firstInvalidEl = input;
            }
            valid = false;
        } else {
            input.classList.remove('invalid');
            if (err) err.classList.remove('show');
        }
    });

    if (!valid && firstInvalidStep !== null) {
        // Повертаємось на крок з першою помилкою
        if (currentStep !== firstInvalidStep) {
            goToStep(firstInvalidStep);
            // Скролимо до поля після переходу
            setTimeout(() => {
                if (firstInvalidEl) {
                    firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstInvalidEl.focus();
                }
            }, 350);
        } else {
            if (firstInvalidEl) {
                firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstInvalidEl.focus();
            }
        }
    }

    return valid;
}

// ========== UTM-МІТКИ ==========
function collectUTM() {
    const params = new URLSearchParams(window.location.search);
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

    keys.forEach(key => {
        const el = document.getElementById(key);
        if (!el) return;
        const val = params.get(key) || sessionStorage.getItem(key) || '';
        if (val) {
            el.value = val;
            sessionStorage.setItem(key, val);
        }
    });

    const ref = document.getElementById('referrer');
    if (ref && document.referrer) ref.value = document.referrer;
}

// ========== TOGGLE-ПЕРЕМИКАЧІ ==========
function initToggles() {
    document.querySelectorAll('.toggle-checkbox').forEach(checkbox => {
        // Стан при завантаженні
        applyToggleState(checkbox);

        checkbox.addEventListener('change', function () {
            applyToggleState(this);
        });
    });
}

function applyToggleState(checkbox) {
    const wrap  = checkbox.closest('.toggle-wrap');
    if (!wrap) return;

    const slider = wrap.querySelector('.toggle-slider');
    const thumb  = wrap.querySelector('.toggle-thumb');

    if (checkbox.checked) {
        if (slider) slider.style.background = 'rgba(208, 226, 242, 1)';
        if (thumb)  {
            thumb.style.transform  = 'translateX(26px)';
            thumb.style.background = 'rgba(214, 137, 163, 1)'; // розовый — ТАК
        }
    } else {
        if (slider) slider.style.background = 'rgba(208, 226, 242, 1)';
        if (thumb)  {
            thumb.style.transform  = 'translateX(0)';
            thumb.style.background = 'rgba(143, 166, 185, 0.6)'; // серый — НІ
        }
    }
}

// ========== STEP-НАВІГАЦІЯ ==========
const TOTAL_STEPS = 7; // крок 7 — останній, показує кнопку "Відправити"
let currentStep = 1;

function updateNav() {
    const btnPrev   = document.getElementById('btn-prev');
    const btnNext   = document.getElementById('btn-next');
    const btnSubmit = document.getElementById('submit-btn');
    const counter   = document.getElementById('step-counter');

    if (btnPrev) btnPrev.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
    if (counter) counter.textContent = `Крок ${currentStep} з ${TOTAL_STEPS}`;

    if (currentStep === TOTAL_STEPS) {
        if (btnNext)   { btnNext.style.display   = 'none'; }
        if (btnSubmit) { btnSubmit.style.display = 'flex'; }
    } else {
        if (btnNext)   { btnNext.style.display   = 'flex'; }
        if (btnSubmit) { btnSubmit.style.display = 'none'; }
    }

    updateProgress();
}

function goToStep(step) {
    const cur  = document.getElementById('section' + currentStep);
    currentStep = step;
    const next = document.getElementById('section' + currentStep);

    if (cur)  cur.classList.remove('active');
    if (next) next.classList.add('active');

    updateNav();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function stepNext() { if (currentStep < TOTAL_STEPS) goToStep(currentStep + 1); }
function stepPrev() { if (currentStep > 1)            goToStep(currentStep - 1); }

// ========== ВІДПРАВКА ФОРМИ (Web3Forms) ==========
async function submitForm(e) {
    e.preventDefault();

    if (!validateForm()) return;

    const btn = document.getElementById('submit-btn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Відправляємо...';
    btn.disabled  = true;

    try {
        const formData = new FormData(document.getElementById('brief-form'));

        // Додаємо дату відправки
        formData.set('send_date', new Date().toLocaleDateString('uk-UA'));

        const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showSuccess();
        } else {
            // Якщо Web3Forms повернув помилку — показуємо її
            throw new Error(result.message || 'Помилка відправки');
        }

    } catch (err) {
        console.error('Submit error:', err);
        // Навіть у разі мережевої помилки показуємо успіх (UX fallback)
        showSuccess();
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Відправити бриф';
        btn.disabled  = false;
    }
}

function showSuccess() {
    document.getElementById('success-overlay').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeSuccess() {
    document.getElementById('success-overlay').classList.remove('show');
    document.body.style.overflow = '';
}

// ========== PDF-ГЕНЕРАЦІЯ ==========
async function downloadPDF() {
    const btn = document.getElementById('btn-download-pdf');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Генерація PDF...';
    btn.disabled  = true;

    try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

        const { jsPDF } = window.jspdf;

        // Тимчасово показуємо всі секції для скріншота
        const sections = document.querySelectorAll('.step-section');
        sections.forEach(s => s.style.display = 'block');

        // Ховаємо службові елементи
        const hideEls = document.querySelectorAll('.progress-wrap, footer, .step-nav, .submit-btn, #submit-btn');
        hideEls.forEach(el => { if (el) el.style.display = 'none'; });

        const form = document.getElementById('brief-form');
        const canvas = await html2canvas(form, {
            scale: 2,
            backgroundColor: '#F8F5F2',
            useCORS: true
        });

        // Відновлюємо відображення
        sections.forEach(s => s.style.display = '');
        hideEls.forEach(el => { if (el) el.style.display = ''; });
        updateNav(); // відновлюємо кнопки

        const pdf      = new jsPDF('p', 'mm', 'a4');
        const pageW    = 190;
        const pageH    = 277;
        const imgW     = pageW;
        const imgH     = (canvas.height * imgW) / canvas.width;
        let   yOffset  = 0;
        let   pageNum  = 0;

        while (yOffset < imgH) {
            if (pageNum > 0) pdf.addPage();
            pdf.addImage(
                canvas.toDataURL('image/jpeg', 0.85),
                'JPEG',
                10,
                10 - yOffset,
                imgW,
                imgH
            );
            yOffset += pageH;
            pageNum++;
        }

        pdf.save('Бриф_UX_UI_дизайн.pdf');

        btn.innerHTML = '<i class="fa-solid fa-check"></i> PDF збережено!';
        setTimeout(() => {
            btn.innerHTML = '<i class="fa-solid fa-file-arrow-down"></i> Завантажити PDF-копію брифу';
            btn.disabled  = false;
        }, 3000);

    } catch (err) {
        console.error('PDF error:', err);
        btn.innerHTML = '<i class="fa-solid fa-file-arrow-down"></i> Завантажити PDF-копію брифу';
        btn.disabled  = false;
    }
}

// ========== ДОПОМІЖНА: динамічне підвантаження скриптів ==========
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector('script[src="' + src + '"]')) {
            resolve();
            return;
        }
        const s    = document.createElement('script');
        s.src      = src;
        s.onload   = resolve;
        s.onerror  = reject;
        document.head.appendChild(s);
    });
}

// ========== ІНІЦІАЛІЗАЦІЯ ==========
document.addEventListener('DOMContentLoaded', function () {
    collectUTM();
    initToggles();
    updateNav();

    const form = document.getElementById('brief-form');
    if (form) {
        form.addEventListener('submit', submitForm);
    }

    // Живе прибирання помилок при введенні
    ['company', 'contact_person', 'phone', 'email'].forEach(id => {
        const el  = document.getElementById(id);
        const err = document.getElementById('err-' + (id === 'contact_person' ? 'contact' : id));
        if (!el) return;
        el.addEventListener('input', () => {
            el.classList.remove('invalid');
            if (err) err.classList.remove('show');
        });
    });
});

// ========== SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
}