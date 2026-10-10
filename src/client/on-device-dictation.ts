export interface LocalRecognition {
 processLocally:boolean;lang:string;continuous:boolean;interimResults:boolean;
 onresult:((event:{results:ArrayLike<{isFinal:boolean;0:{transcript:string}}>})=>void)|null;
 onerror:((event:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;abort:()=>void;
}
export interface LocalRecognitionConstructor {new():LocalRecognition;prototype:LocalRecognition;available:(options:{langs:string[];processLocally:true})=>Promise<string>}
/** D23: feature verification is mandatory. There is deliberately no install or remote fallback API. */
export class OnDeviceDictation {
 private generation=0;private recognition:LocalRecognition|null=null;
 constructor(private text:(value:string)=>void,private status:(phase:'checking'|'listening'|'idle',message:string)=>void){}
 stop(){this.generation++;const recognition=this.recognition;this.recognition=null;if(recognition){recognition.onresult=null;recognition.onerror=null;recognition.onend=null;try{recognition.abort();}catch{ /* Already stopped by the browser. */ }}this.status('idle','Voice stopped. Review your text before capturing; nothing has been saved.');}
 async start(Recognition:LocalRecognitionConstructor|undefined,lang:string,existing:string){
  this.stop();const generation=this.generation;const fallback=()=>{if(generation!==this.generation)return;this.stop();this.status('idle','Local voice is unavailable or permission was denied. Type your entry; existing text is preserved. No audio is uploaded.');};
  if(!Recognition||typeof Recognition.available!=='function'||!('processLocally' in Recognition.prototype)){fallback();return;}
  this.status('checking','Checking already-installed local voice support. No language download or audio upload.');
  try{
   if(await Recognition.available({langs:[lang],processLocally:true})!=='available'){fallback();return;}if(generation!==this.generation)return;
   const recognition=new Recognition();recognition.processLocally=true;if(recognition.processLocally!==true){fallback();return;}recognition.lang=lang;recognition.continuous=false;recognition.interimResults=false;this.recognition=recognition;
   recognition.onresult=event=>{if(generation!==this.generation)return;const transcript=Array.from(event.results).filter(result=>result.isFinal).map(result=>result[0].transcript).join(' ');if(transcript)this.text(Array.from([existing,transcript].filter(Boolean).join(' ')).slice(0,280).join(''));};
   recognition.onerror=()=>fallback();recognition.onend=()=>{if(generation!==this.generation)return;this.recognition=null;this.generation++;this.status('idle','Review the recognized text. Capture still requires your explicit action.');};
   this.status('listening','Listening on this device. Microphone permission is required. Stop when ready; no audio is uploaded.');recognition.start();
  }catch{fallback();}
 }
}
