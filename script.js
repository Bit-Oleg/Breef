// ========== ПРОГРЕС-БАР ==========
function updateProgress() {
    const form = document.getElementById('brief-form');
    if (!form) return;
    const fields = form.querySelectorAll('input[type="text"], input[type="tel"], input[type="email"], input[type="url"], textarea');
    let filled = 0;
    fields.forEach(f => { if (f.value.trim()) filled++; });
    const pct = Math.round((filled / fields.length) * 100);
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('progress-text').textContent = pct + '%';
}

// ========== ЛІЧИЛЬНИК ФАЙЛІВ ==========
function updateFileName(input) {
    const wrapper = input.closest('.file-upload-wrapper');
    const status = wrapper.querySelector('.file-status');
    const counterId = 'counter-' + input.id;
    const counter = document.getElementById(counterId);
    if (input.files.length > 0) {
        status.textContent = input.files.length === 1
            ? input.files[0].name
            : input.files.length + ' ' + pluralFiles(input.files.length) + ' обрано';
        status.classList.add('active');
        if (counter) {
            counter.textContent = '\u{1F4CE} ' + input.files.length + ' ' + pluralFiles(input.files.length);
            counter.classList.add('show');
        }
    } else {
        status.textContent = 'Файл не обрано';
        status.classList.remove('active');
        if (counter) counter.classList.remove('show');
    }
    updateProgress();
}

function pluralFiles(n) {
    if (n === 1) return 'файл';
    if (n >= 2 && n <= 4) return 'файли';
    return 'файлів';
}

// ========== БЮДЖЕТ СЛАЙДЕР ==========
function updateBudget(val) {
    const v = parseInt(val);
    const display = v >= 10000 ? '$ 10 000+' : '$ ' + v.toLocaleString('uk-UA');
    const el = document.getElementById('budget-display');
    if (el) el.textContent = display;
    const hid = document.getElementById('budget_value');
    if (hid) hid.value = val;
}

