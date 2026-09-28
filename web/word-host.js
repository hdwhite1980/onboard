'use strict';
(function(root){
 let captured=null;
 function call(invoke){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Word did not respond.')),15000);try{invoke(r=>{clearTimeout(timer);r.status===Office.AsyncResultStatus.Succeeded?resolve(r.value):reject(Error(r.error?.message||'Word request failed.'));});}catch(error){clearTimeout(timer);reject(error);}});}
 async function initialize(){const info=await Office.onReady();if(info.host!=='Word')throw Error('Open this add-in inside Microsoft Word.');if(!root.Word?.run)throw Error('Word APIs are unavailable in this client.');}
 async function capture(){
  captured=null;
  const before=await Word.run(async context=>{const body=context.document.body,selection=context.document.getSelection();body.load('text');selection.load('text');await context.sync();return {text:body.text,selection:selection.text,url:Office.context.document.url};});
  const file=await call(cb=>Office.context.document.getFileAsync(Office.FileType.Compressed,{sliceSize:65536},cb));
  try{
   if(file.size>4000000)throw Error('Choose a Word document below 4 MB.');
   const chunks=[];let length=0;
   for(let i=0;i<file.sliceCount;i++){const slice=await call(cb=>file.getSliceAsync(i,cb));const bytes=Uint8Array.from(slice.data);length+=bytes.length;if(length>4000000)throw Error('Document exceeds the file limit.');chunks.push(bytes);}
   const data=new Uint8Array(length);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.length;}
   let binary='';for(let i=0;i<data.length;i+=8192)binary+=String.fromCharCode(...data.subarray(i,i+8192));
   await Word.run(async context=>{const body=context.document.body;body.load('text');await context.sync();if(body.text!==before.text||Office.context.document.url!==before.url)throw Error('Document changed during capture. Inspect it again.');});
   captured=before;return {file:btoa(binary),title:'Word document'};
  }finally{await call(cb=>file.closeAsync(cb));}
 }
 async function insert(text,replaceSelection=false){
  if(!captured)throw Error('Inspect the current document before inserting a draft.');
  const original=captured;
  await Word.run(async context=>{
   const body=context.document.body,selection=context.document.getSelection();body.load('text');selection.load('text');await context.sync();
   if(body.text!==original.text||Office.context.document.url!==original.url)throw Error('The document changed. Inspect and ask again before inserting.');
   if(replaceSelection&&(!original.selection||selection.text!==original.selection))throw Error('The selected text changed or is empty. Select text, then inspect and ask again.');
   if(replaceSelection)selection.insertText(text,Word.InsertLocation.replace);else body.insertParagraph(text,Word.InsertLocation.end);
   await context.sync();captured=null;
  });
  return 'Draft inserted in Word. Review it and save in Word. Inspect again before another AI edit.';
 }
 root.OnboardWord={initialize,capture,insert};
})(globalThis);
