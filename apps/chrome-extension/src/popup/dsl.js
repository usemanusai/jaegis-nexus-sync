const defaultDsl = { steps: [] }

function el(tag, attrs={}, children=[]) {
  const e = document.createElement(tag)
  Object.entries(attrs).forEach(([k,v])=>{ if(k==='class') e.className=v; else if(k==='text') e.textContent=v; else e.setAttribute(k,v) })
  children.forEach(c=> e.appendChild(c))
  return e
}

function stepRow(step, idx, onChange, onMove, onRemove) {
  const row = el('div', { class: 'row' })
  const typeSel = el('select')
  ;['navigate','wait','click','type','submit','extract','rag_ingest'].forEach(t=>{
    const o = el('option', { value: t, text: t })
    if (step.type===t) o.selected = true
    typeSel.appendChild(o)
  })
  typeSel.addEventListener('change', ()=>{ step.type = typeSel.value; onChange() })
  row.appendChild(typeSel)

  const fields = el('div', { class: 'fields' })
  function renderFields(){
    fields.innerHTML = ''
    const addField = (label, key, placeholder='')=>{
      const input = el('input', { value: step[key]||'', placeholder })
      input.addEventListener('input', ()=>{ step[key]=input.value; onChange() })
      fields.appendChild(el('label', { text: label+': ' }))
      fields.appendChild(input)
    }
    if (step.type==='navigate') addField('url','url','https://...')
    if (step.type==='wait') addField('ms','ms','500')
    if (['click','type','submit','extract'].includes(step.type)) addField('selector','selector','#selector')
    if (step.type==='type') addField('text','text','value')
    if (step.type==='extract') addField('attribute','attribute','href (optional)')
    if (step.type==='rag_ingest') {
      addField('source','source','agi://workflow')
      const fromSel = el('select')
      ;['','lastExtract'].forEach(v=>{
        const o = el('option', { value: v, text: v||'(value)' })
        if ((step.from||'')===v) o.selected=true
        fromSel.appendChild(o)
      })
      fromSel.addEventListener('change', ()=>{ step.from = fromSel.value||undefined; onChange() })
      fields.appendChild(el('label', { text: 'from: ' }))
      fields.appendChild(fromSel)
      addField('value','value','used when from is empty')
    }
  }
  renderFields()

  const up = el('button', { text: '↑' }); up.addEventListener('click', ()=> onMove(idx, -1))
  const down = el('button', { text: '↓' }); down.addEventListener('click', ()=> onMove(idx, +1))
  const del = el('button', { text: '✕' }); del.addEventListener('click', ()=> onRemove(idx))

  row.appendChild(fields)
  row.appendChild(up); row.appendChild(down); row.appendChild(del)
  return row
}

export function initDslBuilder() {
  const dslArea = document.getElementById('dsl-json')
  const list = document.getElementById('steps')
  const out = document.getElementById('out')
  const addSel = document.getElementById('add-step')
  const importFile = document.getElementById('import-file')
  let dsl = defaultDsl

  function syncJson(){ dslArea.value = JSON.stringify(dsl, null, 2) }
  function render(){
    list.innerHTML = ''
    dsl.steps.forEach((s, i)=>{
      list.appendChild(stepRow(s, i, ()=>{ syncJson(); validate() }, move, remove))
    })
    syncJson(); validate()
  }
  function move(i, dir){ const j=i+dir; if (j<0||j>=dsl.steps.length) return; const t=dsl.steps[i]; dsl.steps[i]=dsl.steps[j]; dsl.steps[j]=t; render() }
  function remove(i){ dsl.steps.splice(i,1); render() }

  document.getElementById('add').addEventListener('click', ()=>{
    const t = addSel.value
    const stub = { type: t }
    if (t==='navigate') stub.url = ''
    if (t==='wait') stub.ms = 500
    if (['click','type','submit','extract'].includes(t)) stub.selector = ''
    if (t==='type') stub.text = ''
    if (t==='extract') stub.attribute = ''
    if (t==='rag_ingest') { stub.source='agi://workflow'; stub.value='' }
    dsl.steps.push(stub); render()
  })

  document.getElementById('validate').addEventListener('click', validate)
  async function validate(){
    try {
      const parsed = JSON.parse(dslArea.value)
      dsl = parsed
    } catch (e) {}
    const res = await chrome.runtime.sendMessage({ type: 'AGI_VALIDATE_DSL', dsl })
    out.textContent = JSON.stringify(res, null, 2)
    out.style.color = res.ok ? '#9f9' : '#f99'
  }

  document.getElementById('run').addEventListener('click', async ()=>{
    const [tab] = await chrome.tabs.query({ active:true, currentWindow:true })
    const res = await chrome.runtime.sendMessage({ type: 'AGI_RUN_DSL', tabId: tab.id, dsl })
    out.textContent = JSON.stringify(res, null, 2)
  })

  document.getElementById('export').addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(dsl, null, 2)], { type:'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='workflow.dsl.json'; a.click(); URL.revokeObjectURL(url)
  })

  importFile.addEventListener('change', async ()=>{
    const file = importFile.files[0]; if (!file) return
    const text = await file.text()
    try { dsl = JSON.parse(text) } catch { alert('Invalid JSON') }
    render()
  })

  // Template library
  const templates = {
    navigation: [
      { name: 'Simple Navigate + Wait', dsl: { steps: [ { type:'navigate', url:'https://example.com' }, { type:'wait', ms: 1000 } ] } },
      { name: 'Login Submit', dsl: { steps: [ { type:'click', selector:'#login' }, { type:'type', selector:'input[name=email]', text:'user@example.com' }, { type:'type', selector:'input[name=password]', text:'***' }, { type:'submit', selector:'form' } ] } }
    ],
    extraction: [
      { name: 'Extract H1 to RAG', dsl: { steps: [ { type:'extract', selector:'h1' }, { type:'rag_ingest', from:'lastExtract', source:'agi://ex/h1' } ] } },
      { name: 'Batch Links Text', dsl: { steps: [ { type:'extract', selector:'a', attribute:'href' } ] } }
    ],
    downloads: [
      { name: 'Click Download Button', dsl: { steps: [ { type:'click', selector:'.download' } ] } }
    ],
    consent_auth: [
      { name: 'Cookie Consent Dismiss', dsl: { steps: [ { type:'click', selector:'button[aria-label="Accept all"]' } ] } }
    ]
  }
  const tmplSel = document.getElementById('templates')
  Object.entries(templates).forEach(([cat,items])=>{
    const g = el('optgroup', { label: cat })
    items.forEach(t=>{ const o = el('option', { value: `${cat}:${t.name}`, text: `${cat} / ${t.name}` }); g.appendChild(o) })
    tmplSel.appendChild(g)
  })
  document.getElementById('use-template').addEventListener('click', ()=>{
    const v = tmplSel.value; if(!v) return
    const [cat,name] = v.split(':')
    const item = (templates[cat]||[]).find(x=>x.name===name)
    if (item) { dsl = JSON.parse(JSON.stringify(item.dsl)); render() }
  })

  render()
}

