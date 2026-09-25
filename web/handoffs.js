'use strict';
// Account-bound local drafts; no Graph sends, recipient inference, or model-triggered dispatch.
(() => {
 const get=id=>document.getElementById(id),note=value=>{get('handoff-status').textContent=value;};
 let job='',version=0,rows=[],selected=null,busy=false,consumed=false,key='',fingerprint='';
 function setBusy(value){busy=value;for(const id of ['handoff-list','handoff-incoming-body','handoff-incoming-recipient','handoff-incoming-subject','handoff-refresh','handoff-discard'])get(id).disabled=value;}
 const clearReview=()=>{get('handoff-review').checked=false;get('handoff-open').disabled=true;};
 const clearInbox=()=>{version++;rows=[];selected=null;consumed=false;get('handoff-list').replaceChildren();get('handoff-preview').hidden=true;for(const id of ['handoff-incoming-body','handoff-incoming-recipient','handoff-incoming-subject'])get(id).value='';clearReview();};
 const reset=()=>{job='';get('handoff-create').disabled=true;get('handoff-share').checked=false;key='';fingerprint='';};
 async function refresh(){
  if(busy)return;const epoch=++version;
  try{
   const r=await api('handoff-list',{});if(epoch!==version)return;
   rows=r.drafts;selected=null;consumed=false;clearReview();get('handoff-preview').hidden=true;get('handoff-list').replaceChildren();
   const empty=document.createElement('option');empty.value='';empty.textContent=rows.length?'Choose a transferred draft':'No drafts waiting';get('handoff-list').append(empty);
   rows.forEach((row,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=row.category.replaceAll('_',' ')+' · from '+row.source+' · '+(row.subject||'Untitled draft');get('handoff-list').append(option);});
   note(rows.length+' draft(s) waiting in this add-in. Nothing is sent until you send in the destination app.');
  }catch(e){if(epoch===version)note(e.message);}
 }
 globalThis.OnboardHandoffs={reset,disconnect(){reset();clearInbox();get('handoff-recipient').value='';get('handoff-subject').value='';},refresh,result(result,id){
  reset();if(result.status!=='generated')return;job=id;get('handoff-create').disabled=false;
  get('handoff-category').value=({reply:'reply',summarize:'summary',followup:'followup'}[get('task').value]||'other');
 }};
 get('handoff-create').textContent='Transfer draft to '+(application==='outlook'?'Teams':'Outlook')+' add-in';
 get('handoff-create').addEventListener('click',async()=>{
  if(busy||!job)return;busy=true;get('handoff-create').disabled=true;const epoch=version;
  try{
   if(!get('handoff-share').checked)throw Error('Review the draft and confirm it is permitted to transfer.');
   const fields={job,target:application==='outlook'?'teams':'outlook',body:get('answer').value,category:get('handoff-category').value,recipient:get('handoff-recipient').value.trim(),subject:get('handoff-subject').value,public_attested:true};
   const current=JSON.stringify(fields);if(current!==fingerprint){fingerprint=current;key=crypto.randomUUID();}
   const r=await api('handoff-create',{...fields,key});if(epoch!==version)return;note(r.message);
  }catch(e){if(epoch===version)note(e.message);}finally{busy=false;get('handoff-create').disabled=!job;}
 });
 for(const id of ['answer','handoff-category','handoff-recipient','handoff-subject'])get(id).addEventListener('input',()=>{get('handoff-share').checked=false;});
 get('handoff-refresh').addEventListener('click',refresh);
 get('handoff-list').addEventListener('change',()=>{
  version++;clearReview();consumed=false;const value=get('handoff-list').value;selected=/^\d+$/.test(value)?rows[Number(value)]:null;
  get('handoff-preview').hidden=!selected;if(!selected)return;
  get('handoff-incoming-body').value=selected.body;get('handoff-incoming-recipient').value=selected.recipient;get('handoff-incoming-subject').value=selected.subject;
  get('handoff-incoming-subject-row').hidden=application!=='outlook';get('handoff-open').textContent='Open draft in '+(application==='outlook'?'Outlook':'Teams');
 });
 for(const id of ['handoff-incoming-body','handoff-incoming-recipient','handoff-incoming-subject'])get(id).addEventListener('input',clearReview);
 get('handoff-review').addEventListener('change',()=>{get('handoff-open').disabled=busy||!selected||!get('handoff-review').checked;});
 get('handoff-open').addEventListener('click',async()=>{
  if(busy||!selected||!get('handoff-review').checked)return;setBusy(true);get('handoff-open').disabled=true;
  const row=selected,epoch=version,recipient=get('handoff-incoming-recipient').value.trim(),subject=get('handoff-incoming-subject').value,body=get('handoff-incoming-body').value;
  try{
   await verifyHostAccount();
   if(!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(recipient))throw Error('Enter the intended recipient’s complete address.');
   if(!body.trim()||body.length>12000)throw Error('Review a draft of up to 12,000 characters.');
   if(application==='outlook'&&(!subject.trim()||subject.length>200||/[\r\n\x00]/.test(subject)))throw Error('Enter a one-line email subject of up to 200 characters.');
   if(!consumed){await api('handoff-remove',{id:row.id});if(epoch!==version)return;consumed=true;}
   else await api('handoff-list',{});
   if(epoch!==version)return;
   // Recheck host identity after the local service validates the paired account.
   await verifyHostAccount();if(epoch!==version)return;
   const message=application==='outlook'?await OnboardOutlook.newDraft(recipient,subject,body):await OnboardTeams.useDraft(recipient,body);
   if(epoch!==version)return;selected=null;clearReview();note(message+' The local transfer has been removed from the queue.');
  }catch(e){if(epoch===version)note(e.message+(consumed?' The text remains here; retry opening it or copy it manually.':''));}
  finally{setBusy(false);get('handoff-open').disabled=!selected||!get('handoff-review').checked;}
 });
 get('handoff-discard').addEventListener('click',async()=>{
  if(busy||!selected)return;busy=true;
  try{if(!consumed)await api('handoff-remove',{id:selected.id});selected=null;get('handoff-preview').hidden=true;clearReview();note('Local draft removed. Nothing was sent.');}
  catch(e){note(e.message);}finally{busy=false;}
 });
})();
