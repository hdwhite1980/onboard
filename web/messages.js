'use strict';
// Shared composer: model output supplies draft text only, never recipients or send actions.
(() => {
 let job='',review='',availability='',version=0,busy=false;
 const field=id=>document.getElementById(id);
 const note=value=>{field('message-status').textContent=value;};
 const invalidate=()=>{version++;review='';field('message-send').disabled=true;field('message-preview').hidden=true;};
 const reset=()=>{invalidate();job='';availability='';field('message-body').value='';field('message-times-text').textContent='';field('message-review').disabled=true;note('Prepare a draft, then review the recipient and message.');};
 globalThis.OnboardMessages={reset,result(result,id){reset();if(result.status==='generated'){job=id;field('message-body').value=result.draft_text||result.answer||'';field('message-review').disabled=!field('message-body').value.trim();note('Edit the proposed message, select a recipient, then review before sending.');}}};
 const now=new Date();field('message-date').value=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
 field('message-zone').value=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
 field('message-target').value=application==='outlook'?'teams':'email';
 const target=()=>{field('message-subject-row').hidden=field('message-target').value!=='email';field('message-recipient-label').textContent=field('message-target').value==='email'?'Recipient email address':'Recipient Teams work sign-in address (within your organization)';};target();
 for(const id of ['message-target','message-recipient','message-subject','message-body','message-share'])field(id).addEventListener('input',()=>{invalidate();target();});
 for(const id of ['message-date','message-zone','message-duration','message-start','message-end'])field(id).addEventListener('input',()=>{invalidate();availability='';field('message-times-text').textContent='';});
 field('message-clear-times').addEventListener('click',()=>{invalidate();availability='';field('message-times-text').textContent='';});
 field('message-prepare').addEventListener('click',()=>{
  invalidate();field('task').value='reply';
  if(!field('prompt').value.trim())field('prompt').value='Draft a concise conversational message summarizing the selected source and asking for a meeting to discuss it. Do not invent availability or commitments; verified meeting times will be added separately.';
  field('submit').click();
 });
 field('message-times').addEventListener('click',async()=>{
  if(busy)return;busy=true;invalidate();availability='';field('message-times-text').textContent='';const current=version;note('Checking your calendar…');
  try{
   const result=await api('message-times',{zone:field('message-zone').value,date:field('message-date').value,duration:Number(field('message-duration').value),start_hour:Number(field('message-start').value),end_hour:Number(field('message-end').value)});
   if(current!==version)return;availability=result.text?result.id:'';field('message-times-text').textContent=result.text;note(result.message);
  }catch(error){if(current===version)note(error.message);}finally{busy=false;}
 });
 field('message-review').addEventListener('click',async()=>{
  if(busy)return;busy=true;invalidate();const current=version;note('Preparing the exact message for review…');
  try{
   const result=await api('message-review',{job,target:field('message-target').value,recipient:field('message-recipient').value.trim(),subject:field('message-subject').value,body:field('message-body').value,availability,public_attested:field('message-share').checked});
   if(current!==version)return;review=result.id;
   field('message-preview-heading').textContent='From '+result.sender+' → '+result.recipient+' via '+(result.target==='email'?'Email':'Teams');
   field('message-preview-subject').textContent=result.subject?'Subject: '+result.subject:'';
   field('message-preview-body').textContent=result.body;field('message-preview').hidden=false;field('message-send').disabled=false;
   note('Review the recipient and exact message below. Click Send when ready. No meeting will be booked.');
  }catch(error){if(current===version)note(error.message);}finally{busy=false;}
 });
 field('message-send').addEventListener('click',async()=>{
  if(busy||!review)return;busy=true;field('message-send').disabled=true;const id=review;review='';note('Sending the reviewed message…');
  try{const result=await api('message-send',{id,confirmed:true});note(result.message);field('message-review').disabled=true;}
  catch(error){note(error.message+' Delivery is unconfirmed. Check Sent Items or Teams before preparing another message.');field('message-review').disabled=true;}
  finally{busy=false;}
 });
})();
