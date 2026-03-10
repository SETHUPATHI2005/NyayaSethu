const API_CONFIG_KEY = 'nyayamithra_api_url';

function apiBase() {
  return String(window.NYAYAMITHRA_API || '').replace(/\/+$/, '');
}

function localFallbackApi() {
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname) || window.location.protocol === 'file:';
  return isLocal ? 'http://127.0.0.1:8000' : '';
}

function fallbackApi() {
  return String(window.NYAYAMITHRA_DEFAULT_API || localFallbackApi() || '').replace(/\/+$/, '');
}

function persistApiBase(url) {
  if (typeof window.setNyayaMithraApi === 'function') {
    window.setNyayaMithraApi(url);
    return;
  }
  if (!url) {
    localStorage.removeItem(API_CONFIG_KEY);
  } else {
    localStorage.setItem(API_CONFIG_KEY, url);
  }
  window.NYAYAMITHRA_API = url;
}

async function fetchApi(path, init) {
  const primary = apiBase();
  try {
    return await fetch(`${primary}${path}`, init);
  } catch (err) {
    const fallback = fallbackApi();
    if (!fallback || fallback === primary) throw err;
    persistApiBase(fallback);
    return await fetch(`${fallback}${path}`, init);
  }
}

const TEMPLATES = {
  wrongful_termination: {
    title: 'Wrongful Termination Complaint',
    desc: 'Under the Industrial Disputes Act, 1947 — Section 25F & 25G',
    fields: [
      { id:'name',   label:'Your Full Name',         required:true },
      { id:'company',label:'Company / Employer Name',required:true },
      { id:'desig',  label:'Designation',            required:true },
      { id:'joined', label:'Date of Joining',        type:'date',required:true },
      { id:'terminated', label:'Date of Termination',type:'date',required:true },
      { id:'notice', label:'Notice Given',           type:'select', opts:['No notice given','1–7 days','8–15 days','16–29 days'] },
      { id:'dues',   label:'Pending Dues',           placeholder:'e.g. ₹15,000 unpaid salary' },
      { id:'authority', label:'Authority to Address',type:'select', opts:['Labour Commissioner','Industrial Tribunal','Labour Court'] }
    ]
  },
  wage_complaint: {
    title: 'Unpaid Wages Complaint',
    desc: 'Under the Payment of Wages Act, 1936',
    fields: [
      { id:'name',    label:'Your Name',         required:true },
      { id:'employer',label:'Employer Name',     required:true },
      { id:'months',  label:'Months Unpaid',     required:true, placeholder:'e.g. Oct–Nov 2024' },
      { id:'amount',  label:'Total Amount Due (₹)', required:true },
      { id:'last_paid',label:'Last Paid Date',   type:'date' }
    ]
  },
  pf_complaint: {
    title: 'PF / ESI Grievance',
    desc: 'Under the Employees Provident Fund Act, 1952',
    fields: [
      { id:'name',    label:'Employee Name',    required:true },
      { id:'uan',     label:'UAN Number',       placeholder:'Universal Account Number' },
      { id:'employer',label:'Employer Name',    required:true },
      { id:'type',    label:'Grievance Type',   type:'select', opts:['PF not deposited','ESI not registered','PF withdrawal denied','Incorrect PF amount'] },
      { id:'period',  label:'Period',           required:true, placeholder:'e.g. April–October 2024' },
      { id:'amount',  label:'Amount (₹)',        placeholder:'Leave blank if unknown' }
    ]
  },
  maternity_leave: {
    title: 'Maternity Leave Demand',
    desc: 'Under the Maternity Benefit Act, 1961',
    fields: [
      { id:'name',    label:'Employee Name',    required:true },
      { id:'company', label:'Company / Employer',required:true },
      { id:'delivery',label:'Expected Delivery Date', type:'date', required:true },
      { id:'start',   label:'Leave Start Date', type:'date', required:true },
      { id:'end',     label:'Leave End Date',   type:'date', required:true }
    ]
  },
  consumer_complaint: {
    title: 'Consumer Court Complaint',
    desc: 'Under Consumer Protection Act, 2019',
    fields: [
      { id:'name',   label:'Complainant Name',    required:true },
      { id:'party',  label:'Company / Seller',    required:true },
      { id:'product',label:'Product / Service',   required:true, placeholder:'e.g. Samsung TV Model XYZ' },
      { id:'date',   label:'Purchase Date',       type:'date', required:true },
      { id:'amount', label:'Amount Paid (₹)',      required:true },
      { id:'defect', label:'Defect / Grievance',  type:'textarea', required:true },
      { id:'relief', label:'Relief Sought',       type:'select', opts:['Full refund','Replacement','Compensation','All of the above'] }
    ]
  },
  refund_notice: {
    title: 'Refund Legal Notice',
    desc: 'Under Consumer Protection Act + Contract Act',
    fields: [
      { id:'name',      label:'Your Name',            required:true },
      { id:'company',   label:'Company / Recipient',  required:true },
      { id:'txn_date',  label:'Transaction Date',     type:'date', required:true },
      { id:'amount',    label:'Amount (₹)',             required:true },
      { id:'reason',    label:'Reason for Refund',    type:'textarea', required:true },
      { id:'deadline',  label:'Response Deadline',    type:'select', opts:['7 days','14 days','30 days'] }
    ]
  },
  online_fraud: {
    title: 'Online Fraud Complaint',
    desc: 'Under IT Act 2000 + IPC Section 420',
    fields: [
      { id:'name',   label:'Your Name',       required:true },
      { id:'phone',  label:'Your Phone',      required:true },
      { id:'type',   label:'Fraud Type',      type:'select', opts:['Online Shopping Fraud','UPI / Banking Fraud','Investment Scam','Job Fraud','Other'] },
      { id:'date',   label:'Date of Fraud',   type:'date', required:true },
      { id:'amount', label:'Amount Lost (₹)', required:true },
      { id:'details',label:'Details',         type:'textarea', required:true }
    ]
  },
  domestic_violence: {
    title: 'DV Protection Application',
    desc: 'Under Protection of Women from Domestic Violence Act, 2005',
    fields: [
      { id:'name',       label:'Aggrieved Person Name',  required:true },
      { id:'address',    label:'Current Address',        type:'textarea', required:true },
      { id:'respondent', label:'Respondent Name',        required:true },
      { id:'relation',   label:'Relation',               type:'select', opts:['Husband','Father-in-law','Brother-in-law','Other'] },
      { id:'type',       label:'Type of Violence',       type:'select', opts:['Physical','Verbal / Emotional','Economic','Multiple'] },
      { id:'incident',   label:'Incident Details',       type:'textarea', required:true },
      { id:'relief',     label:'Relief Sought',          type:'select', opts:['Protection Order','Residence Order','Monetary Relief','All of the above'] }
    ]
  },
  posh_complaint: {
    title: 'POSH Workplace Complaint',
    desc: 'Under Sexual Harassment of Women at Workplace Act, 2013',
    fields: [
      { id:'name',        label:'Your Name',       required:true },
      { id:'company',     label:'Company',         required:true },
      { id:'designation', label:'Your Designation',required:true },
      { id:'respondent',  label:'Accused Name',    required:true },
      { id:'dates',       label:'Incident Date(s)',required:true },
      { id:'incident',    label:'Description',     type:'textarea', required:true }
    ]
  },
  rti_application: {
    title: 'RTI Application',
    desc: 'Under the Right to Information Act, 2005 — Section 6(1)',
    fields: [
      { id:'name',    label:'Applicant Name',          required:true },
      { id:'address', label:'Applicant Address',       type:'textarea', required:true },
      { id:'phone',   label:'Phone Number',            required:true },
      { id:'dept',    label:'Public Authority / Dept', required:true, placeholder:'e.g. District Collector Office' },
      { id:'info',    label:'Information Sought',      type:'textarea', required:true, placeholder:'1. ...\n2. ...' },
      { id:'period',  label:'Period',                  placeholder:'e.g. FY 2023–24' },
      { id:'fee',     label:'Fee Mode',                type:'select', opts:['Court Fee Stamp ₹10','Indian Postal Order ₹10','BPL (exempt from fee)'] }
    ]
  },
  police_complaint: {
    title: 'Police Complaint (FIR Request)',
    desc: 'Under CrPC Section 154',
    fields: [
      { id:'name',    label:'Complainant Name',    required:true },
      { id:'address', label:'Address',             type:'textarea', required:true },
      { id:'phone',   label:'Phone',               required:true },
      { id:'station', label:'Police Station',      required:true },
      { id:'date',    label:'Incident Date',       type:'date', required:true },
      { id:'place',   label:'Place of Incident',   required:true },
      { id:'accused', label:'Accused Name(s)',      placeholder:'Leave blank if unknown' },
      { id:'details', label:'Details of Offence',  type:'textarea', required:true }
    ]
  },
  eviction_notice: {
    title: 'Tenant Eviction Notice',
    desc: 'Under Transfer of Property Act / State Rent Control Acts',
    fields: [
      { id:'landlord', label:'Landlord Name',      required:true },
      { id:'tenant',   label:'Tenant Name',        required:true },
      { id:'property', label:'Property Address',   type:'textarea', required:true },
      { id:'reason',   label:'Reason for Eviction',type:'select', opts:['Non-payment of rent','Expiry of agreement','Personal use','Misuse of property'] },
      { id:'vacate_by',label:'Vacate By Date',     type:'date', required:true }
    ]
  },
  rent_dispute: {
    title: 'Rent Dispute Complaint',
    desc: 'Under State Rent Control Acts',
    fields: [
      { id:'tenant',   label:'Tenant Name',        required:true },
      { id:'landlord', label:'Landlord Name',      required:true },
      { id:'property', label:'Property Address',   type:'textarea', required:true },
      { id:'rent',     label:'Agreed Rent (₹/month)', required:true },
      { id:'dispute',  label:'Dispute Type',       type:'select', opts:['Excessive rent demanded','Security deposit not returned','Essential services cut','Illegal eviction attempt'] },
      { id:'details',  label:'Details',            type:'textarea', required:true }
    ]
  }
};

