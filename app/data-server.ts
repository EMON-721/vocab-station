import pdfWords from './pdf-vocabulary.json';
import {enrichExample} from './enrich-examples';
import {env} from 'cloudflare:workers';
import {seed,wordKey,type Word} from './words';
import {academicWords} from './academic-words';
import {newWords} from './new-words';
import {expandedWords} from './expanded-words';
import {getSignedInUser} from './google-auth';
export async function auth(){const user=await getSignedInUser();return user?{...user,role:env.ADMIN_EMAIL&&user.email.toLowerCase()===env.ADMIN_EMAIL.toLowerCase()?'ADMIN':'USER'}:null;}
export async function readRecord(id:string,fallback:any=null){const row=await env.DB!.prepare('SELECT data FROM records WHERE id=?').bind(id).first<{data:string}>();return row?JSON.parse(row.data):fallback;}
export async function writeRecord(id:string,value:unknown){await env.DB!.prepare('INSERT INTO records(id,data) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').bind(id,JSON.stringify(value)).run();}
export async function vocabulary(userId:string){let shared:Word[]=await readRecord('shared-vocabulary-v2',seed);if(!await readRecord('expansion-50-v1',false)){const additions=expandedWords.filter(w=>!shared.some(x=>x.word.toLowerCase()===w.word.toLowerCase()));if(additions.length){shared=[...shared,...additions];await writeRecord('shared-vocabulary-v2',shared);}await writeRecord('expansion-50-v1',true);}if(!await readRecord('academic-expansion-50-v1',false)){const additions=academicWords.filter(w=>!shared.some(x=>x.word.toLowerCase()===w.word.toLowerCase()));if(additions.length){shared=[...shared,...additions];await writeRecord('shared-vocabulary-v2',shared);}await writeRecord('academic-expansion-50-v1',true);}if(!await readRecord('original-expansion-400-v1',false)){const additions=newWords.filter(w=>!shared.some(x=>x.word.toLowerCase()===w.word.toLowerCase()));if(additions.length){shared=[...shared,...additions];await writeRecord('shared-vocabulary-v2',shared);}await writeRecord('original-expansion-400-v1',true);}if(!await readRecord('practice-examples-v1',false)){const enriched=shared.map(enrichExample);if(enriched.some((w,i)=>JSON.stringify(w)!==JSON.stringify(shared[i])))await writeRecord('shared-vocabulary-v2',enriched);shared=enriched;await writeRecord('practice-examples-v1',true);}if(!await readRecord('owner-pdf-book03-v1',false)){const known=new Set(shared.map(w=>w.word.normalize('NFKC').trim().toLowerCase()));const additions=pdfWords.filter(w=>!known.has(w.word.toLowerCase()));if(additions.length){shared=[...shared,...additions];await writeRecord('shared-vocabulary-v2',shared);}await writeRecord('owner-pdf-book03-v1',true);}const personal:Word[]=await readRecord('personal-words:'+userId,[]);const state=await readRecord(userId,{});const excluded=new Set<string>(state.adminExcludedWords||[]);return [...shared,...personal].filter(w=>!excluded.has(wordKey(w)));}
export function cleanWord(data:any):Word {
 const short=(v:unknown,max=1500)=>String(v||'').trim().slice(0,max);
 const examples=Array.isArray(data.practice_examples)
  ? data.practice_examples.slice(0,25).map((e:any)=>({english:short(e?.english),bengali:short(e?.bengali)})).filter((e:any)=>e.english)
  : [];
 const accepted=Array.isArray(data.accepted)?data.accepted.slice(0,20).map((a:unknown)=>short(a,120)).filter(Boolean):[];
 const w:Word={
  id:crypto.randomUUID(),word:short(data.word,80),label:short(data.label,100)||short(data.word,80),
  part_of_speech:short(data.part_of_speech,180),
  english_meaning:short(data.english_meaning),bengali_meaning:short(data.bengali_meaning),
  simple_example:short(data.simple_example),bengali_example:short(data.bengali_example),
  phonetic_transcription:short(data.phonetic_transcription,160),source_details:short(data.source_details,220),
  band_label:short(data.band_label,130),article:short(data.article,160),
  countability:short(data.countability,160),usage_note:short(data.usage_note),
  practice_examples:examples,accepted,source:'Personal vocabulary',example_source:'Learner contribution'
 };
 if([w.word,w.part_of_speech,w.english_meaning,w.bengali_meaning,w.simple_example].some(v=>!v))throw Error('Word, part of speech, both meanings and an English example sentence are required.');
 return w;
}
export function duplicates(words:Word[],w:Word,except?:string){return words.some(x=>wordKey(x)!==except&&x.word.normalize('NFKC').trim().toLowerCase()===w.word.normalize('NFKC').trim().toLowerCase());}
