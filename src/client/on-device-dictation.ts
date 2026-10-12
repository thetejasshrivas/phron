export interface LocalRecognition {
 processLocally?:boolean;lang:string;continuous:boolean;interimResults:boolean;
 onresult:((event:{results:ArrayLike<{isFinal:boolean;0:{transcript:string}}>})=>void)|null;
 onerror:((event:{error:string})=>void)|null;onend:(()=>void)|null;onstart?: (()=>void)|null;
 start:()=>void;abort:()=>void;stop?:()=>void;
}
export interface LocalRecognitionConstructor {
 new():LocalRecognition;prototype:LocalRecognition;
 available?: (options:{langs:string[];processLocally:true})=>Promise<string>;
}
/** D23-v2: prefer installed local speech; browser-provider speech requires explicit consent. */
export class OnDeviceDictation {
 private generation=0;
 private recognition:LocalRecognition|null=null;
 constructor(private text:(value:string)=>void,
  private status:(phase:'checking'|'listening'|'idle',message:string)=>void,
  private consentToBrowserSpeech:()=>boolean=()=>false){}
 stop(){
  this.generation++;
  const recognition=this.recognition;this.recognition=null;
  if(recognition){
   recognition.onresult=null;recognition.onerror=null;recognition.onend=null;recognition.onstart=null;
   try{recognition.abort();}catch{ /* Already stopped. */ }
  }
  this.status('idle','Voice stopped. Review your text before capturing; nothing has been saved.');
 }
 finish(){
  if(!this.recognition){this.stop();return;}
  try{this.recognition.stop?.();}catch{this.stop();}
 }
 async start(Recognition:LocalRecognitionConstructor|undefined,lang:string,existing:string){
  this.stop();const generation=this.generation;
  const fail=(message:string)=>{
   if(generation!==this.generation)return;
   this.stop();this.status('idle',`${message} Type your entry; existing text is preserved. Nothing has been saved.`);
  };
  if(!Recognition){fail('Speech recognition is unsupported in this browser.');return;}
  this.status('checking','Checking installed on-device speech support…');
  let local=false;
  if(typeof Recognition.available==='function'&&'processLocally' in Recognition.prototype){
   try{local=await Recognition.available({langs:[lang],processLocally:true})==='available';}
   catch{ /* Local preflight unavailable; consented browser mode remains possible. */ }
  }
  if(generation!==this.generation)return;
  if(!local&&!this.consentToBrowserSpeech()){fail('Browser speech processing was not accepted.');return;}
  if(generation!==this.generation)return;
  try{
   const recognition=new Recognition();
   if(local){recognition.processLocally=true;if(recognition.processLocally!==true){fail('On-device speech could not be enabled.');return;}}
   else if('processLocally' in recognition){recognition.processLocally=false;}
   recognition.lang=lang||'en-IN';recognition.continuous=false;recognition.interimResults=false;
   this.recognition=recognition;
   recognition.onresult=event=>{
    if(generation!==this.generation)return;
    const transcript=Array.from(event.results).filter(result=>result.isFinal).map(result=>result[0].transcript).join(' ');
    if(transcript)this.text(Array.from([existing,transcript].filter(Boolean).join(' ')).slice(0,280).join(''));
   };
   recognition.onstart=()=>{
    if(generation!==this.generation)return;
    this.status('listening',local?'Listening on this device… Tap to finish. No audio is uploaded.':'Listening via browser speech recognition… Tap to finish. Your browser may send audio to its speech provider.');
   };
   recognition.onerror=event=>{
    const messages:Record<string,string>={
     'not-allowed':'Microphone permission denied. Allow microphone access in browser and device settings to try again.',
     'service-not-allowed':'Speech recognition service unavailable or disallowed by this browser.',
     'no-speech':'No speech detected. Try again when ready.',
     'audio-capture':'No usable microphone was found. Check your microphone settings.',
     'network':'Speech service connection failed.',
     'language-not-supported':'The selected recognition language is unsupported.',
     'aborted':'Speech recognition was interrupted.'
    };
    fail(messages[event.error]??'Speech recognition failed.');
   };
   recognition.onend=()=>{
    if(generation!==this.generation)return;
    this.recognition=null;this.generation++;
    this.status('idle','Review the recognized text. Capture still requires your explicit action.');
   };
   this.status('checking','Starting speech recognition. Allow microphone permission if prompted.');
   recognition.start();
  }catch{fail('Speech recognition could not start.');}
 }
}
