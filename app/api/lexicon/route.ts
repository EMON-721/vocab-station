import {getSignedInUser} from '../../google-auth';
export async function GET(request:Request){
 if(!await getSignedInUser())return Response.json({error:'Sign in to use dictionary lookup.'},{status:401});
 const word=new URL(request.url).searchParams.get('word')||'';
 if(!word||word.length>100)return Response.json({error:'Enter a valid word.'},{status:400});
 try{const r=await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/'+encodeURIComponent(word),{signal:AbortSignal.timeout(8000)});if(!r.ok)return Response.json({error:'No dictionary entry found. You can add your own example.'},{status:404});const entries=await r.json() as any[];const definitions=entries.flatMap(e=>(e.meanings||[]).flatMap((m:any)=>m.definitions||[]));return Response.json({definition:definitions[0]?.definition||'',example:definitions.find((d:any)=>d.example)?.example||'',phonetic:entries[0]?.phonetic||'',source:'Free Dictionary API'},{headers:{'Cache-Control':'private, max-age=86400'}})}catch{return Response.json({error:'Dictionary lookup unavailable. You can add an example manually.'},{status:502})}
}
