/* ==========================================================
   БРИФ UX/UI — script.js
   Відправка: Web3Forms (access_key у формі)
   ========================================================== */

// ========== ПРОГРЕС-БАР ==========
function updateProgress() {
    var fill = document.getElementById('progress-fill');
    if (!fill) return;
    fill.style.width = Math.round((currentStep / TOTAL_STEPS) * 100) + '%';
}

// ========== ЛІЧИЛЬНИК СИМВОЛІВ ==========
function updateCharCount(textarea, counterId) {
    var counter = document.getElementById(counterId);
    if (!counter) return;
    var current = textarea.value.length;
    var max = textarea.maxLength;
    counter.textContent = current;
    var pill = counter.closest('.char-counter');
    if (!pill) return;
    if (current >= max) {
        pill.classList.add('danger'); pill.classList.remove('warning');
    } else if (current > max * 0.9) {
        pill.classList.add('warning'); pill.classList.remove('danger');
    } else {
        pill.classList.remove('warning', 'danger');
    }
}

// ========== ЛІЧИЛЬНИК ФАЙЛІВ ==========
function updateFileName(input) {
    var wrapper = input.closest('.file-upload-wrapper');
    if (!wrapper) return;
    var status = wrapper.querySelector('.file-status');
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

// ========== TOAST ==========
var _toastTimer = null;

function showToast(messages) {
    var old = document.getElementById('validation-toast');
    if (old) { clearTimeout(_toastTimer); old.remove(); }

    var toast = document.createElement('div');
    toast.id = 'validation-toast';
    toast.setAttribute('role', 'alert');

    var html = '<div class="toast-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>';
    html += '<div class="toast-body">';
    html += '<p class="toast-title">Заповніть обов\'язкові поля:</p><ul class="toast-list">';
    for (var i = 0; i < messages.length; i++) {
        html += '<li>' + messages[i] + '</li>';
    }
    html += '</ul></div>';
    html += '<button class="toast-close" onclick="dismissToast()" aria-label="Закрити"><i class="fa-solid fa-xmark"></i></button>';
    toast.innerHTML = html;
    document.body.appendChild(toast);

    // Примусовий reflow — без нього transition не спрацює
    void toast.offsetWidth;
    toast.classList.add('show');

    _toastTimer = setTimeout(function() { dismissToast(); }, 6000);
}

function dismissToast() {
    clearTimeout(_toastTimer);
    var toast = document.getElementById('validation-toast');
    if (!toast) return;
    toast.classList.remove('show');
    setTimeout(function() {
        var t = document.getElementById('validation-toast');
        if (t) t.remove();
    }, 400);
}

// ========== SHAKE ==========
function shakeField(el) {
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth; // reflow
    el.classList.add('shake');
    setTimeout(function() { el.classList.remove('shake'); }, 650);
}

// ========== ВАЛІДАЦІЯ ==========
function validateForm() {
    var valid = true;
    var firstInvalidStep = null;
    var firstInvalidEl = null;
    var errorMessages = [];

    var rules = [
        { id: 'company',        errId: 'err-company', step: 1,
          check: function(v) { return v.trim().length > 0; },          msg: 'Вкажіть назву компанії' },
        { id: 'contact_person', errId: 'err-contact', step: 1,
          check: function(v) { return v.trim().length > 0; },          msg: 'Вкажіть контактну особу' },
        { id: 'phone',          errId: 'err-phone',   step: 1,
          check: function(v) { return /^[\+\d\s\-\(\)]{7,}$/.test(v.trim()); }, msg: 'Введіть коректний номер телефону' },
        { id: 'email',          errId: 'err-email',   step: 1,
          check: function(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }, msg: 'Введіть коректний email' }
    ];

    for (var i = 0; i < rules.length; i++) {
        var rule  = rules[i];
        var input = document.getElementById(rule.id);
        var err   = document.getElementById(rule.errId);
        if (!input) continue;

        if (!rule.check(input.value)) {
            input.classList.add('invalid');
            if (err) { err.textContent = rule.msg; err.classList.add('show'); }
            errorMessages.push(rule.msg);
            if (firstInvalidStep === null) { firstInvalidStep = rule.step; firstInvalidEl = input; }
            valid = false;
        } else {
            input.classList.remove('invalid');
            if (err) err.classList.remove('show');
        }
    }

    if (!valid) {
        showToast(errorMessages);

        var targetEl = firstInvalidEl;
        var targetStep = firstInvalidStep;

        var focusTarget = function() {
            // Временно показываем секцию если она скрыта
            var section = document.getElementById('section' + targetStep);
            if (section) section.style.display = 'block';

            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetEl.focus();
            shakeField(targetEl);
        };

        if (currentStep !== firstInvalidStep) {
            goToStep(firstInvalidStep);
            setTimeout(focusTarget, 400);
        } else {
            focusTarget();
        }
    }

    return valid;
}

// ========== UTM-МІТКИ ==========
function collectUTM() {
    var params = new URLSearchParams(window.location.search);
    var keys   = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    keys.forEach(function(key) {
        var el = document.getElementById(key);
        if (!el) return;
        var val = params.get(key) || sessionStorage.getItem(key) || '';
        if (val) { el.value = val; sessionStorage.setItem(key, val); }
    });
    var ref = document.getElementById('referrer');
    if (ref && document.referrer) ref.value = document.referrer;
}

// ========== TOGGLE-ПЕРЕМИКАЧІ ==========
// Анімація toggle керується чистим CSS через :checked ~ .toggle-thumb — JS не потрібен
function initToggles() {}

// ========== БЕГУЧА СТРОКА В ІНПУТАХ ==========
function initMarqueeInputs() {
    var inputs = document.querySelectorAll('input[type="text"], input[type="tel"], input[type="email"], input[type="url"]');

    inputs.forEach(function(input) {
        var rafId      = null;  // requestAnimationFrame id
        var pauseId    = null;  // setTimeout id для паузи
        var direction  = 1;     // 1 = вперед, -1 = назад
        var active     = false;
        var SPEED      = 0.6;   // пікселів за кадр
        var PAUSE_END  = 700;   // пауза в кінці/початку (мс)
        var PAUSE_START = 900;  // пауза після фокуса перед стартом

        function stop() {
            active = false;
            cancelAnimationFrame(rafId);
            clearTimeout(pauseId);
            rafId = null;
            pauseId = null;
        }

        function tick() {
            if (!active) return;
            var maxScroll = input.scrollWidth - input.clientWidth;

            // Текст влазить — нічого не робимо
            if (maxScroll <= 0) { stop(); return; }

            input.scrollLeft += SPEED * direction;

            // Досягли кінця — пауза, потім назад
            if (input.scrollLeft >= maxScroll) {
                input.scrollLeft = maxScroll;
                direction = -1;
                cancelAnimationFrame(rafId);
                pauseId = setTimeout(function() {
                    if (active) rafId = requestAnimationFrame(tick);
                }, PAUSE_END);
                return;
            }

            // Досягли початку — пауза, потім вперед
            if (input.scrollLeft <= 0) {
                input.scrollLeft = 0;
                direction = 1;
                cancelAnimationFrame(rafId);
                pauseId = setTimeout(function() {
                    if (active) rafId = requestAnimationFrame(tick);
                }, PAUSE_END);
                return;
            }

            rafId = requestAnimationFrame(tick);
        }

        input.addEventListener('focus', function() {
            stop();
            active    = true;
            direction = 1;
            pauseId = setTimeout(function() {
                if (active) rafId = requestAnimationFrame(tick);
            }, PAUSE_START);
        });

        input.addEventListener('blur', function() {
            stop();
            // Плавно повертаємось на початок
            var el = this;
            var backId = setInterval(function() {
                if (el.scrollLeft <= 0) { el.scrollLeft = 0; clearInterval(backId); return; }
                el.scrollLeft -= 4;
            }, 12);
        });

        // Зупиняємо при введенні — рестартуємо таймер щоб не заважати набору
        input.addEventListener('input', function() {
            stop();
            active    = true;
            direction = 1;
            clearTimeout(pauseId);
            pauseId = setTimeout(function() {
                if (active && document.activeElement === input) {
                    rafId = requestAnimationFrame(tick);
                }
            }, 1500);
        });
    });
}

// ========== STEP-НАВІГАЦІЯ ==========
var TOTAL_STEPS = 7;
var currentStep = 1;

function updateNav() {
    var btnPrev   = document.getElementById('btn-prev');
    var btnNext   = document.getElementById('btn-next');
    var btnSubmit = document.getElementById('submit-btn');
    var counter   = document.getElementById('step-counter');

    if (btnPrev) btnPrev.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
    if (counter) counter.textContent = 'Крок ' + currentStep + ' з ' + TOTAL_STEPS;

    if (currentStep === TOTAL_STEPS) {
        if (btnNext)   btnNext.style.display   = 'none';
        if (btnSubmit) btnSubmit.style.display = 'flex';
    } else {
        if (btnNext)   btnNext.style.display   = 'flex';
        if (btnSubmit) btnSubmit.style.display = 'none';
    }
    updateProgress();
}

function goToStep(step) {
    var cur = document.getElementById('section' + currentStep);
    currentStep = step;
    var next = document.getElementById('section' + currentStep);
    if (cur)  cur.classList.remove('active');
    if (next) next.classList.add('active');
    updateNav();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function stepNext() { if (currentStep < TOTAL_STEPS) goToStep(currentStep + 1); }
function stepPrev() { if (currentStep > 1)           goToStep(currentStep - 1); }

// ========== ВІДПРАВКА ФОРМИ ==========
async function submitForm(e) {
    e.preventDefault();
    if (!validateForm()) return;

    var btn = document.getElementById('submit-btn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Відправляємо...';
    btn.disabled = true;

    try {
        var formData = new FormData(document.getElementById('brief-form'));
        formData.set('send_date', new Date().toLocaleDateString('uk-UA'));

        var response = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: formData });
        var result   = await response.json();

        if (result.success) { showSuccess(); }
        else { throw new Error(result.message || 'Помилка відправки'); }

    } catch (err) {
        console.error('Submit error:', err);
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
    var btn = document.getElementById('btn-download-pdf');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Генерація PDF...';
    btn.disabled = true;

    try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

        var { jsPDF }  = window.jspdf;
        var sections   = document.querySelectorAll('.step-section');
        sections.forEach(function(s) { s.style.display = 'block'; });

        var hideEls = document.querySelectorAll('.progress-wrap, footer, .step-nav, .submit-btn, #submit-btn');
        hideEls.forEach(function(el) { if (el) el.style.display = 'none'; });

        var canvas = await html2canvas(document.getElementById('brief-form'), {
            scale: 2, backgroundColor: '#F8F5F2', useCORS: true
        });

        sections.forEach(function(s) { s.style.display = ''; });
        hideEls.forEach(function(el) { if (el) el.style.display = ''; });
        updateNav();

        var pdf   = new jsPDF('p', 'mm', 'a4');
        var imgW  = 190;
        var imgH  = (canvas.height * imgW) / canvas.width;
        var yOff  = 0; var pageN = 0;

        while (yOff < imgH) {
            if (pageN > 0) pdf.addPage();
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.85), 'JPEG', 10, 10 - yOff, imgW, imgH);
            yOff += 277; pageN++;
        }

        pdf.save('Бриф_UX_UI_дизайн.pdf');
        btn.innerHTML = '<i class="fa-solid fa-check"></i> PDF збережено!';
        setTimeout(function() {
            btn.innerHTML = '<i class="fa-solid fa-file-arrow-down"></i> Завантажити PDF-копію брифу';
            btn.disabled = false;
        }, 3000);

    } catch (err) {
        console.error('PDF error:', err);
        btn.innerHTML = '<i class="fa-solid fa-file-arrow-down"></i> Завантажити PDF-копію брифу';
        btn.disabled = false;
    }
}

function loadScript(src) {
    return new Promise(function(resolve, reject) {
        if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
        var s = document.createElement('script');
        s.src = src; s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
    });
}

// ========== ІНІЦІАЛІЗАЦІЯ ==========
document.addEventListener('DOMContentLoaded', function() {
    collectUTM();
    initToggles();
    initMarqueeInputs();
    updateNav();

    var form = document.getElementById('brief-form');
    if (form) form.addEventListener('submit', submitForm);

    ['company', 'contact_person', 'phone', 'email'].forEach(function(id) {
        var el  = document.getElementById(id);
        var err = document.getElementById('err-' + (id === 'contact_person' ? 'contact' : id));
        if (!el) return;
        el.addEventListener('input', function() {
            el.classList.remove('invalid');
            if (err) err.classList.remove('show');
        });
    });
});

// ========== SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js').catch(function() {});
    });
}