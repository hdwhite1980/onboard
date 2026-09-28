'use strict';
(()=>{
 const el=id=>document.getElementById(id),status=value=>{el('status').textContent=value;};
 let token='',snapshot='',job='',generation=0,busy=false,generated=false,downloadURL='',pending=null,attempt=0;
 async function api(path,body,paired=true){
  const headers={'Content-Type':'application/json'};if(paired){if(!token)throw Error('Connect to Onboard first.');headers.Authorization='Bearer '+token;headers['X-Onboard-Nonce']=crypto.randomUUID();}
  const response=await fetch('https://localhost:38473/api/'+path,{method:'POST',headers,body:JSON.stringify(body),credentials:'omit',redirect:'error',signal:AbortSignal.timeout(35000)});const result=await response.json();if(!response.ok||result.error)throw Error(result.error||'Onboard request failed.');return result;
 }
 function buttons(){for(const id of ['insert','replace','export','email'])el(id).disabled=busy||!generated||!el('reviewed').checked;el('ask').disabled=busy||!token||!snapshot;el('inspect').disabled=busy||!token;el('cancel').disabled=!busy;}
 function clear(){generated=false;job='';el('answer').value='';el('reviewed').checked=false;el('sources').textContent='';el('download').hidden=true;if(downloadURL)URL.revokeObjectURL(downloadURL);downloadURL='';buttons();}
 async function perform(action){if(busy)return;busy=true;buttons();try{await action();}catch(error){status(error.message);}finally{busy=false;buttons();}}
 el('connect').addEventListener('click',()=>perform(async()=>{
  const epoch=++attempt;pending=await api('connection-request',{application:'word'},false);status('Approve the Word connection in Onboard AI on this Mac.');
  while(epoch===attempt){const result=await api('connection-status',pending,false);if(epoch!==attempt){if(result.token){const saved=token;token=result.token;try{await api('disconnect',{});}finally{token=saved;}}return;}if(result.state==='declined')throw Error('Word connection declined.');if(result.state==='connected'){token=result.token;pending=null;el('provider').textContent=result.cloud_available?'Cloud destination: '+result.cloud_name:'Configure a provider and enable add-in cloud analysis in Onboard Settings.';el('allow-cloud').disabled=!result.cloud_available;status('Connected to Onboard account: '+result.account);return;}await new Promise(resolve=>setTimeout(resolve,1200));}
 }));
 el('disconnect').addEventListener('click',async()=>{attempt++;generation++;if(pending)try{await api('connection-cancel',pending,false);}catch(_){}pending=null;try{if(token)await api('disconnect',{});}catch(_){}token='';snapshot='';clear();busy=false;buttons();status('Disconnected.');});
 el('inspect').addEventListener('click',()=>perform(async()=>{
  if(!el('inspect-confirmed').checked)throw Error('Confirm local document inspection first.');snapshot='';clear();const epoch=generation;
  const capture=await OnboardWord.capture();const result=await api('document-inspect',{...capture,inspect_confirmed:true});if(epoch!==generation)return;
  el('label-status').textContent=result.message+' '+result.coverage+' ('+result.characters+' characters)';
  if(result.permitted)snapshot=result.snapshot;status(result.permitted?'Document inspected. Confirm PUBLIC classification before asking AI.':result.message);
 }));
 el('ask').addEventListener('click',()=>perform(async()=>{
  if(!el('public').checked)throw Error('Confirm the document and thoughts are public and permitted.');const epoch=++generation;clear();
  const response=await api('document-submit',{mode:el('mode').value,prompt:el('prompt').value,snapshot,public_attested:true,allow_cloud:el('allow-cloud').checked});if(epoch!==generation){try{await api('cancel',{id:response.id});}catch(_){}return;}job=response.id;
  while(epoch===generation){const row=await api('job',{id:job});if(epoch!==generation)return;status(row.state);if(['complete','failed','cancelled'].includes(row.state)){const result=row.result||{};status(result.message||row.state);el('answer').value=result.answer||'';generated=result.status==='generated';el('sources').textContent=JSON.stringify({coverage:result.retrieval_notes,sources:result.sources},null,2);return;}await new Promise(resolve=>setTimeout(resolve,700));}
 }));
 el('cancel').addEventListener('click',async()=>{generation++;attempt++;if(pending)try{await api('connection-cancel',pending,false);}catch(_){}pending=null;if(job)try{await api('cancel',{id:job});}catch(_){}status('Cancelled. An API request already sent may continue at the provider.');});
 for(const id of ['answer','title','recipient','subject'])el(id).addEventListener('input',()=>{el('reviewed').checked=false;buttons();});el('reviewed').addEventListener('change',buttons);
 for(const [id,replace] of [['insert',false],['replace',true]])el(id).addEventListener('click',()=>perform(async()=>{if(!generated||!el('reviewed').checked)throw Error('Review the generated draft first.');await api('job',{id:job});status(await OnboardWord.insert(el('answer').value,replace));snapshot='';}));
 el('export').addEventListener('click',()=>perform(async()=>{
  const epoch=generation;const file=await api('document-export',{job,title:el('title').value,text:el('answer').value,reviewed:el('reviewed').checked,public_attested:el('public').checked});
  if(epoch!==generation)return;if(downloadURL)URL.revokeObjectURL(downloadURL);downloadURL=URL.createObjectURL(new Blob([Uint8Array.from(atob(file.base64),c=>c.charCodeAt(0))],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}));el('download').href=downloadURL;el('download').download=file.name;el('download').hidden=false;status('Word file created. Download it here, or attach it from the Outlook document tray.');
 }));
 el('email').addEventListener('click',()=>perform(async()=>{
  if(!el('reviewed').checked||!el('public').checked)throw Error('Review and confirm permitted sharing first.');
  const response=await api('handoff-create',{job,target:'outlook',body:el('answer').value,subject:el('subject').value,recipient:el('recipient').value.trim(),category:'other',public_attested:true,key:crypto.randomUUID()});status(response.message);
 }));
 OnboardWord.initialize().then(()=>{el('connect').disabled=false;status('Word ready. Connect to Onboard.');}).catch(error=>status(error.message));
})();
