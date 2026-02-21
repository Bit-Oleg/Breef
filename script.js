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
            // Збираємо тільки текстові поля (без файлів) у URLSearchParams
            // Web3Forms найстабільніше працює з application/x-www-form-urlencoded
            const formData = new FormData(form);
            const params = new URLSearchParams();

            for (const [key, value] of formData.entries()) {
                if (typeof value === 'string') {
                    params.append(key, value);
                }
            }

            // Формуємо красивий HTML лист
            const get = (name) => (formData.get(name) || '').trim();
            const langs = formData.getAll('lang').join(', ') || '—';
            const sections = formData.getAll('sections').join(', ') || '—';
            const materials = formData.getAll('materials').join(', ') || '—';

            const row = (label, value) => value
                ? `<tr><td style="padding:8px 12px;color:#9E7C80;font-size:13px;width:40%;vertical-align:top;border-bottom:1px solid #f0f0f0">${label}</td><td style="padding:8px 12px;color:#1F1F1F;font-size:13px;vertical-align:top;border-bottom:1px solid #f0f0f0"><strong>${value}</strong></td></tr>`
                : '';

            const section = (title, rows) => `
                <tr><td colspan="2" style="padding:16px 12px 6px;background:#5E0B15;color:#F5F5F3;font-size:13px;font-weight:700;letter-spacing:0.05em">${title}</td></tr>
                ${rows}`;

            const fetchOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
            };

            const htmlMessage = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F5F5F3;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F3;padding:24px 0">
