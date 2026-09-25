'use strict';
// Capture startup failures before Office.js loads. Never read message content here.
(function(root){
 let startupFailure='';
 root.addEventListener('securitypolicyviolation',event=>{
  if(!['script-src','script-src-elem','connect-src','frame-src'].includes(event.effectiveDirective))return;
  let destination='a required resource';
  try{destination=new URL(event.blockedURI).origin;}catch(_){}
  startupFailure='The add-in security policy blocked '+destination+' ('+event.effectiveDirective+').';
 });
 root.addEventListener('error',event=>{
  const src=event.target?.src;
  if(src){try{if(new URL(src).hostname==='appsforoffice.microsoft.com')startupFailure='An Outlook library could not load from appsforoffice.microsoft.com. Check the connection or organization proxy.';}catch(_){}}
 },true);
 async function initialize(){
  if(!root.Office?.onReady)throw Error(startupFailure||'The Outlook library did not load. Check access to appsforoffice.microsoft.com and reopen the add-in.');
  let timer;
  try{
   const info=await Promise.race([root.Office.onReady(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(startupFailure||'Outlook did not finish connecting within 15 seconds. Reopen the add-in from an Outlook message or meeting, then retry. The Office library or host connection may be blocked.')),15000);})]);
   if(info?.host!=='Outlook')throw Error('Open Onboard using the add-in button inside Outlook. A browser preview cannot connect your Outlook account.');
   const mailbox=root.Office.context?.mailbox;
   if(!mailbox?.userProfile?.emailAddress)throw Error('Outlook has not provided the signed-in mailbox identity. Reopen the add-in from your mailbox.');
   // Pairing needs mailbox identity, not a selected message. Check item availability
   // when the user explicitly asks to include it in a request.
   return mailbox;
  }finally{clearTimeout(timer);}
 }
 function current(){return root.Office?.context?.mailbox?.item;}
 function check(item){if(!item||current()!==item)throw Error('The Outlook item changed. Ask again for the item now open.');}
 function call(invoke,message){return new Promise((resolve,reject)=>{
  let timer=setTimeout(()=>reject(Error(message+' Outlook did not respond.')),15000);
  try{invoke(r=>{clearTimeout(timer);r.status===root.Office.AsyncResultStatus.Succeeded?resolve(r.value):reject(Error(message));});}catch(e){clearTimeout(timer);reject(e);}
 });}
 async function value(field){return typeof field==='string'?field:field?.getAsync?await call(cb=>field.getAsync(cb),'Cannot read the Outlook field.') : field?.toISOString?field.toISOString():'';}
 async function readItem(){
  const item=current();check(item);
  const subject=await value(item.subject);
  const body=await call(cb=>item.body.getAsync(root.Office.CoercionType.Text,cb),'Cannot read the opened Outlook item.');check(item);
  const isMeeting=item.itemType===root.Office.MailboxEnums.ItemType.Appointment;
  let content=body;
  if(isMeeting){
   const start=await value(item.start),end=await value(item.end),location=await value(item.location);check(item);
   content='Meeting: '+subject+'\nStart: '+start+'\nEnd: '+end+'\nLocation: '+location+'\n'+body;
  }
  if(content.length>65536)throw Error('This item is too large to read completely. Select a smaller excerpt or explicitly add a Graph source.');
  return {item,source:{kind:'selected',text:content,title:subject||'Opened Outlook item',origin:isMeeting?'outlook-meeting':'outlook-mail'},title:subject||'Opened Outlook item'};
 }
 async function useDraft(item,draft){
  check(item);
  if(typeof draft!=='string'||!draft.trim())throw Error('Review a draft before opening it in Outlook.');
  if(item.itemType===root.Office.MailboxEnums.ItemType.Appointment)throw Error('Open an email to create a reply.');
  // Compose-mode subject is an async object, including saved drafts with item IDs.
  if(item.subject?.setAsync){
   if(!item.body?.setSelectedDataAsync)throw Error('This Outlook client cannot insert text here. Copy the reviewed draft instead.');
   await call(cb=>item.body.setSelectedDataAsync(draft,{coercionType:root.Office.CoercionType.Text},cb),'Outlook could not insert the draft.');
   return 'Draft inserted at the cursor (or replaced your selection). Review it and send in Outlook.';
  }
  const html='<div>'+draft.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\r?\n/g,'<br>')+'</div>';
  if(html.length>32000)throw Error('Shorten this draft before opening an Outlook reply.');
  if(typeof item.displayReplyFormAsync==='function')await call(cb=>item.displayReplyFormAsync({htmlBody:html},cb),'Outlook could not open the reply.');
  else if(typeof item.displayReplyForm==='function')item.displayReplyForm({htmlBody:html});
  else throw Error('This Outlook client cannot open a reply here. Copy the reviewed draft instead.');
  return 'Reply opened in Outlook. Review the recipient and draft, then send in Outlook.';
 }
 async function newDraft(recipient,subject,draft){
  if(!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(recipient))throw Error('Enter one complete recipient email address.');
  if(!subject.trim()||subject.length>200||/[\r\n\x00]/.test(subject))throw Error('Enter a one-line email subject of up to 200 characters.');
  if(!draft.trim()||draft.length>12000)throw Error('Review a draft of up to 12,000 characters.');
  const htmlBody='<div>'+draft.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\r?\n/g,'<br>')+'</div>';
  if(htmlBody.length>32000)throw Error('Shorten this draft before opening it in Outlook.');
  const mailbox=root.Office.context.mailbox,form={toRecipients:[recipient],subject,htmlBody};
  if(typeof mailbox.displayNewMessageFormAsync==='function')await call(cb=>mailbox.displayNewMessageFormAsync(form,cb),'Outlook could not open the email draft.');
  else if(typeof mailbox.displayNewMessageForm==='function')mailbox.displayNewMessageForm(form);
  else throw Error('This Outlook client cannot open an email draft here. Copy the reviewed text instead.');
  return 'New email draft opened in Outlook. Review and send in Outlook.';
 }
 function onItemChanged(handler){const mailbox=root.Office?.context?.mailbox;if(mailbox?.addHandlerAsync&&root.Office.EventType?.ItemChanged)mailbox.addHandlerAsync(root.Office.EventType.ItemChanged,handler);}
 root.OnboardOutlook={initialize,readItem,useDraft,newDraft,current,onItemChanged,account:()=>root.Office?.context?.mailbox?.userProfile?.emailAddress?.toLowerCase()};
})(globalThis);
