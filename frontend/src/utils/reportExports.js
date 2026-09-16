const esc=(v)=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
export function downloadExcel(filename,headers,rows,meta={}){
  const title=esc(meta.title||'Sales Report'),subtitle=esc(meta.subtitle||'');
  const head=headers.map(h=>`<th>${esc(h)}</th>`).join('');
  const body=rows.map((r,ri)=>`<tr class="${ri%2?'alt':''}">${r.map((c,i)=>`<td class="${i>=4&&i<=8?'num':''}">${esc(c)}</td>`).join('')}</tr>`).join('');
  const html=`<html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;color:#27272a}.title{font-size:22px;font-weight:700;color:#40295C}.sub{font-size:12px;color:#71717a;margin:6px 0 18px}table{border-collapse:collapse;width:100%}th{background:#40295C;color:#fff;font-weight:700;padding:10px;border:1px solid #ddd;text-align:left}td{padding:8px;border:1px solid #e4e4e7}.alt{background:#fafafa}.num{text-align:right} .foot{margin-top:14px;font-size:11px;color:#71717a}</style></head><body><div class="title">${title}</div><div class="sub">${subtitle}</div><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table><div class="foot">Generated ${esc(new Date().toLocaleString())}</div></body></html>`;
  download(new Blob([html],{type:'application/vnd.ms-excel'}),filename.endsWith('.xls')?filename:`${filename}.xls`);
}
function pdfEscape(s){return String(s??'').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[^\x20-\x7E]/g,'?');}
export function downloadPdf(filename,title,data,options={}){
  const headers=options.headers||null,summary=options.summary||[];
  let lines=[];
  if(headers&&Array.isArray(data)){
    const widths=[16,18,15,20,5,10,10,12,10,10];
    const fit=(v,w)=>String(v??'').replace(/\s+/g,' ').slice(0,w).padEnd(w,' ');
    lines.push(headers.map((h,i)=>fit(h,widths[i]||12)).join(' '));
    lines.push('-'.repeat(126));
    data.forEach(r=>lines.push(r.map((v,i)=>fit(v,widths[i]||12)).join(' ')));
  }else lines=Array.isArray(data)?data.map(String):[];
  const first=[title.toUpperCase(),...summary,'',...lines];
  const chunks=[];for(let i=0;i<first.length;i+=43)chunks.push(first.slice(i,i+43));
  const objects=[];objects[1]='<< /Type /Catalog /Pages 2 0 R >>';const kids=[];let obj=3,fontObj;
  chunks.forEach((page,pi)=>{const pageObj=obj++,contentObj=obj++;kids.push(`${pageObj} 0 R`);const cmds=['BT','/F1 8 Tf','28 570 Td'];page.forEach((line,i)=>{if(i)cmds.push('0 -12 Td');if(i===0){cmds.push('/F1 15 Tf');cmds.push(`(${pdfEscape(line).slice(0,150)}) Tj`);cmds.push('/F1 8 Tf');}else cmds.push(`(${pdfEscape(line).slice(0,180)}) Tj`);});cmds.push(`0 -18 Td (Page ${pi+1} of ${chunks.length}   Generated ${pdfEscape(new Date().toLocaleString())}) Tj`,'ET');const stream=cmds.join('\n');objects[pageObj]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 FONTREF >> >> /Contents ${contentObj} 0 R >>`;objects[contentObj]=`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;});
  fontObj=obj;objects[fontObj]='<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>';for(let i=3;i<objects.length;i++)if(objects[i])objects[i]=objects[i].replace('FONTREF',`${fontObj} 0 R`);objects[2]=`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${chunks.length} >>`;let pdf='%PDF-1.4\n',offsets=[0];for(let i=1;i<objects.length;i++){offsets[i]=pdf.length;pdf+=`${i} 0 obj\n${objects[i]}\nendobj\n`;}const xref=pdf.length;pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let i=1;i<objects.length;i++)pdf+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;pdf+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;download(new Blob([pdf],{type:'application/pdf'}),filename.endsWith('.pdf')?filename:`${filename}.pdf`);
}
export function printHtml(title,html){const w=window.open('','_blank','width=900,height=700');if(!w)return;w.document.write(`<html><head><title>${esc(title)}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}.right{text-align:right}h1{font-size:20px}.summary{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:16px 0}</style></head><body>${html}<script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close();}