<tr><td>
<table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #DFDFDF;max-width:600px">

  <tr><td style="background:#5E0B15;padding:24px;text-align:center">
    <h1 style="margin:0;color:#F5F5F3;font-size:20px;font-weight:700">БРИФ на UX/UI дизайн</h1>
    <p style="margin:6px 0 0;color:#9E7C80;font-size:12px">${new Date().toLocaleDateString('uk-UA')}</p>
  </td></tr>

  <tr><td style="padding:0 24px 24px">
    <table width="100%" cellpadding="0" cellspacing="0">

      <tr><td colspan="2" style="padding:20px 0 8px;border-bottom:2px solid #5E0B15">
        <span style="font-size:13px;font-weight:700;color:#5E0B15;text-transform:uppercase">Контакти</span>
      </td></tr>
      ${get('company') ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px;width:40%">Компанія</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px;font-weight:600">${get('company')}</td></tr>` : ''}
      ${get('contact_person') ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px">Контактна особа</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px;font-weight:600">${get('contact_person')}</td></tr>` : ''}
      ${get('phone') ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px">Телефон</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px;font-weight:600">${get('phone')}</td></tr>` : ''}
      ${get('email') ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px">Email</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px;font-weight:600">${get('email')}</td></tr>` : ''}
      ${get('other_contacts') ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px">Інші контакти</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px">${get('other_contacts')}</td></tr>` : ''}

      <tr><td colspan="2" style="padding:20px 0 8px;border-bottom:2px solid #5E0B15">
        <span style="font-size:13px;font-weight:700;color:#5E0B15;text-transform:uppercase">Про компанію</span>
      </td></tr>
      ${get('business_sphere') ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px;width:40%">Сфера</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px">${get('business_sphere')}</td></tr>` : ''}
      ${get('product_service') ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px">Продукт</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px">${get('product_service')}</td></tr>` : ''}
      ${get('usp') ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px">УТП</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px">${get('usp')}</td></tr>` : ''}
      ${get('geography') ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px">Географія</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px">${get('geography')}</td></tr>` : ''}
      ${get('current_website') ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px">Сайт</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px">${get('current_website')}</td></tr>` : ''}
      ${get('social_media') ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px">Соцмережі</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px">${get('social_media')}</td></tr>` : ''}

      <tr><td colspan="2" style="padding:20px 0 8px;border-bottom:2px solid #5E0B15">
        <span style="font-size:13px;font-weight:700;color:#5E0B15;text-transform:uppercase">Цільова аудиторія</span>
      </td></tr>
      ${get('problem_solving') ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px;width:40%">Проблема</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px">${get('problem_solving')}</td></tr>` : ''}
      ${get('gender_ratio') ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px">Стать</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px">${get('gender_ratio')}</td></tr>` : ''}
      ${get('age_ratio') ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px">Вік</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px">${get('age_ratio')}</td></tr>` : ''}
      ${get('target_interests') ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px">Інтереси</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px">${get('target_interests')}</td></tr>` : ''}

      <tr><td colspan="2" style="padding:20px 0 8px;border-bottom:2px solid #5E0B15">
        <span style="font-size:13px;font-weight:700;color:#5E0B15;text-transform:uppercase">Бачення дизайну</span>
      </td></tr>
      ${get('site_goals') ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px;width:40%">Цілі</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px">${get('site_goals')}</td></tr>` : ''}
      ${get('user_action') ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px">Дія</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px">${get('user_action')}</td></tr>` : ''}
      ${get('style_preferences') ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px">Стилістика</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px">${get('style_preferences')}</td></tr>` : ''}
      ${get('color_scheme') ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px">Кольори</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px">${get('color_scheme')}</td></tr>` : ''}
      ${get('technical_aspects') ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px">Технічні аспекти</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px">${get('technical_aspects')}</td></tr>` : ''}

      <tr><td colspan="2" style="padding:20px 0 8px;border-bottom:2px solid #5E0B15">
        <span style="font-size:13px;font-weight:700;color:#5E0B15;text-transform:uppercase">Конкуренти</span>
      </td></tr>
      ${get('competitor_link') ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px;width:40%">Посилання</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px">${get('competitor_link')}</td></tr>` : ''}
      ${get('competitor_likes') ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px">Подобається</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px">${get('competitor_likes')}</td></tr>` : ''}
      ${get('competitor_dislikes') ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px">Не подобається</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px">${get('competitor_dislikes')}</td></tr>` : ''}

      <tr><td colspan="2" style="padding:20px 0 8px;border-bottom:2px solid #5E0B15">
        <span style="font-size:13px;font-weight:700;color:#5E0B15;text-transform:uppercase">Модулі та мови</span>
      </td></tr>
      <tr><td style="padding:8px 0;color:#9E7C80;font-size:13px;width:40%">Мови</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px">${langs}</td></tr>
      ${get('shop_status') === 'yes' ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px">Магазин</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px">Так ${get('shop_comment') ? '— ' + get('shop_comment') : ''}</td></tr>` : ''}
      ${get('crm_status') === 'yes' ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px">CRM</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px">Так ${get('crm_comment') ? '— ' + get('crm_comment') : ''}</td></tr>` : ''}
      ${get('payments_status') === 'yes' ? `<tr><td style="padding:8px 0;color:#9E7C80;font-size:13px">Платежі</td><td style="padding:8px 0;color:#1F1F1F;font-size:13px">Так ${get('payments_comment') ? '— ' + get('payments_comment') : ''}</td></tr>` : ''}

      ${get('additional_notes') ? `
      <tr><td colspan="2" style="padding:20px 0 8px;border-bottom:2px solid #5E0B15">
        <span style="font-size:13px;font-weight:700;color:#5E0B15;text-transform:uppercase">Примітки</span>
      </td></tr>
      <tr><td colspan="2" style="padding:8px 0;color:#1F1F1F;font-size:13px">${get('additional_notes')}</td></tr>` : ''}

      ${get('utm_source') ? `
      <tr><td colspan="2" style="padding:20px 0 8px;border-bottom:2px solid #DFDFDF">
        <span style="font-size:12px;font-weight:700;color:#9E7C80;text-transform:uppercase">Джерело</span>
      </td></tr>
      <tr><td style="padding:6px 0;color:#9E7C80;font-size:12px;width:40%">utm_source</td><td style="padding:6px 0;color:#1F1F1F;font-size:12px">${get('utm_source')} / ${get('utm_medium')}</td></tr>` : ''}

    </table>
  </td></tr>

  <tr><td style="background:#1F1F1F;padding:16px 24px;text-align:center">
    <p style="margin:0;color:#9E7C80;font-size:11px">Бриф отримано автоматично</p>
    <p style="margin:4px 0 0;color:#DFDFDF;font-size:11px">Валентина Окорешко</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

                        params.set('html', htmlMessage);

            // Відправляємо на ключ 2 з HTML листом
            params.set('access_key', '954415f0-cf4f-449c-8da9-507f336eada6');

            const res = await fetch('https://api.web3forms.com/submit', { ...fetchOptions, body: params.toString() });
            const result = await res.json();
            console.log('Web3Forms:', result);

            if (result.success) {
                showSuccess();
            } else {
                console.error('Failed:', result.message);
                showSuccess();
            }
        } catch (err) {
            console.error('Submit error:', err);
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

// ========== SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
}