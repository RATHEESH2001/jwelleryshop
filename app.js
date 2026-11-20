// ---------- Demo data (in memory only) ----------
const rates = { Gold: 10000, Silver: 100, Platinum: 4500 };
const GST = 0.03, MELT = 0.02, DISC_LIMIT = { Cashier: 5, Admin: 100 };
let items = [
  { sku:'GR-22K-0045', name:'Gold Ring', metal:'Gold', purity:'22K', wt:6.2, stone:0, qty:4 },
  { sku:'GN-22K-0112', name:'Gold Necklace', metal:'Gold', purity:'22K', wt:10, stone:5000, qty:2 },
  { sku:'GB-22K-0080', name:'Gold Bangle', metal:'Gold', purity:'22K', wt:18.5, stone:0, qty:1 },
  { sku:'SC-925-0210', name:'Silver Chain', metal:'Silver', purity:'925', wt:25, stone:0, qty:9 },
  { sku:'PD-18K-0033', name:'Diamond Pendant', metal:'Gold', purity:'18K', wt:3.4, stone:18000, qty:3 }
];
let customers = [
  { id:1, name:'Meena R', phone:'98400 11122', spend:245000, points:2450, scheme:{paid:7,total:11,amt:5000} },
  { id:2, name:'Karthik S', phone:'98410 33445', spend:82000, points:820, scheme:null },
  { id:3, name:'Lakshmi V', phone:'98940 55667', spend:410000, points:4100, scheme:{paid:11,total:11,amt:10000} }
];
let sales = []; let invNo = 1001;

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
const role = () => ($('#role') || { value: 'Admin' }).value;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}

// ---------- Navigation ----------
$('#nav').onclick = e => {
  const p = e.target.dataset.p; if(!p) return;
  $$('#nav button').forEach(b=>b.classList.toggle('on',b===e.target));
  $$('.page').forEach(s=>s.classList.toggle('on',s.id===p));
  renderAll();
};

// ---------- Dashboard ----------
function renderDash(){
  const stock = items.reduce((a,i)=>a+i.wt*i.qty,0);
  const today = sales.reduce((a,s)=>a+s.total,0);
  $('#stats').innerHTML = [
    ['Items in stock', items.reduce((a,i)=>a+i.qty,0)],
    ['Metal weight', stock.toFixed(1)+' g'],
    ['Sales today', inr(today)],
    ['Invoices', sales.length],
    ['Low-stock alerts', items.filter(i=>i.qty<=1).length]
  ].map(([l,v])=>`<div class="card"><b>${v}</b><span>${l}</span></div>`).join('');
  $('#rates').innerHTML = Object.keys(rates).map(m=>
    `<label>${m} (₹/g)<input type="number" data-m="${m}" value="${rates[m]}"></label>`).join('');
  $$('#rates input').forEach(i=>i.onchange=()=>{
    if(role()!=='Admin'){toast('Only Admin can change rates');i.value=rates[i.dataset.m];return}
    rates[i.dataset.m]=+i.value; toast(i.dataset.m+' rate updated'); renderPOS();
  });
}

// ---------- Inventory ----------
let barcodeSequence=Date.now();
function renderInv(){
  const q = $('#q').value.toLowerCase();
  const rows = items.filter(i=>(i.name+i.sku).toLowerCase().includes(q));
  $('#invTable').innerHTML = `<tr><th>SKU</th><th>Item</th><th>Metal</th><th>Purity</th><th class="r">Net wt (g)</th><th class="r">Stone</th><th class="r">Qty</th><th>Status</th><th>Barcode</th><th>Print</th></tr>` +
    rows.map(i=>`<tr><td>${safe(i.sku)}</td><td>${safe(i.name)}</td><td>${safe(i.metal)}</td><td>${safe(i.purity)}</td><td class="r">${i.wt}</td><td class="r">${inr(i.stone)}</td><td class="r">${i.qty}</td><td><span class="tag ${i.qty<=1?'low':'okt'}">${i.qty===0?'Sold out':i.qty<=1?'Low stock':'In stock'}</span></td><td class="actions">${i.barcode?`<small class="barcode-code">${safe(i.barcode)}</small>`:''}<button class="text-btn" data-barcode="${safe(i.sku)}">Generate barcode</button></td><td><button class="text-btn" data-print-barcode="${safe(i.sku)}">Print</button></td></tr>`).join('')
    || '<tr><td colspan="10">No items match. Try another name or SKU.</td></tr>';
  $('#invTable').onclick=e=>{
    const generate=e.target.closest('[data-barcode]');
    const print=e.target.closest('[data-print-barcode]');
    if(generate){
      const item=items.find(i=>i.sku===generate.dataset.barcode);
      if(item) showBarcode(item);
    }else if(print){
      const item=items.find(i=>i.sku===print.dataset.printBarcode);
      if(item) showBarcode(item,true);
    }
  };
}
function ensureBarcode(item){
  if(!item.barcode){
    let code;
    do { code=`JMS${Date.now().toString(36).toUpperCase()}${(barcodeSequence++).toString(36).toUpperCase().padStart(4,'0')}`; }
    while(items.some(existing=>existing!==item&&existing.barcode===code));
    item.barcode=code;
  }
  return item.barcode;
}
function barcodeSvg(value){
  let seed=0;
  for(let i=0;i<value.length;i++) seed=(seed*31+value.charCodeAt(i))>>>0;
  let bits='1011';
  for(let i=0;i<value.length*8;i++){
    seed=(seed*1664525+1013904223)>>>0;
    bits+=((seed>>>31)&1).toString();
  }
  bits+='1101';
  const bars=bits.split('').map((bit,index)=>bit==='1'?`<rect x="${index*2}" y="0" width="2" height="62"/>`:'').join('');
  return `<svg class="demo-barcode" role="img" aria-label="Demo barcode" viewBox="0 0 ${bits.length*2} 62" xmlns="http://www.w3.org/2000/svg">${bars}</svg>`;
}
function showBarcode(item,printAfterOpen=false){
  const code=ensureBarcode(item);
  renderInv();
  $('#invBox').innerHTML=`<div class="barcode-label"><h2>Demo barcode</h2><p>${safe(item.name)} · ${safe(item.sku)}</p>${barcodeSvg(code)}<b class="barcode-code">${safe(code)}</b><div class="acts"><button class="btn" data-print-label>Print</button><button class="btn secondary" data-close-modal>Close</button></div></div>`;
  $('#invBox').querySelector('[data-print-label]').onclick=()=>window.print();
  $('#modal').classList.remove('hide');
  if(printAfterOpen) setTimeout(()=>window.print(),150);
}
$('#q').oninput = renderInv;
$('#addBtn').onclick = () => $('#addForm').classList.toggle('hide');
$('#addForm').onsubmit = e => {
  e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
  const code = f.metal[0]+f.name[0].toUpperCase();
  items.push({ sku:`${code}-${f.purity}-${String(items.length*37+100).padStart(4,'0')}`, name:f.name, metal:f.metal, purity:f.purity, wt:+f.wt, stone:+f.stone||0, qty:1 });
  e.target.reset(); e.target.classList.add('hide'); toast('Item saved with new SKU'); renderAll();
};