// ========== ВАЛІДАЦІЯ ==========
function validateForm() {
    let valid = true;
    let firstInvalid = null;
    const requiredFields = [
        { id: 'company',        errId: 'err-company', check: v => v.trim().length > 0 },
        { id: 'contact_person', errId: 'err-contact', check: v => v.trim().length > 0 },
        { id: 'phone',          errId: 'err-phone',   check: v => /^[\+\d\s\-\(\)]{7,}$/.test(v.trim()) },
        { id: 'email',          errId: 'err-email',   check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
    ];
    requiredFields.forEach(({ id, errId, check }) => {
        const input = document.getElementById(id);
        const err   = document.getElementById(errId);
        if (input && !check(input.value)) {
            input.classList.add('invalid');
            if (err) err.classList.add('show');
            if (!firstInvalid) firstInvalid = input;
            valid = false;
        } else if (input) {
            input.classList.remove('invalid');
            if (err) err.classList.remove('show');
        }
    });
    if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return valid;
}

// ========== ВІДПРАВКА НА NETLIFY (БЕЗ РЕДИРЕКТУ) ==========

// ========== UTM МІТКИ ==========
function collectUTM() {
    const params = new URLSearchParams(window.location.search);
    const utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

    utmFields.forEach(key => {
        const el = document.getElementById(key);
        if (el && params.get(key)) {
            el.value = params.get(key);
        }
    });

    // Referrer — звідки прийшов користувач
    const ref = document.getElementById('referrer');
    if (ref && document.referrer) {
        ref.value = document.referrer;
    }

    // Зберігаємо UTM в sessionStorage щоб не загубити при перезавантаженні
    utmFields.forEach(key => {
        if (params.get(key)) {
            sessionStorage.setItem(key, params.get(key));
        } else {
            // Беремо з sessionStorage якщо в URL вже немає
            const saved = sessionStorage.getItem(key);
            const el = document.getElementById(key);
            if (saved && el && !el.value) el.value = saved;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Зчитуємо UTM мітки одразу при завантаженні
    collectUTM();

    const form = document.getElementById('brief-form');
    if (!form) return;

    form.querySelectorAll('input, textarea').forEach(el => {
        el.addEventListener('input', updateProgress);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const btn = document.getElementById('submit-btn');
        btn.textContent = '\u23F3 Відправляємо...';
        btn.disabled = true;

        try {
            const formData = new FormData(form);
            const getF = (name) => (formData.get(name) || '').trim();
            const langs = formData.getAll('lang').join(', ') || '—';

            // Завантажуємо EmailJS
            await loadScript('https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js');
            emailjs.init('s4yypLB79jR8OUOtA');

            const templateParams = {
                company:             getF('company'),
                contact_person:      getF('contact_person'),
                phone:               getF('phone'),
                email:               getF('email'),
                other_contacts:      getF('other_contacts') || '—',
                business_sphere:     getF('business_sphere') || '—',
                product_service:     getF('product_service') || '—',
                product_description: getF('product_description') || '—',
                usp:                 getF('usp') || '—',
                geography:           getF('geography') || '—',
                current_website:     getF('current_website') || '—',
                social_media:        getF('social_media') || '—',
                problem_solving:     getF('problem_solving') || '—',
                gender_ratio:        getF('gender_ratio') || '—',
                age_ratio:           getF('age_ratio') || '—',
                financial_status:    getF('financial_status') || '—',
                target_interests:    getF('target_interests') || '—',
                site_goals:          getF('site_goals') || '—',
                user_action:         getF('user_action') || '—',
                style_preferences:   getF('style_preferences') || '—',
                color_scheme:        getF('color_scheme') || '—',
                technical_aspects:   getF('technical_aspects') || '—',
                competitor_link:     getF('competitor_link') || '—',
                competitor_likes:    getF('competitor_likes') || '—',
                competitor_dislikes: getF('competitor_dislikes') || '—',
                content_owner:       getF('content_owner') || '—',
                search_status:       getF('search_status') || '—',
                blog_status:         getF('blog_status') || '—',
                shop_status:         getF('shop_status') || '—',
                shop_comment:        getF('shop_comment') || '',
                crm_status:          getF('crm_status') || '—',
                crm_comment:         getF('crm_comment') || '',
                payments_status:     getF('payments_status') || '—',
                payments_comment:    getF('payments_comment') || '',
                delivery_status:     getF('delivery_status') || '—',
                delivery_comment:    getF('delivery_comment') || '',
                analytics_status:    getF('analytics_status') || '—',
                analytics_comment:   getF('analytics_comment') || '',
                langs:               langs,
                lang_other:          getF('lang_other') || '',
                additional_notes:    getF('additional_notes') || '—',
                utm_source:          getF('utm_source') || '—',
                utm_medium:          getF('utm_medium') || '—',
                utm_campaign:        getF('utm_campaign') || '—',
                referrer:            getF('referrer') || '—',
                send_date:           new Date().toLocaleDateString('uk-UA'),
            };

            const result = await emailjs.send(
                'service_i2m41jf',
                'template_6s72c1s',
                templateParams
            );

            console.log('EmailJS:', result);
            showSuccess();

        } catch (err) {
            console.error('EmailJS error:', err);
            showSuccess();
        } finally {
            btn.textContent = '🚀 Відправити та зберегти PDF';
            btn.disabled = false;
        }
    });
});

function showSuccess() {
    document.getElementById('success-overlay').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeSuccess() {
    document.getElementById('success-overlay').classList.remove('show');
    document.body.style.overflow = '';
}

// ========== ЗАВАНТАЖЕННЯ СКРИПТІВ ==========
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
        const s = document.createElement('script');
        s.src = src; s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
    });
}

// ========== PDF ==========
async function downloadPDF() {
    const btn = document.getElementById('btn-download-pdf');
    btn.textContent = 'Генерація PDF...';
    btn.disabled = true;

    try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        const { jsPDF } = window.jspdf;

        await document.fonts.ready;

        // Ховаємо зайве
        const overlay   = document.getElementById('success-overlay');
        const submitBtn = document.getElementById('submit-btn');
        const progress  = document.querySelector('.progress-wrap');
        const footer    = document.querySelector('footer');
        const header    = document.querySelector('header');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
        submitBtn.style.display = 'none';
        if (progress) progress.style.display = 'none';
        if (footer)   footer.style.display   = 'none';
        if (header)   header.style.display   = 'none';

        window.scrollTo(0, 0);
        await new Promise(r => setTimeout(r, 200));

        // ===== КЛЮЧОВИЙ ФІХ: замінюємо input/textarea на div перед рендером =====
        const form = document.getElementById('brief-form');
        const replacements = [];

        form.querySelectorAll('input[type="text"], input[type="tel"], input[type="email"], input[type="url"], textarea').forEach(el => {
            const div = document.createElement('div');
            const val = el.value.trim();
            const ph  = el.placeholder || '';

            // Копіюємо computed стилі
            const cs = window.getComputedStyle(el);
            div.style.cssText = [
                'font-family:' + cs.fontFamily,
                'font-size:'   + cs.fontSize,
                'font-weight:' + cs.fontWeight,
                'color:'       + (val ? '#0f172a' : '#94a3b8'),
                'background:'  + cs.backgroundColor,
                'border:'      + cs.border,
                'border-radius:' + cs.borderRadius,
                'padding:0.6rem 1rem',
                'margin-bottom:1rem',
                'min-height:2.6rem',
                'width:100%',
                'box-sizing:border-box',
                'word-break:break-word',
                'white-space:pre-wrap',
                'line-height:1.5',
            ].join(';');

            div.textContent = val || ph;
            if (el.tagName === 'TEXTAREA' && !val) {
                div.style.minHeight = (parseInt(el.rows) * 1.5 + 1.2) + 'rem';
            }

            el.parentNode.insertBefore(div, el);
            el.style.display = 'none';
            replacements.push({ original: el, replacement: div });
        });

        await new Promise(r => setTimeout(r, 100));

        const main = document.querySelector('main');
        const mainRect = main.getBoundingClientRect();
        const SCALE = 2;

        // Збираємо точки розриву
        const safeBreaks = new Set([0]);
        ['fieldset > p', 'fieldset > div.module-group', 'fieldset > div.material-item',
         'fieldset > div.checkbox-group', 'fieldset'].forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                const rect = el.getBoundingClientRect();
                const topY    = Math.round((rect.top    - mainRect.top) * SCALE);
                const bottomY = Math.round((rect.bottom - mainRect.top) * SCALE);
                if (topY    > 0) safeBreaks.add(topY);
                if (bottomY > 0) safeBreaks.add(bottomY);
            });
        });

        // Рендеримо
        const fullCanvas = await html2canvas(main, {
            scale: SCALE,
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#f8fafc',
            logging: false,
            scrollX: 0,
            scrollY: 0,
            x: 0,
            y: 0,
            width: main.scrollWidth,
            height: main.scrollHeight,
            windowWidth: main.scrollWidth,
            windowHeight: main.scrollHeight,
        });

        // ===== Відновлюємо оригінальні поля =====
        replacements.forEach(({ original, replacement }) => {
            original.style.display = '';
            replacement.parentNode.removeChild(replacement);
        });

        submitBtn.style.display = '';
        if (progress) progress.style.display = '';
        if (footer)   footer.style.display   = '';
        if (header)   header.style.display   = '';
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';

        safeBreaks.add(fullCanvas.height);
        const breakPoints = Array.from(safeBreaks).sort((a, b) => a - b);

        // A4
        const PAGE_W    = 210;
        const PAGE_H    = 297;
        const MARGIN    = 10;
        const CONT_W    = PAGE_W - MARGIN * 2;
        const CONT_H    = PAGE_H - MARGIN * 2;
        const pxPerMm   = fullCanvas.width / CONT_W;
        const pageMaxPx = Math.floor(CONT_H * pxPerMm);

        const pages = [];
        let pageStart = 0;
        while (pageStart < fullCanvas.height) {
            const maxEnd = pageStart + pageMaxPx;
            if (maxEnd >= fullCanvas.height) {
                pages.push({ start: pageStart, end: fullCanvas.height });
                break;
            }
            let bestBreak = -1;
            for (let i = breakPoints.length - 1; i >= 0; i--) {
                if (breakPoints[i] <= maxEnd && breakPoints[i] > pageStart) {
                    bestBreak = breakPoints[i];
                    break;
                }
            }
            if (bestBreak === -1) bestBreak = Math.min(maxEnd, fullCanvas.height);
            pages.push({ start: pageStart, end: bestBreak });
            pageStart = bestBreak;
        }

        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        for (let pi = 0; pi < pages.length; pi++) {
            if (pi > 0) pdf.addPage();
            const { start, end } = pages[pi];
            const sliceH = end - start;
            const slice = document.createElement('canvas');
            slice.width  = fullCanvas.width;
            slice.height = sliceH;
            const ctx = slice.getContext('2d');
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, slice.width, slice.height);
            ctx.drawImage(fullCanvas, 0, start, fullCanvas.width, sliceH, 0, 0, fullCanvas.width, sliceH);
            const sliceMmH = sliceH / pxPerMm;
            pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', MARGIN, MARGIN, CONT_W, sliceMmH);
        }

        const total = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= total; i++) {
            pdf.setPage(i);
            pdf.setFontSize(7);
            pdf.setTextColor(180, 180, 180);
            pdf.text(i + ' / ' + total, PAGE_W - MARGIN, PAGE_H - 3, { align: 'right' });
        }

        pdf.save('Бриф_UX_UI_дизайн.pdf');
        btn.textContent = 'PDF збережено!';
        setTimeout(() => { btn.innerHTML = 'Завантажити PDF-копію брифу'; btn.disabled = false; }, 3000);

    } catch (err) {
        console.error('PDF error:', err);
        [document.getElementById('submit-btn'), document.querySelector('.progress-wrap'),
         document.querySelector('footer'), document.querySelector('header')]
            .forEach(el => { if (el) el.style.display = ''; });
        const o = document.getElementById('success-overlay');
        if (o) { o.classList.add('show'); document.body.style.overflow = 'hidden'; }
        btn.textContent = 'Помилка — спробуйте ще раз';
        btn.disabled = false;
    }
}


