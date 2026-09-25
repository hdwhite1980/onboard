'use strict';
// UI readiness only; no account tokens, message content or model requests here.
(function(root){
 const sdkURL='https://res.cdn.office.net/teams-js/2.19.0/js/MicrosoftTeams.min.js';
 const sdkIntegrity='sha384-h+MoYshcGDPMLlXjHLt2dSgsgYyWQ+yHd4Ob13htDsu8trGPea8Vooa8+tLtRzU7';
 function bounded(promise,milliseconds,message){
  let timer;
  return Promise.race([Promise.resolve(promise),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(message)),milliseconds);})]).finally(()=>clearTimeout(timer));
 }
 async function loadSDK(){
  if(root.microsoftTeams?.app)return root.microsoftTeams;
  const script=document.createElement('script');script.src=sdkURL;script.async=true;script.integrity=sdkIntegrity;script.crossOrigin='anonymous';
  const loaded=new Promise((resolve,reject)=>{script.onload=()=>root.microsoftTeams?.app ? resolve(root.microsoftTeams) : reject(Error('Microsoft Teams SDK was not available after download.'));script.onerror=()=>reject(Error('Microsoft Teams SDK could not load. Check the connection, proxy, and access to res.cdn.office.net.'));});
  document.head.appendChild(script);
  try{return await bounded(loaded,8000,'Microsoft Teams SDK download timed out. Check the connection or proxy; reload this tab to retry.');}
  finally{script.onload=null;script.onerror=null;script.remove();}
 }
 async function initialize(){
  const sdk=await loadSDK();let initialized=false;
  try{
   await bounded(sdk.app.initialize(),8000,'Teams did not complete its page handshake. Open this page inside Teams and reload the tab.');initialized=true;
   sdk.app.notifyAppLoaded();
   const context=await bounded(sdk.app.getContext(),5000,'Teams did not provide its context. Reload the tab to retry.');
   if(new URLSearchParams(location.search).has('configure')){
    const config=sdk.pages.config;
    config.registerOnSaveHandler(async event=>{
     try{await bounded(config.setConfig({entityId:'onboard',suggestedDisplayName:'Onboard AI',contentUrl:location.origin+location.pathname,websiteUrl:location.origin+location.pathname}),5000,'Teams tab settings could not be saved.');event.notifySuccess();}
     catch(_){event.notifyFailure('Onboard tab settings could not be saved. Retry after reconnecting Teams.');}
    });
    config.setValidityState(true);
   }
   sdk.app.notifySuccess();return context;
  }catch(error){
   if(initialized){try{sdk.app.notifyFailure({reason:sdk.app.FailedReason?.Other || 'Other',message:error.message});}catch(_){}}
   throw error;
  }
 }
 root.OnboardTeams={initialize};
})(globalThis);