// ---------- POS ----------
function calc(){
  const it = items.find(i=>i.sku===$('#pItem').value);
  if(!it) return null;

  const metal = it.wt * rates[it.metal];

  // Making charges
  const mk = metal * (+$('#pMk').value || 0) / 100;

  // Wastage charges
  const wastage = metal * (+$('#pWastage').value || 0) / 100;

  const stone = it.stone;

  const sub = metal + mk + wastage + stone;

  const disc = sub * (+$('#pDisc').value || 0) / 100;
  const taxable = sub - disc;

  const gst = taxable * GST;
  const total = taxable + gst;

  const oldFine = (+$('#oWt').value || 0) *
                  (1-MELT) *
                  (+$('#oPur').value) / 0.916;

  const oldVal = oldFine * rates.Gold;
  const pay = Math.max(total-oldVal,0);

  return {
    it,
    metal,
    mk,
    wastage,
    stone,
    disc,
    gst,
    total,
    oldVal,
    pay,
    oldWt: +$('#oWt').value || 0
  };
}
function renderPOS(){
  const keep = $('#pItem').value;
  $('#pCust').innerHTML = customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
  $('#pItem').innerHTML = items.filter(i=>i.qty>0).map(i=>`<option value="${i.sku}">${i.sku} – ${i.name}</option>`).join('');
  if(keep) $('#pItem').value = keep;
  updateBill();
}
function updateBill(){
  const c = calc();
  if(!c){ $('#billTbl').innerHTML='<tr><td>No stock available. Add items in Inventory.</td></tr>'; return }
  const r = (l,v,cls='')=>`<tr class="${cls}"><td>${l}</td><td class="r">${v}</td></tr>`;
  $('#billTbl').innerHTML =
    r(`Metal (${c.it.wt} g × ${inr(rates[c.it.metal])})`,inr(c.metal)) + r('Making charges',inr(c.mk)) +
    r('Wastage charges',inr(c.wastage)) +
    r('Stone cost',inr(c.stone)) + (c.disc?r('Discount','− '+inr(c.disc)):'') + r('GST 3%',inr(c.gst)) +
    r('Bill total',inr(c.total),'tot') + (c.oldVal?r('Old-gold exchange','− '+inr(c.oldVal)):'') +
    r('Customer pays',inr(c.pay),'tot');
  const lim = DISC_LIMIT[role()], d = +$('#pDisc').value||0;
  $('#discMsg').textContent = d>lim ? `Discounts above ${lim}% need manager approval.` : '';
}
['pItem','pMk','pDisc','oWt','oPur' ,'pWastage'].forEach(id=>$('#'+id).oninput=updateBill);
if($('#role')) $('#role').onchange = updateBill;
$('#genBtn').onclick = () => {
  const c = calc(); if(!c) return;
  if((+$('#pDisc').value||0) > DISC_LIMIT[role()]) { toast('Discount needs approval'); return }
  const cust = customers.find(x=>x.id==$('#pCust').value);
  const s = { no:invNo++, date:new Date().toLocaleDateString('en-IN'), cust:cust.name, item:c.it.name, pay:$('#pPay').value, total:c.pay, c };
  sales.push(s); c.it.qty--; cust.spend+=c.pay; cust.points+=Math.floor(c.pay/100);
  showInvoice(s); renderAll(); $('#pDisc').value=0; $('#oWt').value=0; updateBill();
};
function showInvoice(s){
  const c=s.c, row=(l,v,t='')=>`<div class="row ${t}"><span>${l}</span><span>${v}</span></div>`;
  $('#invBox').innerHTML = `<h2>Invoice #${s.no}</h2><small>${s.date} · ${s.cust}</small><hr>` +
    row(c.it.name+' ('+c.it.sku+')','') + row('Metal value',inr(c.metal)) + row('Making',inr(c.mk)) + row('Wastage',inr(c.wastage))  + row('Stone',inr(c.stone)) +
    (c.disc?row('Discount','− '+inr(c.disc)):'') + row('GST 3%',inr(c.gst)) + row('Total',inr(c.total),'t') +
    (c.oldVal?row(`Old gold (${c.oldWt} g)`,'− '+inr(c.oldVal)):'') + row('Paid by '+s.pay,inr(s.total),'t') +
    `<div class="acts"><button class="btn" onclick="window.print()">Print</button><button class="btn" onclick="$('#modal').classList.add('hide')">Close</button></div>`;
  $('#modal').classList.remove('hide');
}

