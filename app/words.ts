import pdfWords from './pdf-vocabulary.json';
import {enrichExample} from './enrich-examples';
import campusWords from './campus-vocabulary.json';
import {curated} from './curated-examples';
import {bonusWords} from './bonus-words';
import {academicWords} from './academic-words';
import {newWords} from './new-words';
import {expandedWords} from './expanded-words';
export type Word={id?:string;label?:string;source_details?:string;accepted?:string[];bengali_example?:string;source?:string;example_source?:string;word:string;part_of_speech:string;english_meaning:string;bengali_meaning:string;simple_example:string;phonetic_transcription?:string;practice_examples?:{english:string;bengali:string}[];usage_note?:string;article?:string;countability?:string;band_label?:string;audio_url?:string;sentence_audio_url?:string};
const rows=[
['abundant','adjective','Existing in large quantities','প্রচুর','The region has abundant natural resources.','/əˈbʌndənt/'],
['adapt','verb','To change to suit new conditions','মানিয়ে নেওয়া','Students must adapt to a new learning environment.','/əˈdæpt/'],
['advocate','verb','To publicly support an idea','সমর্থন করা','Many scientists advocate renewable energy.','/ˈædvəkeɪt/'],
['allocate','verb','To give resources for a particular purpose','বরাদ্দ করা','Governments should allocate more funds to education.','/ˈæləkeɪt/'],
['ambiguous','adjective','Having more than one possible meaning','দ্ব্যর্থক','The instructions were ambiguous and confused the students.','/æmˈbɪɡjuəs/'],
['analyse','verb','To examine something in detail','বিশ্লেষণ করা','Researchers analyse the results before drawing conclusions.','/ˈænəlaɪz/'],
['anticipate','verb','To expect something to happen','প্রত্যাশা করা','Experts anticipate a rise in global temperatures.','/ænˈtɪsɪpeɪt/'],
['approach','noun','A way of dealing with something','পদ্ধতি','This approach makes learning more enjoyable.','/əˈprəʊtʃ/'],
['assess','verb','To judge the quality or value of something','মূল্যায়ন করা','Teachers assess student progress regularly.','/əˈses/'],
['beneficial','adjective','Having a helpful or positive effect','উপকারী','Regular exercise is beneficial to mental health.','/ˌbenɪˈfɪʃəl/'],
['coherent','adjective','Logical and easy to understand','সুসংগত','An essay needs a coherent argument.','/kəʊˈhɪərənt/'],
['compelling','adjective','Very convincing or interesting','অত্যন্ত বিশ্বাসযোগ্য','The report provides compelling evidence.','/kəmˈpelɪŋ/'],
['comprehensive','adjective','Including all important details','বিস্তৃত','The government published a comprehensive report.','/ˌkɒmprɪˈhensɪv/'],
['consequence','noun','A result of an action or situation','পরিণতি','Flooding is one consequence of climate change.','/ˈkɒnsɪkwəns/'],
['considerable','adjective','Large in amount or importance','উল্লেখযোগ্য','The project requires considerable investment.','/kənˈsɪdərəbl/'],
['consistent','adjective','Always behaving in a similar way','ধারাবাহিক','Consistent practice improves language skills.','/kənˈsɪstənt/'],
['contribute','verb','To help cause or achieve something','অবদান রাখা','Trees contribute to cleaner air.','/kənˈtrɪbjuːt/'],
['crucial','adjective','Extremely important','অত্যন্ত গুরুত্বপূর্ণ','Access to clean water is crucial for health.','/ˈkruːʃəl/'],
['decline','noun','A decrease in amount or quality','হ্রাস','There has been a decline in air quality.','/dɪˈklaɪn/'],
['demonstrate','verb','To show something clearly','প্রদর্শন করা','The findings demonstrate the value of early education.','/ˈdemənstreɪt/'],
['diverse','adjective','Including many different types','বৈচিত্র্যময়','The city has a diverse population.','/daɪˈvɜːs/'],
['efficient','adjective','Working well without wasting resources','দক্ষ','Public transport is an efficient way to travel.','/ɪˈfɪʃənt/'],
['emerge','verb','To become known or visible','আবির্ভূত হওয়া','New challenges emerge as technology develops.','/ɪˈmɜːdʒ/'],
['enhance','verb','To improve the quality of something','উন্নত করা','Reading can enhance your vocabulary.','/ɪnˈhɑːns/'],
['evaluate','verb','To judge the value or effectiveness of something','মূল্যায়ন করা','We need to evaluate the impact of this policy.','/ɪˈvæljueɪt/'],
['evidence','noun','Facts that support a belief or claim','প্রমাণ','There is strong evidence that exercise reduces stress.','/ˈevɪdəns/'],
['feasible','adjective','Possible and practical to do','বাস্তবায়নযোগ্য','Solar power is a feasible option for rural areas.','/ˈfiːzəbl/'],
['fluctuate','verb','To rise and fall irregularly','ওঠানামা করা','Energy prices fluctuate throughout the year.','/ˈflʌktʃueɪt/'],
['fundamental','adjective','Forming a basic and important part','মৌলিক','Education is a fundamental human right.','/ˌfʌndəˈmentəl/'],
['implement','verb','To put a plan into action','বাস্তবায়ন করা','Schools should implement better safety measures.','/ˈɪmplɪment/'],
['implication','noun','A possible effect or result','সম্ভাব্য প্রভাব','This discovery has an important implication for medicine.','/ˌɪmplɪˈkeɪʃən/'],
['incentive','noun','Something that encourages an action','প্রণোদনা','Tax reductions provide an incentive to invest.','/ɪnˈsentɪv/'],
['inevitable','adjective','Certain to happen','অনিবার্য','Some changes are inevitable as cities grow.','/ɪnˈevɪtəbl/'],
['innovation','noun','A new idea or method','উদ্ভাবন','Innovation can help reduce industrial waste.','/ˌɪnəˈveɪʃən/'],
['justify','verb','To give a good reason for something','যৌক্তিকতা দেখানো','The benefits must justify the cost.','/ˈdʒʌstɪfaɪ/'],
['mitigate','verb','To make something less harmful','প্রশমিত করা','Planting trees can mitigate the effects of flooding.','/ˈmɪtɪɡeɪt/'],
['perspective','noun','A particular way of considering something','দৃষ্টিভঙ্গি','Travel offers a fresh perspective on other cultures.','/pəˈspektɪv/'],
['predominantly','adverb','Mainly or mostly','প্রধানত','The area is predominantly agricultural.','/prɪˈdɒmɪnəntli/'],
['resilient','adjective','Able to recover after difficulties','ঘুরে দাঁড়াতে সক্ষম','Communities must become more resilient to storms.','/rɪˈzɪliənt/'],
['significant','adjective','Large or important enough to be noticed','উল্লেখযোগ্য','The study found a significant improvement in health.','/sɪɡˈnɪfɪkənt/'],
['sustainable','adjective','Able to continue without harming resources','টেকসই','We need sustainable solutions to water shortages.','/səˈsteɪnəbl/'],
['underlying','adjective','Being the basic cause of something','অন্তর্নিহিত','The study explores the underlying causes of poverty.','/ˌʌndəˈlaɪɪŋ/'],
['valid','adjective','Based on sound reasoning or evidence','যুক্তিসংগত','She made a valid point about public spending.','/ˈvælɪd/'],
['widespread','adjective','Existing in many places','ব্যাপক','Internet access is now widespread in urban areas.','/ˈwaɪdspred/']
];
export const starter:Word[]=rows.map(([word,part_of_speech,english_meaning,bengali_meaning,simple_example,phonetic_transcription])=>({word,part_of_speech,english_meaning,bengali_meaning,simple_example,phonetic_transcription}));
export function assignedDay(i:number,track:number,total=3018){const days=[120,150,180].includes(track)?track:120;const baseline=3518;const size=total>=baseline+pdfWords.length?(i<baseline?baseline:total-baseline):total;const position=total>=baseline+pdfWords.length&&i>=baseline?i-baseline:i;return Math.min(days,Math.floor(position*days/Math.max(1,size))+1);}