let currentTemplate = 'wrongful_termination';

// ── INIT ──
document.querySelector('.nav')?.classList.add('solid');

// URL param
const urlTemplate = new URLSearchParams(location.search).get('template');
if (urlTemplate && TEMPLATES[urlTemplate]) currentTemplate = urlTemplate;

// ── TEMPLATE BUTTONS ──
document.querySelectorAll('.template-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTemplate = btn.dataset.template;
    renderForm(currentTemplate);
    clearPreview();
  });
});

// Mark active
document.querySelectorAll('.template-btn').forEach(btn => {
  if (btn.dataset.template === currentTemplate) btn.classList.add('active');
  else btn.classList.remove('active');
});

// ── SEARCH ──
document.getElementById('templateSearch')?.addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll('.template-btn').forEach(btn => {
    btn.style.display = btn.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
  document.querySelectorAll('.tg-label').forEach(label => {
    const group = label.parentElement;
    const visible = [...group.querySelectorAll('.template-btn')].some(b => b.style.display !== 'none');
    label.style.display = visible ? '' : 'none';
  });
});

// ── RENDER FORM ──
function renderForm(tplKey) {
  const tpl = TEMPLATES[tplKey];
  if (!tpl) return;
  document.getElementById('docTitle').textContent = tpl.title;
  document.getElementById('docDesc').textContent = tpl.desc;
  const form = document.getElementById('docForm');
  form.innerHTML = '';
  tpl.fields.forEach(f => {
    const group = document.createElement('div');
    group.className = 'form-group';
    const req = f.required ? ' <span class="req">*</span>' : '';
    let input;
    if (f.type === 'textarea') {
      input = `<textarea id="field_${f.id}" name="${f.id}" class="form-textarea" rows="3" placeholder="${f.placeholder||''}"${f.required?' required':''}></textarea>`;
    } else if (f.type === 'select') {
      input = `<select id="field_${f.id}" name="${f.id}" class="form-select"${f.required?' required':''}><option value="">— Select —</option>${(f.opts||[]).map(o=>`<option value="${o}">${o}</option>`).join('')}</select>`;
    } else {
      input = `<input type="${f.type||'text'}" id="field_${f.id}" name="${f.id}" class="form-input" placeholder="${f.placeholder||''}"${f.required?' required':''}>`;
    }
    group.innerHTML = `<label for="field_${f.id}">${f.label}${req}</label>${input}`;
    form.appendChild(group);
  });
}

