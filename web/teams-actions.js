'use strict';
(function(root){
 const field=id=>document.getElementById(id);
 let launch=null,launchError='',ready=false,generated=false;
 const fragment=location.hash||'';
 if(fragment.startsWith('#onboardAction=')){
  // Remove selected text from the address immediately. Never store it locally.
  history.replaceState(null,'',location.pathname+location.search);
  try{
   if(fragment.length>24000)throw Error('oversized');
   launch=JSON.parse(decodeURIComponent(fragment.slice('#onboardAction='.length)));
   if(launch.version!==1||!['summarize','reply','outlook'].includes(launch.command)||typeof launch.text!=='string'||launch.text.length>8000||typeof launch.selected!=='boolean')throw Error('invalid');
  }catch(_){launch=null;launchError='The Teams message action is invalid. Close it and open the action again.';}
 }
 function checkAccount(context){
  if(!launch||!root.OnboardActionConfig?.botId||launch.bot!==root.OnboardActionConfig.botId)throw Error('This Teams action does not match the deployed bot registration. Update the app package and hosted files together.');
  if(!launch.account||!launch.tenant||context.user?.id?.toLowerCase()!==launch.account.toLowerCase()||context.user?.tenant?.id?.toLowerCase()!==launch.tenant.toLowerCase())throw Error('This action belongs to a different Microsoft account. Close it and reopen from your current Teams account.');
  if(launch.channel&&context.channel?.id&&launch.channel!==context.channel.id)throw Error('Teams channel changed. Reopen the message action.');
  if(!launch.channel&&launch.conversation&&context.chat?.id&&launch.conversation!==context.chat.id)throw Error('Teams chat changed. Reopen the message action.');
 }
 function reset(){generated=false;if(field('action-review'))field('action-review').checked=false;if(field('action-insert'))field('action-insert').disabled=true;}
 root.OnboardActions={
  active:()=>!!launch,
  initialize(context){
   if(launchError)throw Error(launchError);if(!launch)return;
   checkAccount(context);ready=true;field('teams-action-panel').hidden=false;
   field('action-title').textContent=({summarize:'Summarize selected message',reply:'Suggest a reply',outlook:'Prepare a draft for Outlook'})[launch.command];
   field('action-source').value=launch.text;field('action-source').readOnly=launch.selected;
   field('action-source-label').textContent=launch.selected?'Selected message (attachments excluded)':'Paste the message or text to work with';
   field('task').value=launch.command==='reply'?'reply':'summarize';field('include').checked=true;
   field('prompt').value=launch.command==='outlook'?'Prepare a concise conversational email draft based on the selected message. Do not invent recipients, facts or commitments.':launch.command==='reply'?'Suggest a concise conversational reply to this message. Do not invent commitments or completed actions.':'Summarize this message concisely. Preserve its key facts and action items.';
   for(const id of ['teams-scope','teams-load','teams-message','native-recipient','native-draft','native-review','message-composer'])if(field(id))field(id).hidden=true;
   field('action-review-section').hidden=launch.command==='outlook';field('action-insert').hidden=launch.command==='outlook';
   field('action-note').textContent=launch.command==='outlook'?'After generation, review the response and use Transfer draft to Outlook add-in below. Open Outlook’s local draft inbox to review and send.':'After generation, review the response, then insert a draft card into this chat. You send it in Teams.';
   if(launch.command==='outlook')field('handoff-outgoing').open=true;
  },
  async source(){
   if(!ready)throw Error('Reopen this action inside Teams.');
   checkAccount(await root.OnboardTeams.current());
   const text=field('action-source').value;
   if(!text.trim()||text.length>8000)throw Error('Provide message text up to 8,000 characters. No conversation was searched.');
   return {kind:'selected',origin:'teams-message',title:launch.selected?'Selected Teams message':'Text supplied in Teams compose action',text};
  },
  reset,
  result(result){reset();generated=ready&&result.status==='generated';},
  disconnect(){reset();}
 };
 field('action-review')?.addEventListener('change',()=>{field('action-insert').disabled=!generated||!field('action-review').checked;});
 field('answer')?.addEventListener('input',()=>{field('action-review').checked=false;field('action-insert').disabled=true;});
 field('action-source')?.addEventListener('input',()=>{reset();if(typeof itemChanged==='function')itemChanged();});
 field('action-insert')?.addEventListener('click',async()=>{
  if(!generated||!field('action-review').checked||launch.command==='outlook')return;
  field('action-insert').disabled=true;
  try{
   await verifyHostAccount();await api('handoff-list',{});checkAccount(await root.OnboardTeams.current());
   const body=field('answer').value;
   if(!body.trim()||body.length>12000)throw Error('Review a nonempty draft of up to 12,000 characters.');
   const submit=root.microsoftTeams?.tasks?.submitTask;
   if(!submit)throw Error('This Teams client cannot insert this draft. Copy the reviewed text instead.');
   submit({body,reviewed:true},root.OnboardActionConfig.botId);reset();
  }catch(error){field('status').textContent=error.message;field('action-insert').disabled=!generated||!field('action-review').checked;}
 });
 root.addEventListener('pagehide',()=>{launch=null;ready=false;reset();if(field('action-source'))field('action-source').value='';});
})(globalThis);
