'use strict';
// Outlook documents are made locally, then attached only to an explicit compose item.
(()=>{
 const get=id=>document.getElementById(id);if(!get('document-create'))return;
 let busy=false,docJob='',generated=false,epoch=0,downloadURL='';
 const note=value=>{get('document-status').textContent=value;};
 function reset(){epoch++;if(docJob)api('cancel',{id:docJob}).catch(()=>{});docJob='';generated=false;get('document-text').value='';get('document-review').checked=false;get('document-export').disabled=true;get('document-download').hidden=true;get('document-files').replaceChildren();if(downloadURL)URL.revokeObjectURL(downloadURL);downloadURL='';}
 async function perform(action){if(busy)return;busy=true;for(const id of ['document-create','document-export','document-attach','document-refresh'])get(id).disabled=true;try{await action();}catch(error){note(error.message);}finally{busy=false;get('document-create').disabled=false;get('document-export').disabled=!generated||!get('document-review').checked;get('document-refresh').disabled=false;get('document-attach').disabled=!get('document-files').value;}}
 get('disconnect').addEventListener('click',reset);globalThis.OnboardDocuments={reset};
 get('document-create').addEventListener('click',()=>perform(async()=>{
  if(!get('public').checked)throw Error('Confirm the selected emails and your instructions are PUBLIC and permitted.');
  const version=++epoch;generated=false;get('document-review').checked=false;await verifyHostAccount();const sources=await selectedSources();
  const result=await api('document-submit',{mode:'document',prompt:get('prompt').value,sources,public_attested:true,allow_cloud:get('document-cloud').checked,search_mail:get('document-scope').value!=='selected',mail_scope:get('document-scope').value,mail_query:get('document-query').value});if(version!==epoch){try{await api('cancel',{id:result.id});}catch(_){}return;}docJob=result.id;
  while(version===epoch){const row=await api('job',{id:docJob});if(version!==epoch)return;note(row.state);if(['complete','failed','cancelled'].includes(row.state)){const value=row.result||{};generated=value.status==='generated';get('document-text').value=value.answer||'';get('document-coverage').textContent=(value.retrieval_notes||[]).join('\n');note(value.message||row.state);return;}await new Promise(resolve=>setTimeout(resolve,700));}
 }));
 get('document-cancel').addEventListener('click',async()=>{epoch++;if(docJob)try{await api('cancel',{id:docJob});}catch(_){}note('Document task cancelled.');});
 for(const id of ['document-text','document-title'])get(id).addEventListener('input',()=>{get('document-review').checked=false;get('document-export').disabled=true;});get('document-review').addEventListener('change',()=>{get('document-export').disabled=busy||!generated||!get('document-review').checked;});
 get('document-export').addEventListener('click',()=>perform(async()=>{
  const version=epoch;const file=await api('document-export',{job:docJob,title:get('document-title').value,text:get('document-text').value,reviewed:get('document-review').checked,public_attested:get('public').checked});
  if(version!==epoch)return;if(downloadURL)URL.revokeObjectURL(downloadURL);downloadURL=URL.createObjectURL(new Blob([Uint8Array.from(atob(file.base64),c=>c.charCodeAt(0))],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}));
  const link=get('document-download');link.href=downloadURL;link.download=file.name;link.hidden=false;note('Word file created. Download it or refresh the tray to attach it to a compose window.');await refresh();
 }));
 async function refresh(){const version=epoch;const result=await api('document-files',{});if(version!==epoch)return;get('document-files').replaceChildren();const blank=document.createElement('option');blank.value='';blank.textContent='Choose a reviewed Word document';get('document-files').append(blank);for(const file of result.files){const option=document.createElement('option');option.value=file.id;option.textContent=file.name;get('document-files').append(option);}}
 get('document-refresh').addEventListener('click',()=>perform(refresh));get('document-files').addEventListener('change',()=>{get('document-attach').disabled=busy||!get('document-files').value;});
 get('document-attach').addEventListener('click',()=>perform(async()=>{
  await verifyHostAccount();const item=OnboardOutlook.current();if(!item?.subject?.setAsync)throw Error('Open a reply or new email compose window, open Onboard there, and select this file from the document tray.');
  const file=await api('document-files',{id:get('document-files').value});await verifyHostAccount();note(await OnboardOutlook.attachDocument(item,file));
 }));
})();