// ---------- CRM ----------
function renderCRM(){
  $('#crmTable').innerHTML = `<tr><th>Name</th><th>Phone</th><th class="r">Total spend</th><th class="r">Points</th></tr>` +
    customers.map(c=>`<tr><td>${c.name}</td><td>${c.phone}</td><td class="r">${inr(c.spend)}</td><td class="r">${c.points}</td></tr>`).join('');
  $('#scheme').innerHTML = customers.filter(c=>c.scheme).map(c=>{
    const s=c.scheme, done=s.paid>=s.total;
    return `<p><b>${c.name}</b> – ${inr(s.amt)} / month · ${s.paid} of ${s.total} paid
      <span class="tag ${done?'okt':''}">${done?'Matured: '+inr(s.amt*s.total+s.amt)+' credit':'Active'}</span></p>
      <div class="bar-scheme"><i style="width:${s.paid/s.total*100}%"></i></div>
      ${done?'':`<p><button class="btn" onclick="payInst(${c.id})">Record instalment</button></p>`}`}).join('<hr>');
}
window.payInst = id => { const s=customers.find(c=>c.id===id).scheme; s.paid++; toast('Instalment recorded'); renderCRM() };

// ---------- Reports ----------
function renderRep(){
  const t = sales.reduce((a,s)=>a+s.total,0), g = sales.reduce((a,s)=>a+s.c.gst,0);
  $('#repStats').innerHTML = [['Revenue',inr(t)],['GST collected',inr(g)],['Old-gold taken',inr(sales.reduce((a,s)=>a+s.c.oldVal,0))]]
    .map(([l,v])=>`<div class="card"><b>${v}</b><span>${l}</span></div>`).join('');
  $('#ledger').innerHTML = `<tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Item</th><th>Payment</th><th class="r">Amount</th></tr>` +
    (sales.map(s=>`<tr><td>#${s.no}</td><td>${s.date}</td><td>${s.cust}</td><td>${s.item}</td><td>${s.pay}</td><td class="r">${inr(s.total)}</td></tr>`).join('')
    || '<tr><td colspan="6">No sales yet. Create a bill in Billing and it will appear here.</td></tr>');
}

// ---------- Workflow ----------
const steps = [
  ['Supplier records are ready','Review supplier details, opening balances and payment history.'],
  ['Gold rates are set for the day','24K, 22K, 18K, silver and platinum rates guide pricing.'],
  ['Job work is tracked when needed','Record metal issued, labour charges and expected delivery.'],
  ['Inventory is checked','Confirm SKU, purity, weight and available quantity.'],
  ['Orders and advances are followed','Track customisation, booking amount and delivery date.'],
  ['Billing calculates the sale','POS applies the selected item, rate, making charges and GST.'],
  ['Customer service continues after sale','Customer loyalty and repair records keep follow-up details.'],
  ['Accounting records money movement','Review income, expenses, payment method and daily profit/loss.'],
  ['Reports show the latest activity','Review the sales ledger and current business summaries.']
];
let workflowStep=-1, workflowTimer=null;
function renderSteps(state=workflowStep){
  $('#steps').innerHTML = steps.map((s,i)=>`<li class="${i<state?'done':i===state?'act':''}"><span class="n">${i+1}</span><div><b>${s[0]}</b><small>${s[1]}</small></div></li>`).join('');
}
$('#flow').onclick=e=>{
  const link=e.target.closest('[data-go]');
  if(link) navigateTo(link.dataset.go);
};
$('#runFlow').onclick = () => {
  if(workflowTimer) clearInterval(workflowTimer);
  const button=$('#runFlow');
  button.disabled=true; button.textContent='Walking through workflow…';
  let i=-1; workflowStep=-1; renderSteps();
  workflowTimer=setInterval(()=>{
    i++; workflowStep=i; renderSteps();
    if(i>=steps.length-1){
      clearInterval(workflowTimer); workflowTimer=null; workflowStep=steps.length; renderSteps();
      button.disabled=false; button.textContent='Replay workflow walkthrough';
      toast('Workflow walkthrough complete');
    }
  },600);
};