export const curriculumVersion='vocab-station-v2';
export const wordKey=(w:Word)=>w.id||w.word;
export const sourceWords:Word[]=campusWords.map(raw=>{
 const existing=starter.find(w=>w.word===raw.word);const teaching=curated[raw.id];
 const details=raw.details;
 const pos=[['adj.','adjective'],['adv.','adverb'],['n.','noun'],['v.','verb'],['pron.','pronoun'],['prep.','preposition'],['det.','determiner'],['number','number'],['article','article'],['conj.','conjunction']].filter(([short])=>details.split(/[,\s]+/).includes(short)).map(([,full])=>full).join(', ')||details.replace(/\b[A-C][12]\b/g,'').trim()||'other';
 return enrichExample({...existing,id:raw.id,word:raw.word,label:raw.label,source_details:details,accepted:('accepted' in raw?raw.accepted:undefined) as string[]|undefined,part_of_speech:pos,bengali_meaning:raw.meaning,english_meaning:teaching?.[0]||existing?.english_meaning||'',simple_example:teaching?.[1]||existing?.simple_example||'',bengali_example:teaching?.[2]||'',example_source:teaching||existing?'VocabStation teaching example':'',source:'Campus to Country / vocabulary-full.json'});
});
export const seed:Word[]=[...sourceWords,...[...bonusWords,...expandedWords,...academicWords,...newWords,...pdfWords].filter((w,i,all)=>!sourceWords.some(x=>x.word.toLowerCase()===w.word.toLowerCase())&&all.findIndex(x=>x.word.toLowerCase()===w.word.toLowerCase())===i)];
export function upgradeState(old:any){
 if(!old)return null;
 if(old.curriculumVersion===curriculumVersion)return {...old,track:[120,150,180].includes(old.track)?old.track:120};
 const keys=(list:string[])=>[...new Set((list||[]).flatMap(k=>seed.filter(w=>wordKey(w)===k||w.word===k).map(wordKey)))];
 return {...old,track:[120,150,180].includes(old.track)?old.track:120,words:seed,mastered:keys(old.mastered),review:keys(old.review),curriculumVersion};
}
export function blankFor(w:Word){const at=w.simple_example.toLowerCase().indexOf(w.word.toLowerCase());return at<0?'':w.simple_example.slice(0,at)+'________'+w.simple_example.slice(at+w.word.length);}
