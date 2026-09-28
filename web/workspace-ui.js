'use strict';
// Explicit retention only. No localStorage, cookies or credential persistence.
(()=>{
 const el=id=>document.getElementById(id);if(!el('saved-work'))return;
 let adapter=null,current=null,busy=false,epoch=0,key='',fingerprint='';
 const note=value=>{el('saved-status').textContent=value;};
 function buttons(){el('saved-save').disabled=busy||!current||!el('saved-reviewed').checked;for(const name of ['refresh','open','delete','purge'])el('saved-'+name).disabled=busy;}
 function reset(){epoch++;current=null;el('saved-reviewed').checked=false;key='';fingerprint='';buttons();}
 function disconnect(){reset();el('saved-list').replaceChildren();el('saved-title').value='';note('Reconnect to view saved work for your account.');}
 async function perform(action){if(busy||!adapter)return;busy=true;buttons();const version=epoch;try{await action(version);}catch(error){if(version===epoch)note(error.message);}finally{busy=false;buttons();}}
 async function refresh(version){const data=await adapter.api('workspace-list',{});if(version!==epoch)return;el('saved-list').replaceChildren();const blank=document.createElement('option');blank.value='';blank.textContent=data.items.length?'Choose saved work':'No saved work';el('saved-list').append(blank);for(const item of data.items){const option=document.createElement('option');option.value=item.id;option.textContent=item.title+' · '+item.origin+' · expires '+new Date(item.expires*1000).toLocaleDateString();el('saved-list').append(option);}note(data.items.length+' reviewed draft(s) saved on this Mac for this account.');}
 el('saved-diagnostics').addEventListener('click',()=>perform(async version=>{const r=await adapter.api('readiness',{});if(version!==epoch)return;el('saved-checks').textContent='Service '+r.version+'\n'+r.checks.map(c=>c.name+': '+c.state+' — '+c.detail).join('\n\n');}));
 globalThis.OnboardWorkspace={configure(value){adapter=value;},reset,disconnect,result(result,job,read,restore){reset();if(result.status==='generated'&&job){current={job,read,restore};buttons();}}};
 el('saved-reviewed').addEventListener('change',buttons);
 el('saved-title').addEventListener('input',()=>{el('saved-reviewed').checked=false;buttons();});
 // Any draft edit requires another explicit storage review.
 for(const id of ['answer','document-text'])el(id)?.addEventListener('input',()=>{el('saved-reviewed').checked=false;buttons();});
 el('saved-save').addEventListener('click',()=>perform(async version=>{
  if(!current||!el('saved-reviewed').checked)throw Error('Review a generated draft before saving.');
  const data={job:current.job,title:el('saved-title').value,text:current.read(),reviewed:true,public_attested:el('public').checked};
  const next=JSON.stringify(data);if(next!==fingerprint){fingerprint=next;key=crypto.randomUUID();}
  const result=await adapter.api('workspace-save',{...data,key});if(version!==epoch)return;note(result.message);el('saved-reviewed').checked=false;
 }));
 el('saved-refresh').addEventListener('click',()=>perform(refresh));
 el('saved-open').addEventListener('click',()=>perform(async version=>{
  if(!el('saved-list').value)throw Error('Choose saved work first.');
  const row=await adapter.api('workspace-get',{id:el('saved-list').value});if(version!==epoch)return;
  adapter.restore(row);el('saved-title').value=row.title;el('saved-reviewed').checked=false;note(row.result.message);
 }));
 el('saved-delete').addEventListener('click',()=>perform(async version=>{
  if(!el('saved-list').value)throw Error('Choose saved work first.');await adapter.api('workspace-get',{id:el('saved-list').value,remove:true});if(version!==epoch)return;await refresh(version);
 }));
 el('saved-purge').addEventListener('click',()=>perform(async version=>{
  if(!el('saved-delete-confirm').checked)throw Error('Confirm removal of all saved work for this account.');
  const result=await adapter.api('workspace-purge',{});if(version!==epoch)return;el('saved-delete-confirm').checked=false;await refresh(version);note(result.message);
 }));
 el('disconnect').addEventListener('click',disconnect);window.addEventListener('pagehide',disconnect);buttons();
})();
