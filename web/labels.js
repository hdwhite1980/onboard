'use strict';
(function(root){
 const unavailable=()=>({state:'unavailable',labels:[],origin:'Office label inspection unavailable'});
 function headers(text){
  const value=String(text).replace(/\r?\n[ \t]+/g,' ').split(/\r?\n/).filter(line=>/^msip_labels:/i.test(line)).map(line=>line.slice(line.indexOf(':')+1)).join(';');
  const groups={};
  for(const entry of value.split(';')){
   const match=entry.trim().match(/^MSIP_Label_([0-9a-f-]{36})_(\w+)=(.*)$/i);if(!match)continue;
   (groups[match[1].toLowerCase()]??={})[match[2].toLowerCase()]=match[3].trim();
  }
  const labels=Object.entries(groups).filter(([,p])=>p.enabled?.toLowerCase()!=='false').map(([id,p])=>({id,tenant:(p.siteid||'').toLowerCase(),name:p.name||'',enabled:p.enabled?.toLowerCase()==='true',content_bits:p.contentbits||'0'}));
  const malformed=value&&value.split(';').some(entry=>entry.trim()&&!/^MSIP_Label_[0-9a-f-]{36}_\w+=/i.test(entry.trim()));
  return {state:malformed?'unavailable':labels.length?'labeled':'unlabeled',labels,origin:'Outlook MSIP_Labels headers'};
 }
 function call(invoke){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Label inspection timed out')),10000);try{invoke(r=>{clearTimeout(timer);r.status===root.Office.AsyncResultStatus.Succeeded?resolve(r.value):reject(Error('Label unavailable'));});}catch(error){clearTimeout(timer);reject(error);}});}
 async function outlook(item){
  try{
   if(item.sensitivityLabel?.getAsync){const id=await call(cb=>item.sensitivityLabel.getAsync(cb));return {state:id?'labeled':'unlabeled',labels:id?[{id:id.toLowerCase(),tenant:'',enabled:true}]:[],origin:'Outlook compose sensitivity API'};}
   if(item.getAllInternetHeadersAsync)return headers(await call(cb=>item.getAllInternetHeadersAsync(cb)));
  }catch(_){}
  return unavailable();
 }
 root.OnboardLabels={headers,outlook};
})(globalThis);
