'use strict';
const application=document.body.dataset.application;
const bridge='https://localhost:38473';
let token='',context=null,activeJob='',generation=0,hostReady=false,connectionAttempt=0,pendingConnection=null;
let outlookAccount='';
let openedItem=null,draftItem=null,draftReady=false,teamsOptions=[],teamsScope='';
const el=id=>document.getElementById(id);
const text=(id,value)=>{el(id).textContent=value;};
async function api(path,body,paired=true){
 const headers={'Content-Type':'application/json'};
 if(paired){if(!token)throw Error('Connect this add-in using AI Settings in Onboard.');headers.Authorization='Bearer '+token;headers['X-Onboard-Nonce']=crypto.randomUUID();}
 let response;
 try{response=await fetch(bridge+'/api/'+path,{method:'POST',headers,body:JSON.stringify(body),cache:'no-store',credentials:'omit',redirect:'error',signal:AbortSignal.timeout(35000)});}catch(_){throw Error('Cannot reach Onboard. Start the local service and check approved certificate/network settings.');}
 const result=await response.json();if(!response.ok||result.error)throw Error(result.error||'Request rejected.');return result;
}
async function init(){
 try{
  if(application==='outlook'){
   context=await OnboardOutlook.initialize();outlookAccount=context.userProfile.emailAddress?.toLowerCase()||'';hostReady=true;OnboardOutlook.onItemChanged?.(itemChanged);text('context','Outlook is ready. Choose Connect to Onboard, then approve in the Onboard app.');
  }else{
   context=await OnboardTeams.initialize();hostReady=true;text('context','Teams is ready. Choose a message from this conversation; Graph supplies its text when needed.');
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
 token=r.token;globalThis.OnboardHandoffs?.refresh();
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
el('disconnect').addEventListener('click',async()=>{await cancelConnection();generation++;globalThis.OnboardMessages?.reset();globalThis.OnboardHandoffs?.disconnect();resetDraft();teamsOptions=[];teamsScope='';el('teams-message')?.replaceChildren();try{if(token)await api('disconnect',{});}catch(_){}token='';activeJob='';el('submit').disabled=true;el('cancel').disabled=true;el('answer').value='';el('sources').replaceChildren();el('connect').disabled=!hostReady;el('pair').disabled=!hostReady;text('status','Disconnected.');});
async function selectedSources(){
 const sources=[];
 if(el('include').checked){
  if(application==='outlook'){
   await verifyHostAccount();const capture=await OnboardOutlook.readItem();await verifyHostAccount();openedItem=capture.item;sources.push(capture.source);
   text('context','Opened in Outlook: '+capture.title);
   if(el('include-thread')?.checked){
    if(!capture.item.itemId)throw Error('Save this item before requesting its related thread through Graph.');
    sources.push({kind:capture.source.origin==='outlook-meeting'?'meeting':'mail',ref:Office.context.mailbox.convertToRestId(capture.item.itemId,Office.MailboxEnums.RestVersion.v2_0),include_thread:true});
   }
  }else{
   const scope=await currentTeamsScope();
   if(el('teams-scope').value==='conversation')sources.push(scope);
   else {
    const index=el('teams-message').value;
    if(teamsScope!==JSON.stringify(scope)||!/^\d+$/.test(index)||!teamsOptions[Number(index)])throw Error('Load messages and choose one from this Teams conversation first.');
    sources.push(teamsOptions[Number(index)].selection);
   }
  }
 }
 for(const line of el('references').value.split('\n').map(x=>x.trim()).filter(Boolean)){
  const split=line.indexOf(':');if(split<1)throw Error('Use type:identifier for each additional source.');
  const kind=line.slice(0,split);if(!['mail','meeting','file','chat','channel','transcript'].includes(kind))throw Error('Unsupported source type.');sources.push({kind,ref:line.slice(split+1)});
 }
 return sources;
}
function render(result){
 globalThis.OnboardMessages?.result(result,activeJob);globalThis.OnboardHandoffs?.result(result,activeJob);
 draftReady=result.status==='generated';draftItem=openedItem;updateDraftButton();
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
el('task').addEventListener('change',()=>{if(el('search-mail')&&['reply','rewrite','shorten','tone'].includes(el('task').value))el('search-mail').checked=false;resetDraft();});
el('submit').addEventListener('click',async()=>{
 if(!hostReady)return;
 globalThis.OnboardMessages?.reset();resetDraft();openedItem=null;
 const current=++generation;el('submit').disabled=true;el('answer').value='';el('sources').replaceChildren();
 try{
  if(!el('public').checked)throw Error('Confirm that the selected input is public and permitted for local processing.');
  const task=el('task').value;const sources=await selectedSources();if(current!==generation)return;
  if(!sources.length&&!el('prompt').value.trim())throw Error('Select a source or enter a question.');
  const r=await api('submit',{task,route:'local',prompt:el('prompt').value,sources,public_attested:true,search_mail:application==='outlook'&&!!el('search-mail')?.checked,search_mail_explicit:application==='outlook'&&!!el('search-mail')?.checked,allow_cloud:!!el('allow-cloud')?.checked});if(current!==generation){try{await api('cancel',{id:r.id});}catch(_){}return;}activeJob=r.id;el('cancel').disabled=false;
  while(current===generation){const j=await api('job',{id:r.id});if(current!==generation)break;text('status',j.state);if(['complete','failed','cancelled'].includes(j.state)){if(application==='outlook'&&openedItem&&OnboardOutlook.current()!==openedItem){itemChanged();break;}render(j.result||{message:j.state});break;}await new Promise(resolve=>setTimeout(resolve,700));}
 }catch(e){if(current===generation)text('status',e.message);}finally{if(current===generation){activeJob='';el('cancel').disabled=true;el('submit').disabled=!token;}}
});
el('cancel').addEventListener('click',async()=>{generation++;globalThis.OnboardMessages?.reset();resetDraft();try{if(activeJob)await api('cancel',{id:activeJob});text('status','Request cancelled.');}catch(e){text('status',e.message);}activeJob='';el('cancel').disabled=true;el('submit').disabled=!token;});
window.addEventListener('pagehide',()=>{globalThis.OnboardHandoffs?.disconnect();token='';generation++;connectionAttempt++;});
function resetDraft(){globalThis.OnboardHandoffs?.reset();draftReady=false;draftItem=null;if(el('native-review'))el('native-review').checked=false;updateDraftButton();}
function updateDraftButton(){if(el('native-draft'))el('native-draft').disabled=!draftReady||!el('native-review')?.checked;}
function itemChanged(){
 const old=activeJob;generation++;activeJob='';openedItem=null;resetDraft();globalThis.OnboardMessages?.reset();
 el('answer').value='';el('sources').replaceChildren();text('notes','');el('submit').disabled=!token;el('cancel').disabled=true;
 text('context',application==='outlook'?'Outlook context changed. Your next request will use the item now open.':'Teams selection changed. Ask again for the selected context.');text('status','Previous result cleared.');
 if(old&&token)api('cancel',{id:old}).catch(()=>{});
}
async function currentTeamsScope(){
 const now=await OnboardTeams.current();
 if(now.user?.id!==context.user?.id||now.user?.tenant?.id!==context.user?.tenant?.id)throw Error('Teams account changed. Disconnect and reconnect Onboard.');
 return OnboardTeams.conversation(now);
}
el('teams-load')?.addEventListener('click',async()=>{
 itemChanged();const epoch=generation;el('teams-load').disabled=true;teamsOptions=[];teamsScope='';el('teams-message').replaceChildren();
 try{
  const scope=await currentTeamsScope();const response=await api('source-options',scope);
  if(epoch!==generation)return;
  const now=await currentTeamsScope();if(epoch!==generation)return;if(JSON.stringify(now)!==JSON.stringify(scope))throw Error('Teams conversation changed. Load messages again.');
  teamsOptions=response.options;teamsScope=JSON.stringify(scope);
  const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Choose a message';el('teams-message').append(placeholder);
  response.options.forEach((row,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=row.label;el('teams-message').append(option);});
  text('status',response.message);
 }catch(e){text('status',e.message);}finally{el('teams-load').disabled=false;}
});
for(const id of ['teams-message','teams-scope','include','include-thread','references'])el(id)?.addEventListener('change',itemChanged);
el('native-review')?.addEventListener('change',updateDraftButton);
el('answer').addEventListener('input',()=>{if(el('native-review'))el('native-review').checked=false;updateDraftButton();});
el('native-recipient')?.addEventListener('input',()=>{el('native-review').checked=false;updateDraftButton();});
el('native-draft')?.addEventListener('click',async()=>{
 if(!draftReady||!el('native-review').checked)return;el('native-draft').disabled=true;
 try{
  let message;
  if(application==='outlook'){await verifyHostAccount();message=await OnboardOutlook.useDraft(draftItem,el('answer').value);}
  else {await currentTeamsScopeForDraft();message=await OnboardTeams.useDraft(el('native-recipient').value.trim(),el('answer').value);}
  resetDraft();text('status',message);
 }catch(e){text('status',e.message);updateDraftButton();}
});
async function verifyHostAccount(){
 if(application==='outlook'){
  if(!outlookAccount||OnboardOutlook.account()!==outlookAccount)throw Error('Outlook account changed. Disconnect and reconnect before opening a draft.');
 }else await currentTeamsScopeForDraft();
}
async function currentTeamsScopeForDraft(){
 const now=await OnboardTeams.current();
 if(now.user?.id!==context.user?.id||now.user?.tenant?.id!==context.user?.tenant?.id)throw Error('Teams account changed. Reconnect before opening a draft.');
}
init();
