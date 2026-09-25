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
 root.OnboardOutlook={initialize};
})(globalThis);