// ========== STEP НАВІГАЦІЯ ==========
const TOTAL_STEPS = 8;
let currentStep = 1;

function updateNav() {
    const prev = document.getElementById('btn-prev');
    const next = document.getElementById('btn-next');
    const counter = document.getElementById('step-counter');
    const submit = document.getElementById('submit-btn');
    const fill = document.getElementById('progress-fill');

    if (prev) prev.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
    if (counter) counter.textContent = `Крок ${currentStep} з ${TOTAL_STEPS}`;
    if (fill) fill.style.width = Math.round((currentStep / TOTAL_STEPS) * 100) + '%';

    if (currentStep === TOTAL_STEPS) {
        if (next) next.style.display = 'none';
        if (submit) submit.style.display = 'flex';
    } else {
        if (next) next.style.display = 'flex';
        if (submit) submit.style.display = 'none';
    }
}

function goToStep(step) {
    const cur = document.getElementById('section' + currentStep);
    const isForward = step > currentStep;
    currentStep = step;
    const next = document.getElementById('section' + currentStep);

    if (cur && next) {
        // Анімація виїзду поточного
        cur.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        cur.style.transform = isForward ? 'translateX(-40px)' : 'translateX(40px)';
        cur.style.opacity = '0';

        setTimeout(() => {
            cur.classList.remove('active');
            cur.style.transform = '';
            cur.style.opacity = '';
            cur.style.transition = '';

            // Анімація в'їзду наступного
            next.style.transform = isForward ? 'translateX(40px)' : 'translateX(-40px)';
            next.style.opacity = '0';
            next.style.transition = 'none';
            next.classList.add('active');

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    next.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                    next.style.transform = 'translateX(0)';
                    next.style.opacity = '1';
                });
            });
        }, 280);
    } else {
        if (cur) cur.classList.remove('active');
        if (next) next.classList.add('active');
    }

    updateNav();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function stepNext() { if (currentStep < TOTAL_STEPS) goToStep(currentStep + 1); }
function stepPrev() { if (currentStep > 1) goToStep(currentStep - 1); }

document.addEventListener('DOMContentLoaded', () => {
    updateNav();
    // Ставимо початкову ширину прогресу
    const fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = Math.round((1 / TOTAL_STEPS) * 100) + '%';
});

// ========== SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
}