// ── GENERATE ──
document.getElementById('generateBtn')?.addEventListener('click', async () => {
  const tpl = TEMPLATES[currentTemplate];
  if (!tpl) return;
  const form = document.getElementById('docForm');
  let valid = true;
  tpl.fields.filter(f => f.required).forEach(f => {
    const el = document.getElementById(`field_${f.id}`);
    if (!el || !el.value.trim()) {
      el?.classList.add('error');
      el?.addEventListener('input', () => el.classList.remove('error'), { once: true });
      valid = false;
    }
  });
  if (!valid) return;

  const btnText = document.getElementById('generateBtnText');
  const spinner = document.getElementById('generateSpinner');
  btnText.textContent = 'Generating…'; spinner.classList.remove('hidden');

  // Collect fields
  const values = {};
  tpl.fields.forEach(f => { values[f.id] = document.getElementById(`field_${f.id}`)?.value.trim() || ''; });
  const lang = document.getElementById('docLang')?.value || 'en';

  try {
    const res = await fetchApi('/api/document/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template: currentTemplate, fields: values, language: lang })
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    showPreview(data.document);
  } catch {
    showPreview(generateLocal(tpl, values));
  } finally {
    btnText.textContent = 'Generate Document →'; spinner.classList.add('hidden');
  }
});

function generateLocal(tpl, v) {
  const today = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
  const get = id => v[id] || '[Not provided]';
  let doc = `DATE: ${today}\n\nTO,\n\nSUBJECT: ${tpl.title} — ${tpl.desc}\n\n`;
  if (currentTemplate === 'rti_application') {
    doc = `TO,\nThe Public Information Officer,\n${get('dept')}\n\nDATE: ${today}\n\nSUBJECT: Application for Information under RTI Act, 2005 — Section 6(1)\n\nI, ${get('name')}, residing at ${get('address')}, Phone: ${get('phone')}, hereby seek the following information:\n\n${get('info')}\n\nPeriod: ${get('period') || 'As applicable'}\nFee Mode: ${get('fee')}\n\nYours faithfully,\n${get('name')}\nDate: ${today}`;
  } else {
    tpl.fields.forEach(f => { if (v[f.id]) doc += `${f.label}: ${v[f.id]}\n`; });
    const nameField = tpl.fields.find(f => ['name','complainant','tenant','applicant'].some(k => f.id.includes(k)));
    doc += `\nYours faithfully,\n${nameField ? v[nameField.id] : '[Name]'}\nDate: ${today}`;
  }
  return doc;
}

function showPreview(text) {
  const body = document.getElementById('previewBody');
  const div = document.createElement('div');
  div.className = 'preview-document';
  div.textContent = text;
  body.innerHTML = '';
  body.appendChild(div);
}

function clearPreview() {
  document.getElementById('previewBody').innerHTML = `<div class="preview-placeholder"><div class="pp-icon">📄</div><p>Fill in the form and click <strong>Generate Document</strong> to see your document here.</p></div>`;
}

// ── PREVIEW ACTIONS ──
document.getElementById('copyDocBtn')?.addEventListener('click', () => {
  const doc = document.querySelector('.preview-document');
  if (doc) { navigator.clipboard.writeText(doc.textContent); }
});
document.getElementById('downloadDocBtn')?.addEventListener('click', () => {
  const doc = document.querySelector('.preview-document');
  if (!doc) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([doc.textContent], { type:'text/plain' }));
  a.download = `${currentTemplate}.txt`; a.click();
});
document.getElementById('printDocBtn')?.addEventListener('click', () => {
  const doc = document.querySelector('.preview-document');
  if (!doc) return;
  const w = window.open('', '_blank');
  w.document.write(`<html><head><title>NyayaMithra Document</title><style>body{font-family:monospace;padding:48px;line-height:2;font-size:13px;white-space:pre-wrap}</style></head><body>${doc.textContent}</body></html>`);
  w.document.close(); w.focus(); w.print();
});

// ── CLEAR FORM ──
document.getElementById('clearFormBtn')?.addEventListener('click', () => {
  document.querySelectorAll('.form-input,.form-textarea').forEach(el => { el.value=''; el.classList.remove('error'); });
  document.querySelectorAll('.form-select').forEach(el => { el.selectedIndex=0; el.classList.remove('error'); });
  clearPreview();
});

// ── INITIAL RENDER ──
renderForm(currentTemplate);

