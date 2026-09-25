'use strict';
const application=document.body.dataset.application;
const bridge='https://localhost:38473';
let token='',context=null,activeJob='',generation=0,hostReady=false,connectionAttempt=0,pendingConnection=null;
const el=id=>document.getElementById(id);
const text=(id,value)=>{el(id).textContent=value;};
async function api(path,body,paired=true){
 const headers={'Content-Type':'application/json'};
 if(paired){if(!token)throw Error('Connect this add-in using AI Settings in Onboard.');headers.Authorization='Bearer '+token;headers['X-Onboard-Nonce']=crypto.randomUUID();}
 let response;
 try{response=await fetch(bridge+'/api/'+path,{method:'POST',headers,body:JSON.stringify(body),cache:'no-store',credentials:'omit',redirect:'error',signal:AbortSignal.timeout(35000)});}catch(_){throw Error('Cannot reach Onboard. Start the local service and check approved certificate/network settings.');}
 const result=await response.json();if(!response.ok||result.error)throw Error(result.error||'Request rejected.');return result;
}
function officeValue(value){return new Promise((resolve,reject)=>{if(typeof value==='string')resolve(value);else if(value&&value.getAsync)value.getAsync(r=>r.status===Office.AsyncResultStatus.Succeeded?resolve(r.value):reject(Error('Outlook could not read the requested field.')));else resolve('');});}
async function init(){
 try{
  if(application==='outlook'){
   context=await OnboardOutlook.initialize();hostReady=true;text('context','Outlook is ready. Choose Connect to Onboard, then approve in the Onboard app.');
  }else{
   context=await OnboardTeams.initialize();hostReady=true;text('context','Teams context available. Only explicitly selected, accessible sources are retrieved.');
  }
 }catch(error){hostReady=false;const message=(application==='teams' ? 'Teams':'Outlook')+' connection failed: '+error.message;text('context',message);text('status',message);}
 el('pair').disabled=!hostReady;
 if(el('connect'))el('connect').disabled=!hostReady;
 if(el('retry-host')){el('retry-host').disabled=false;el('retry-host').hidden=hostReady;}
}
el('retry-host')?.addEventListener('click',()=>{el('retry-host').disabled=true;text('context','Reconnecting to Outlook…');init();});
function hostIdentity(){
 return application==='outlook'?{email:context.userProfile.emailAddress}:{tenant:context.user?.tenant?.id,account:context.user?.id};
}
function connected(r){
 token=r.token;
 if(el('code'))el('code').value='';
 if(el('allow-cloud')){el('allow-cloud').disabled=!r.cloud_available;el('allow-cloud').checked=!!r.cloud_available;text('cloud-destination',r.cloud_available?'Cloud destination: '+r.cloud_name+'. Only locally selected sources are sent.':'Configure GenAI and enable add-in cloud analysis in AI Settings to use it.');}
 text('status','Connected as '+r.account+'. No Onboard connection timeout.');el('submit').disabled=false;
 if(el('connect'))el('connect').disabled=true;el('pair').disabled=true;
}
async function cancelConnection(){
 connectionAttempt++;const pending=pendingConnection;pendingConnection=null;
 if(pending)try{await api('connection-cancel',pending,false);}catch(_){}
}
el('connect')?.addEventListener('click',async()=>{
 if(!hostReady||token)return;
 await cancelConnection();const attempt=connectionAttempt;el('connect').disabled=true;el('pair').disabled=true;
 try{
  const pending=await api('connection-request',{application,...hostIdentity()},false);
  if(attempt!==connectionAttempt){try{await api('connection-cancel',pending,false);}catch(_){}return;}
  pendingConnection=pending;text('status','Open Onboard AI and click Allow connection. Your Microsoft accounts must match. No code to copy.');
  while(attempt===connectionAttempt){
   const r=await api('connection-status',pending,false);
   if(attempt!==connectionAttempt){if(r.token)try{await fetch(bridge+'/api/disconnect',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+r.token,'X-Onboard-Nonce':crypto.randomUUID()},body:'{}',credentials:'omit',redirect:'error',signal:AbortSignal.timeout(35000)});}catch(_){}break;}
   if(r.state==='connected'){connected(r);pendingConnection=null;break;}
   if(r.state==='declined'){pendingConnection=null;throw Error('Connection declined in Onboard. Choose Connect to Onboard to try again.');}
   await new Promise(resolve=>setTimeout(resolve,1500));
  }
 }catch(e){if(attempt===connectionAttempt)text('status',e.message);}
 finally{if(attempt===connectionAttempt){el('connect').disabled=!!token;el('pair').disabled=!!token;}}
});
el('pair').addEventListener('click',async()=>{
 await cancelConnection();
 try{connected(await api('pair',{code:el('code').value.trim(),application,...hostIdentity()},false));}catch(e){text('status',e.message);}
});
el('disconnect').addEventListener('click',async()=>{await cancelConnection();generation++;globalThis.OnboardMessages?.reset();try{if(token)await api('disconnect',{});}catch(_){}token='';activeJob='';el('submit').disabled=true;el('cancel').disabled=true;el('answer').value='';el('sources').replaceChildren();el('connect').disabled=!hostReady;el('pair').disabled=!hostReady;text('status','Disconnected.');});
async function selectedSources(){
 const sources=[];
 if(el('include').checked){
  if(application==='outlook'){
   const item=Office.context.mailbox.item;
   if(!item)throw Error('Open a message or meeting, or turn off Include the opened item to ask a question without it.');
   if(item.itemId){sources.push({kind:item.itemType===Office.MailboxEnums.ItemType.Appointment?'meeting':'mail',ref:Office.context.mailbox.convertToRestId(item.itemId,Office.MailboxEnums.RestVersion.v2_0)});}
   else {
    const content=await new Promise((resolve,reject)=>item.body.getAsync(Office.CoercionType.Text,r=>r.status===Office.AsyncResultStatus.Succeeded?resolve(r.value):reject(Error('Cannot read the compose body.'))));
    sources.push({kind:'selected',text:content});
   }
  }else{
   if(context.chat?.id)sources.push({kind:'chat',ref:context.chat.id});
   else if(context.channel?.id&&context.team?.internalId)sources.push({kind:'channel',ref:context.team.internalId+'|'+context.channel.id});
   else throw Error('This Teams surface did not provide an accessible chat/channel identifier. Select a source below. Meeting context alone is not a transcript.');
  }
 }
 for(const line of el('references').value.split('\n').map(x=>x.trim()).filter(Boolean)){
  const split=line.indexOf(':');if(split<1)throw Error('Use type:identifier for each additional source.');
  const kind=line.slice(0,split);if(!['mail','meeting','file','chat','channel','transcript'].includes(kind))throw Error('Unsupported source type.');sources.push({kind,ref:line.slice(split+1)});
 }
 return sources;
}
function render(result){
 globalThis.OnboardMessages?.result(result,activeJob);
 text('status',result.message||result.status||'Complete');
 const sourceLabels=new Map((result.sources||[]).map((s,i)=>[s.id,'Source '+(i+1)+' · '+s.title]));
 el('answer').value=result.draft_text||result.answer||(result.status==='source_excerpts'?'A reliable draft could not be created. Expand Supporting sources to review the original text.':'');
 el('sources').replaceChildren();
 for(const s of result.sources||[]){
  const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent=(sourceLabels.get(s.id)||s.title)+(s.incomplete?' · partial excerpt':'');details.append(summary);
  const quotes=[...new Set((result.claims||[]).filter(c=>c.source_id===s.id).map(c=>c.quote))];
  if(quotes.length){const evidence=document.createElement('pre');evidence.textContent='Referenced excerpts:\n'+quotes.join('\n\n');details.append(evidence);}
  const original=document.createElement('details');const label=document.createElement('summary');label.textContent='Full retrieved text';original.append(label);
  const p=document.createElement('pre');p.textContent=s.text;original.append(p);details.append(original);
  if(s.url){try{const u=new URL(s.url);if(u.protocol==='https:'&&!u.username&&!u.password){const a=document.createElement('a');a.textContent='Open original source';a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';details.append(a);}}catch(_){}}
  el('sources').append(details);
 }
 for(const s of result.cloud_sources||[]){const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Cloud analysis input · '+s.title;details.append(summary);const p=document.createElement('pre');p.textContent=s.text;details.append(p);el('sources').append(details);}
 text('notes',[...(result.retrieval_notes||[]),result.unknowns?'Missing information: '+result.unknowns:'',result.validation||''].join('\n'));
}
el('task').addEventListener('change',()=>{if(el('search-mail')&&['reply','rewrite','shorten','tone'].includes(el('task').value))el('search-mail').checked=false;});
el('submit').addEventListener('click',async()=>{
 if(!hostReady)return;
 globalThis.OnboardMessages?.reset();
 const current=++generation;el('submit').disabled=true;el('answer').value='';el('sources').replaceChildren();
 try{
  if(!el('public').checked)throw Error('Confirm that the selected input is public and permitted for local processing.');
  const task=el('task').value;const sources=await selectedSources();
  if(!sources.length&&!el('prompt').value.trim())throw Error('Select a source or enter a question.');
  const r=await api('submit',{task,route:'local',prompt:el('prompt').value,sources,public_attested:true,search_mail:application==='outlook'&&!!el('search-mail')?.checked,search_mail_explicit:application==='outlook'&&!!el('search-mail')?.checked,allow_cloud:!!el('allow-cloud')?.checked});activeJob=r.id;el('cancel').disabled=false;
  while(current===generation){const j=await api('job',{id:r.id});if(current!==generation)break;text('status',j.state);if(['complete','failed','cancelled'].includes(j.state)){render(j.result||{message:j.state});break;}await new Promise(resolve=>setTimeout(resolve,700));}
 }catch(e){text('status',e.message);}finally{if(current===generation){activeJob='';el('cancel').disabled=true;el('submit').disabled=!token;}}
});
el('cancel').addEventListener('click',async()=>{generation++;globalThis.OnboardMessages?.reset();try{if(activeJob)await api('cancel',{id:activeJob});text('status','Request cancelled.');}catch(e){text('status',e.message);}activeJob='';el('cancel').disabled=true;el('submit').disabled=!token;});
window.addEventListener('pagehide',()=>{token='';generation++;connectionAttempt++;});
init();