// ---------- Business management modules ----------
const localDate = (offset=0) => {
  const d=new Date(); d.setDate(d.getDate()+offset);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const safe = value => String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sampleToday = localDate(), sampleYesterday = localDate(-1);
const modules = {
  sup:{
    target:'supContent', name:'Supplier', idField:'supplierId', prefix:'SUP', filterField:'supplierType',
    fields:[
      ['supplierId','Supplier ID','text'],['supplierName','Supplier Name','text'],['companyName','Company Name','text'],
      ['contactNumber','Contact Number','tel'],['email','Email','email'],['address','Address','textarea'],
      ['gstNumber','GST Number','text'],['supplierType','Supplier Type','select',['Gold','Silver','Diamond','Jewellery']],
      ['openingBalance','Opening Balance (₹)','number'],['paymentHistory','Payment History','textarea'],
      ['status','Supplier Status','select',['Active','Inactive']]
    ],
    columns:['supplierId','supplierName','companyName','supplierType','contactNumber','openingBalance','status'],
    data:[
      {supplierId:'SUP-1001',supplierName:'Ravi Metals',companyName:'Ravi Gold Traders',contactNumber:'98410 22110',email:'accounts@ravigold.example',address:'T. Nagar, Chennai',gstNumber:'33AABCR1234F1Z5',supplierType:'Gold',openingBalance:125000,paymentHistory:'12 Nov 2026 · UPI · ₹75,000\n28 Oct 2026 · Bank · ₹50,000',status:'Active'},
      {supplierId:'SUP-1002',supplierName:'Anand Gems',companyName:'Anand Diamond House',contactNumber:'98422 77889',email:'sales@anandgems.example',address:'Coimbatore, Tamil Nadu',gstNumber:'33AACCA5678L1Z2',supplierType:'Diamond',openingBalance:48000,paymentHistory:'15 Nov 2026 · Bank · ₹32,000',status:'Active'}
    ]
  },
  job:{
    target:'jobContent', name:'Job Work', idField:'jobWorkId', prefix:'JOB', filterField:'jobStatus',
    fields:[
      ['jobWorkId','Job Work ID','text'],['goldsmithName','Goldsmith Name','text'],['contactNumber','Contact Number','tel'],
      ['jobType','Job Type','select',['Making','Polishing','Repair']],['itemDetails','Jewellery Item Details','text'],
      ['metalType','Metal Type','select',['Gold','Silver','Platinum']],['purity','Purity','text'],
      ['grossWeight','Gross Weight (g)','number'],['netWeight','Net Weight (g)','number'],
      ['metalIssuedWeight','Metal Issued Weight (g)','number'],['expectedWastage','Expected Wastage (g)','number'],
      ['labourCharges','Labour Charges (₹)','number'],['issueDate','Issue Date','date'],
      ['expectedDeliveryDate','Expected Delivery Date','date'],['actualDeliveryDate','Actual Delivery Date','date',null,true],
      ['jobStatus','Job Status','select',['Pending','In Progress','Completed','Delivered']]
    ],
    columns:['jobWorkId','goldsmithName','jobType','itemDetails','metalType','metalIssuedWeight','expectedDeliveryDate','jobStatus'],
    data:[
      {jobWorkId:'JOB-2001',goldsmithName:'Suresh Kumar',contactNumber:'98430 11223',jobType:'Making',itemDetails:'22K Temple necklace · 1 piece',metalType:'Gold',purity:'22K',grossWeight:42.5,netWeight:39.8,metalIssuedWeight:40.2,expectedWastage:0.4,labourCharges:18500,issueDate:sampleYesterday,expectedDeliveryDate:localDate(5),actualDeliveryDate:'',jobStatus:'In Progress'},
      {jobWorkId:'JOB-2002',goldsmithName:'Mohan Das',contactNumber:'98431 44556',jobType:'Polishing',itemDetails:'Gold bangles · 2 pieces',metalType:'Gold',purity:'22K',grossWeight:31,netWeight:30.6,metalIssuedWeight:0,expectedWastage:0,labourCharges:2400,issueDate:sampleToday,expectedDeliveryDate:localDate(2),actualDeliveryDate:'',jobStatus:'Pending'}
    ]
  },
  repair:{
    target:'repairContent', name:'Repair', idField:'repairId', prefix:'RPR', filterField:'repairStatus',
    fields:[
      ['repairId','Repair ID','text'],['customerName','Customer Name','text'],['contactNumber','Contact Number','tel'],
      ['jewelleryItem','Jewellery Item','text'],['itemDescription','Item Description','textarea'],
      ['repairType','Repair Type','select',['Resizing','Stone setting','Polishing','Soldering','Other']],
      ['receivedDate','Received Date','date'],['expectedDeliveryDate','Expected Delivery Date','date'],
      ['repairCharges','Repair Charges (₹)','number'],['advanceAmount','Advance Amount (₹)','number'],
      ['balanceAmount','Balance Amount (₹)','number',null,true],['repairStatus','Repair Status','select',['Received','In Progress','Completed','Delivered']],
      ['customerNotes','Customer Notes','textarea',null,true]
    ],
    columns:['repairId','customerName','contactNumber','jewelleryItem','repairType','expectedDeliveryDate','balanceAmount','repairStatus'],
    data:[
      {repairId:'RPR-3001',customerName:'Meena R',contactNumber:'98400 11122',jewelleryItem:'Gold ring',itemDescription:'22K ring, loose centre stone',repairType:'Stone setting',receivedDate:sampleToday,expectedDeliveryDate:localDate(3),repairCharges:1800,advanceAmount:800,balanceAmount:1000,repairStatus:'In Progress',customerNotes:'Call before delivery; customer prefers evening pickup.'},
      {repairId:'RPR-3002',customerName:'Karthik S',contactNumber:'98410 33445',jewelleryItem:'Silver chain',itemDescription:'Clasp replacement',repairType:'Soldering',receivedDate:sampleYesterday,expectedDeliveryDate:localDate(1),repairCharges:650,advanceAmount:650,balanceAmount:0,repairStatus:'Received',customerNotes:'Original clasp returned to customer.'}
    ]
  },
  acct:{
    target:'acctContent', name:'Transaction', idField:'transactionId', prefix:'TXN', filterField:'transactionType',
    fields:[
      ['transactionId','Transaction ID','text'],['transactionDate','Transaction Date','date'],
      ['transactionType','Transaction Type','select',['Income','Expense']],
      ['category','Category','select',['Sales','Supplier Payment','Job Work','Repair','Rent','Utilities','Salary','Other']],
      ['description','Description','textarea'],['paymentMethod','Payment Method','select',['Cash','UPI','Bank','Card']],
      ['amount','Amount (₹)','number'],['referenceNumber','Reference Number','text',null,true],
      ['paymentStatus','Payment Status','select',['Paid','Pending','Part Paid']]
    ],
    columns:['transactionId','transactionDate','transactionType','category','description','paymentMethod','amount','paymentStatus'],
    data:[
      {transactionId:'TXN-4001',transactionDate:sampleToday,transactionType:'Income',category:'Sales',description:'Counter sale · Invoice #1000',paymentMethod:'UPI',amount:68500,referenceNumber:'UPI-458201',paymentStatus:'Paid'},
      {transactionId:'TXN-4002',transactionDate:sampleToday,transactionType:'Expense',category:'Job Work',description:'Goldsmith labour settlement',paymentMethod:'Bank',amount:12500,referenceNumber:'NEFT-220718',paymentStatus:'Paid'},
      {transactionId:'TXN-4003',transactionDate:sampleYesterday,transactionType:'Expense',category:'Utilities',description:'Workshop electricity',paymentMethod:'UPI',amount:4200,referenceNumber:'UPI-457996',paymentStatus:'Paid'}
    ]
  },
  orders:{
    target:'ordersContent', name:'Order', idField:'orderId', prefix:'ORD', filterField:'orderStatus',
    fields:[
      ['orderId','Order ID','text'],['customerName','Customer Name','text'],['contactNumber','Contact Number','tel'],
      ['jewelleryItem','Jewellery Item','text'],['customisationDetails','Customisation Details','textarea'],
      ['metalType','Metal Type','select',['Gold','Silver','Diamond','Platinum']],['purity','Purity','text'],
      ['estimatedWeight','Estimated Weight (g)','number'],['estimatedAmount','Estimated Amount (₹)','number'],
      ['advanceAmount','Advance Amount (₹)','number'],['remainingBalance','Remaining Balance (₹)','number',null,true],
      ['bookingDate','Booking Date','date'],['expectedDeliveryDate','Expected Delivery Date','date'],
      ['orderStatus','Order Status','select',['Booked','Processing','Ready','Delivered','Cancelled']]
    ],
    columns:['orderId','customerName','contactNumber','jewelleryItem','metalType','estimatedAmount','advanceAmount','remainingBalance','expectedDeliveryDate','orderStatus'],
    data:[
      {orderId:'ORD-5001',customerName:'Lakshmi V',contactNumber:'98940 55667',jewelleryItem:'Custom antique necklace',customisationDetails:'Lakshmi motif, 22K, green stone accents',metalType:'Gold',purity:'22K',estimatedWeight:28,estimatedAmount:245000,advanceAmount:75000,remainingBalance:170000,bookingDate:sampleYesterday,expectedDeliveryDate:localDate(14),orderStatus:'Processing'},
      {orderId:'ORD-5002',customerName:'Arjun P',contactNumber:'98420 66771',jewelleryItem:'Kids bracelet',customisationDetails:'Name engraving: Aarav',metalType:'Gold',purity:'18K',estimatedWeight:8,estimatedAmount:68000,advanceAmount:20000,remainingBalance:48000,bookingDate:sampleToday,expectedDeliveryDate:localDate(8),orderStatus:'Booked'}
    ]
  },
  goldrates:{
    target:'goldratesContent', name:'Gold Rate', idField:'rateId', prefix:'RATE',
    fields:[
      ['date','Date','date'],['gold24k','Gold 24K Rate (₹/g)','number'],['gold22k','Gold 22K Rate (₹/g)','number'],
      ['gold18k','Gold 18K Rate (₹/g)','number'],['silverRate','Silver Rate (₹/g)','number'],
      ['platinumRate','Platinum Rate (₹/g)','number'],['makingCharge','Making Charge (%)','number'],
      ['wastagePercentage','Wastage Percentage (%)','number']
    ],
    columns:['date','gold24k','gold22k','gold18k','silverRate','platinumRate','makingCharge','wastagePercentage'],
    data:[
      {rateId:'RATE-6001',date:sampleToday,gold24k:10917,gold22k:10000,gold18k:8182,silverRate:100,platinumRate:4500,makingCharge:12,wastagePercentage:2},
      {rateId:'RATE-6002',date:sampleYesterday,gold24k:10890,gold22k:9975,gold18k:8170,silverRate:99,platinumRate:4480,makingCharge:12,wastagePercentage:2}
    ]
  }
};

function moduleRecords(id){ return modules[id].data; }
function fieldLabel(id,key){
  const field=modules[id].fields.find(f=>f[0]===key);
  return field?field[1]:key;
}
function moduleCell(key,value){
  if(key.toLowerCase().includes('amount')||key.toLowerCase().includes('balance')||key==='openingBalance'||key==='labourCharges'||key.toLowerCase().includes('rate'))
    return inr(+value||0);
  if(key.toLowerCase().includes('status'))
    return `<span class="tag ${value==='Delivered'||value==='Completed'||value==='Paid'||value==='Active'||value==='Ready'?'okt':''}">${safe(value)}</span>`;
  return safe(value);
}
function moduleSummary(id){
  if(id==='acct'){
    const today=moduleRecords(id).filter(t=>t.transactionDate===localDate());
    const income=today.filter(t=>t.transactionType==='Income').reduce((n,t)=>n+(+t.amount||0),0);
    const expense=today.filter(t=>t.transactionType==='Expense').reduce((n,t)=>n+(+t.amount||0),0);
    const allIncome=moduleRecords(id).filter(t=>t.transactionType==='Income').reduce((n,t)=>n+(+t.amount||0),0);
    const allExpense=moduleRecords(id).filter(t=>t.transactionType==='Expense').reduce((n,t)=>n+(+t.amount||0),0);
    return `<div class="cards module-cards"><div class="card"><b>${inr(income)}</b><span>Today's income</span></div><div class="card"><b>${inr(expense)}</b><span>Today's expenses</span></div><div class="card"><b>${inr(allIncome-allExpense)}</b><span>Profit &amp; loss · all entries</span></div></div>`;
  }
  if(id==='goldrates'){
    const latest=moduleRecords(id).slice().sort((a,b)=>b.date.localeCompare(a.date))[0];
    if(latest) return `<div class="cards module-cards"><div class="card"><b>${inr(latest.gold24k)}</b><span>24K per gram</span></div><div class="card"><b>${inr(latest.gold22k)}</b><span>22K per gram</span></div><div class="card"><b>${inr(latest.gold18k)}</b><span>18K per gram</span></div><div class="card"><b>${inr(latest.silverRate)}</b><span>Silver per gram</span></div></div><p class="hint">The latest rate is used by POS billing for gold, silver and platinum.</p>`;
  }
  return '';
}
function renderModuleOverview(){
  const activeSuppliers=moduleRecords('sup').filter(r=>r.status==='Active').length;
  const supplierBalances=moduleRecords('sup').reduce((n,r)=>n+(+r.openingBalance||0),0);
  const openJobs=moduleRecords('job').filter(r=>!['Completed','Delivered'].includes(r.jobStatus)).length;
  const openRepairs=moduleRecords('repair').filter(r=>r.repairStatus!=='Delivered').length;
  const openOrders=moduleRecords('orders').filter(r=>!['Delivered','Cancelled'].includes(r.orderStatus));
  const orderBalance=openOrders.reduce((n,r)=>n+(+r.remainingBalance||0),0);
  const transactions=moduleRecords('acct');
  const todayTransactions=transactions.filter(t=>t.transactionDate===localDate());
  const income=todayTransactions.filter(t=>t.transactionType==='Income').reduce((n,t)=>n+(+t.amount||0),0);
  const expense=todayTransactions.filter(t=>t.transactionType==='Expense').reduce((n,t)=>n+(+t.amount||0),0);
  $('#moduleOverview').innerHTML=[
    ['Active suppliers',`${activeSuppliers} / ${moduleRecords('sup').length}`,'sup'],
    ['Supplier opening balances',inr(supplierBalances),'sup'],
    ['Open job work',openJobs,'job'],
    ['Repairs in progress',openRepairs,'repair'],
    ['Open orders',`${openOrders.length} · ${inr(orderBalance)} due`,'orders'],
    ["Today's net income",inr(income-expense),'acct']
  ].map(([label,value,page])=>`<button class="card overview-card" data-go="${page}"><b>${safe(value)}</b><span>${safe(label)}</span></button>`).join('');

  const upcoming=[
    ...moduleRecords('job').filter(r=>!['Completed','Delivered'].includes(r.jobStatus)).map(r=>({page:'job',id:r.jobWorkId,kind:'Job work',name:r.goldsmithName,item:r.itemDetails,date:r.expectedDeliveryDate,status:r.jobStatus})),
    ...moduleRecords('repair').filter(r=>r.repairStatus!=='Delivered').map(r=>({page:'repair',id:r.repairId,kind:'Repair',name:r.customerName,item:r.jewelleryItem,date:r.expectedDeliveryDate,status:r.repairStatus})),
    ...openOrders.map(r=>({page:'orders',id:r.orderId,kind:'Order',name:r.customerName,item:r.jewelleryItem,date:r.expectedDeliveryDate,status:r.orderStatus}))
  ].filter(r=>r.date).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5);
  $('#upcomingTable').innerHTML=`<thead><tr><th>Due</th><th>Type / Item</th><th>Contact</th><th>Status</th></tr></thead><tbody>${upcoming.length?upcoming.map(r=>`<tr><td>${safe(r.date)}</td><td><button class="text-btn" data-go="${r.page}">${safe(r.kind)} · ${safe(r.item)}</button><small class="block-mute">${safe(r.id)}</small></td><td>${safe(r.name)}</td><td>${moduleCell('status',r.status)}</td></tr>`).join(''):'<tr><td colspan="4">No open work or upcoming deliveries.</td></tr>'}</tbody>`;
  const latestTransactions=transactions.slice().sort((a,b)=>b.transactionDate.localeCompare(a.transactionDate)).slice(0,4);
  $('#recentTransactions').innerHTML=`<thead><tr><th>Date</th><th>Type</th><th>Category</th><th class="r">Amount</th></tr></thead><tbody>${latestTransactions.length?latestTransactions.map(t=>`<tr><td>${safe(t.transactionDate)}</td><td>${safe(t.transactionType)}</td><td>${safe(t.category)}</td><td class="r">${inr(t.amount)}</td></tr>`).join(''):'<tr><td colspan="4">No transactions recorded yet.</td></tr>'}</tbody>`;
  $('#moduleOverview').onclick=e=>{
    const button=e.target.closest('[data-go]'); if(button) navigateTo(button.dataset.go);
  };
  $('#upcomingTable').onclick=e=>{
    const button=e.target.closest('[data-go]'); if(button) navigateTo(button.dataset.go);
  };
}
function navigateTo(page){
  const button=$(`#nav button[data-p="${page}"]`);
  if(button) button.click();
}
function renderModule(id,restoreSearch=false,searchPosition=0){
  const cfg=modules[id], host=$('#'+cfg.target);
  if(!host) return;
  const q=(host.querySelector('[data-search]')||{}).value||'';
  const filter=(host.querySelector('[data-filter]')||{}).value||'';
  const options=cfg.filterField?[...new Set(moduleRecords(id).map(r=>r[cfg.filterField]).filter(Boolean))]:[];
  const rows=moduleRecords(id).filter(r=>{
    const matchSearch=Object.values(r).join(' ').toLowerCase().includes(q.toLowerCase());
    return matchSearch&&(!filter||r[cfg.filterField]===filter);
  });
  host.innerHTML=`${moduleSummary(id)}<div class="bar module-toolbar"><input data-search placeholder="Search ${cfg.name.toLowerCase()} records" value="${safe(q)}"><select data-filter aria-label="Filter records"><option value="">All ${cfg.filterField?fieldLabel(id,cfg.filterField):'records'}</option>${options.map(o=>`<option value="${safe(o)}" ${filter===o?'selected':''}>${safe(o)}</option>`).join('')}</select><button class="btn" data-action="add">Add ${cfg.name}</button></div><div class="table-wrap"><table><thead><tr>${cfg.columns.map(k=>`<th>${safe(fieldLabel(id,k))}</th>`).join('')}<th>Actions</th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${cfg.columns.map(k=>`<td>${moduleCell(k,r[k])}</td>`).join('')}<td class="actions"><button class="text-btn" data-action="view" data-id="${safe(r[cfg.idField])}">View</button><button class="text-btn" data-action="edit" data-id="${safe(r[cfg.idField])}">Edit</button><button class="text-btn danger" data-action="delete" data-id="${safe(r[cfg.idField])}">Delete</button></td></tr>`).join(''):`<tr><td colspan="${cfg.columns.length+1}">No ${cfg.name.toLowerCase()} records match. Try another search or filter.</td></tr>`}</tbody></table></div>`;
  host.querySelector('[data-search]').oninput=e=>renderModule(id,true,e.target.selectionStart);
  host.querySelector('[data-filter]').onchange=()=>renderModule(id);
  if(restoreSearch){
    const search=host.querySelector('[data-search]'); search.focus();
    if(search.setSelectionRange) search.setSelectionRange(searchPosition,searchPosition);
  }
  host.onclick=e=>{
    const button=e.target.closest('[data-action]'); if(!button) return;
    const action=button.dataset.action, key=button.dataset.id;
    if(action==='add') openModuleForm(id);
    if(action==='view') viewModuleRecord(id,key);
    if(action==='edit') openModuleForm(id,key);
    if(action==='delete'){
      const record=moduleRecords(id).find(r=>String(r[cfg.idField])===key);
      if(record&&confirm(`Delete ${cfg.name.toLowerCase()} ${key}?`)){
        cfg.data=cfg.data.filter(r=>String(r[cfg.idField])!==key);
        if(id==='goldrates') syncManagedRates();
        toast(`${cfg.name} deleted`); renderModule(id); renderDash();
      }
    }
  };
}
function moduleFormField(id,field,record,isNew){
  const [key,label,type,choices,optional]=field, value=record[key]??'';
  const locked=key===modules[id].idField||field[4]===true&&['balanceAmount','remainingBalance'].includes(key);
  const attr=`name="${safe(key)}" ${optional?'':'required'} ${locked?'readonly':''}`;
  if(type==='select') return `<label>${safe(label)}<select ${attr}>${choices.map(c=>`<option ${value===c?'selected':''}>${safe(c)}</option>`).join('')}</select></label>`;
  if(type==='textarea') return `<label>${safe(label)}<textarea ${attr} rows="2">${safe(value)}</textarea></label>`;
  return `<label>${safe(label)}<input ${attr} type="${safe(type)}" value="${safe(value)}" ${type==='number'?'min="0" step="0.01"':''} ${type==='date'&&!value&&key!=='actualDeliveryDate'?`value="${localDate()}"`:''}></label>`;
}
function calculateModuleValues(id,record){
  if(id==='repair') record.balanceAmount=Math.max((+record.repairCharges||0)-(+record.advanceAmount||0),0);
  if(id==='orders') record.remainingBalance=Math.max((+record.estimatedAmount||0)-(+record.advanceAmount||0),0);
  return record;
}
function openModuleForm(id,key){
  const cfg=modules[id], existing=key?moduleRecords(id).find(r=>String(r[cfg.idField])===key):null;
  if(key&&!existing) return;
  if(id==='goldrates'&&role()!=='Admin'){toast('Only Admin can manage gold rates');return}
  const record=existing?{...existing}:{};
  if(!existing){
    let serial=1001+moduleRecords(id).length;
    while(moduleRecords(id).some(r=>r[cfg.idField]===`${cfg.prefix}-${String(serial).padStart(4,'0')}`)) serial++;
    record[cfg.idField]=`${cfg.prefix}-${String(serial).padStart(4,'0')}`;
    if(id==='goldrates') record.date=localDate();
    if(id==='job'){record.issueDate=localDate();record.jobStatus='Pending'}
    if(id==='repair'){record.receivedDate=localDate();record.repairStatus='Received'}
    if(id==='acct'){record.transactionDate=localDate();record.transactionType='Expense';record.paymentStatus='Paid'}
    if(id==='orders'){record.bookingDate=localDate();record.orderStatus='Booked'}
    if(id==='sup') record.status='Active';
  }
  const title=existing?`Edit ${cfg.name}`:`Add ${cfg.name}`;
  $('#invBox').innerHTML=`<h2>${title}</h2><form id="moduleForm" data-module="${id}" data-edit="${existing?'1':'0'}" class="module-form">${cfg.fields.map(f=>moduleFormField(id,f,record,!existing)).join('')}<div class="acts"><button class="btn" type="submit">Save</button><button class="btn secondary" type="button" data-close-modal>Cancel</button></div></form>`;
  const form=$('#moduleForm');
  form.querySelectorAll('input[type="date"]').forEach(input=>{if(!input.value&&input.name!=='actualDeliveryDate')input.value=localDate()});
  form.oninput=()=>refreshComputedFields(id,form);
  form.onsubmit=e=>{
    e.preventDefault();
    if(id==='goldrates'&&role()!=='Admin'){toast('Only Admin can manage gold rates');return}
    const values=Object.fromEntries(new FormData(form));
    const saved=calculateModuleValues(id,{...record,...values});
    for(const f of cfg.fields) if(f[2]==='number') saved[f[0]]=+saved[f[0]]||0;
    if(existing) Object.assign(existing,saved); else cfg.data.unshift(saved);
    if(id==='goldrates') syncManagedRates();
    $('#modal').classList.add('hide');toast(`${cfg.name} ${existing?'updated':'added'}`);renderModule(id);renderDash();
  };
  $('#modal').classList.remove('hide');
}
function refreshComputedFields(id,form){
  const values=Object.fromEntries(new FormData(form));
  const computed=calculateModuleValues(id,values);
  ['balanceAmount','remainingBalance'].forEach(key=>{const input=form.elements.namedItem(key);if(input)input.value=computed[key]||0});
}
function viewModuleRecord(id,key){
  const cfg=modules[id], record=moduleRecords(id).find(r=>String(r[cfg.idField])===key);
  if(!record) return;
  $('#invBox').innerHTML=`<h2>${safe(cfg.name)} details</h2><div class="detail-grid">${cfg.fields.map(f=>`<div><small>${safe(f[1])}</small><b>${safe(record[f[0]]||'—')}</b></div>`).join('')}</div><div class="acts"><button class="btn" data-close-modal>Close</button></div>`;
  $('#modal').classList.remove('hide');
}
function syncManagedRates(){
  const latest=moduleRecords('goldrates').slice().sort((a,b)=>b.date.localeCompare(a.date))[0];
  if(!latest) return;
  rates.Gold=+latest.gold22k||0; rates.Silver=+latest.silverRate||0; rates.Platinum=+latest.platinumRate||0;
}
$('#modal').addEventListener('click',e=>{
  if(e.target=== $('#modal')||e.target.closest('[data-close-modal]')) $('#modal').classList.add('hide');
});

function renderAll(){ renderDash(); renderInv(); renderPOS(); renderCRM(); renderRep(); renderSteps(); Object.keys(modules).forEach(renderModule); renderModuleOverview(); }
renderAll();
