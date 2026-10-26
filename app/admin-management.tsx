'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Word } from './words';
import { wordKey } from './words';

type Learner = {
 id:string; name:string; username:string; studentId:string; school?:string;
 exam?:string; start?:string; track:number; adminDayAccess?:Record<string,string>;
 adminWordDays?:Record<string,number>; adminExcludedWords?:string[];
 adminCompletedDays?:number[]; attempts?:any[]; practice?:any[];
 mastered?:number; review?:number; activity?:Record<string,number>;
};
const defaultSite = {
 siteTitle:'Vocab Station',logoUrl:'/logo.svg',
 tagline:'YOUR PERSONAL VOCABULARY WORKSPACE',
 heroTitle:'Words you learn. A voice you own.',
 about:'Learn English vocabulary with Bengali meanings, pronunciation, typing and your own sentences.',
 footer:'Your learning workspace',
 progressTitle:'Your learning progress', dailyTitle:'Your daily vocabulary',
 practiceTitle:'Practise this vocabulary',mockTitle:'Weekly mocks & revision',
 learningNotice:'Read and mark every word, complete recall and sentence practice.'
};

export default function AdminManagement({users,words,onRefresh,onSettings}:{
 users:Learner[];words:Word[];onRefresh:()=>void;onSettings:(s:any)=>void;
}) {
 const [site,setSite]=useState<any>(defaultSite);
 const [requests,setRequests]=useState<any[]>([]);
 const [tests,setTests]=useState<Record<string,any>>({});
 const [selected,setSelected]=useState('');
 const [status,setStatus]=useState('');
 const [busy,setBusy]=useState(false);
 const [day,setDay]=useState(1),[mode,setMode]=useState('allow');
 const [assignDay,setAssignDay]=useState(1),[query,setQuery]=useState(''),[wordId,setWordId]=useState('');
 const [week,setWeek]=useState(1);
 const [test,setTest]=useState<any>({enabled:true,questionCount:30,timeSeconds:900,passPercent:90,writingCount:2,showAnswers:true,title:'Week 1 test'});
 const learner=users.find(u=>u.id===selected);
 const candidates=useMemo(()=>words.filter(w=>(w.word+' '+w.bengali_meaning).toLowerCase().includes(query.toLowerCase())).slice(0,35),[words,query]);

 async function load(){
  try{
   const r=await fetch('/api/admin',{cache:'no-store'}),d=await r.json();
   if(!r.ok)throw Error(d.error);
   setSite({...defaultSite,...(d.settings||{})});
   setRequests(d.wordRequests||[]);
   setTests(d.tests||{});
  }catch(e:any){setStatus(e.message||'Cannot load administrator settings');}
 }
 useEffect(()=>{void load()},[]);
 useEffect(()=>{setTest({enabled:true,questionCount:30,timeSeconds:900,passPercent:90,writingCount:2,showAnswers:true,title:'Week '+week+' test',...(tests[week]||{})})},[week,tests]);
 useEffect(()=>{if(learner){setDay(1);setAssignDay(1)}},[selected]);
 async function action(payload:any,done?:()=>void){
  if(busy)return;setBusy(true);setStatus('Saving…');
  try{
   const r=await fetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:selected,...payload})});
   const d=await r.json();
   if(!r.ok)throw Error(d.error||'Save failed');
   setStatus('Saved successfully');
   if(payload.action==='siteSettings'){const values={...site,...(d.settings||{})};setSite(values);onSettings(values);}
   await load();onRefresh();done?.();
  }catch(e:any){setStatus(e.message||'Update failed');}finally{setBusy(false);}
 }
 async function uploadLogo(file:File|undefined){
  if(!file)return;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)){setStatus('Use a PNG, JPG or WEBP image.');return;}
  if(file.size>140000){setStatus('Logo must be under 140 KB. Use a smaller image or HTTPS URL.');return;}
  const reader=new FileReader();
  reader.onload=()=>setSite((s:any)=>({...s,logoUrl:String(reader.result)}));
  reader.onerror=()=>setStatus('Could not read the logo.');
  reader.readAsDataURL(file);
 }
 return <div className="admin-management">
  <section className="panel settings-panel admin-controls" id="admin-branding">
   <div className="section-heading"><div><h2>Site branding and editable content</h2><p>Update the logo, site name, dashboard text, introduction and footer for everyone. You do not need to edit code.</p></div></div>
   <div className="admin-edit-grid">
    <label>Site name<input value={site.siteTitle||''} maxLength={80} onChange={e=>setSite({...site,siteTitle:e.target.value})}/></label>
    <label>Logo image URL or /file path<input value={site.logoUrl?.startsWith('data:')?'[uploaded image]':site.logoUrl||''} onChange={e=>setSite({...site,logoUrl:e.target.value})}/></label>
   </div>
   <label>Upload replacement logo (PNG/JPG/WEBP; max 140 KB)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void uploadLogo(e.target.files?.[0])}/></label>
   <div className="admin-logo-preview"><img src={site.logoUrl||'/logo.svg'} alt="Current site logo" style={{width:58,height:58,objectFit:'contain'}}/><strong>{site.siteTitle||'Vocab Station'}</strong></div>
   <div className="admin-edit-grid">
    {[
     ['tagline','Homepage eyebrow'],['heroTitle','Welcome headline'],['progressTitle','Learning progress heading'],
     ['dailyTitle','Daily vocabulary heading'],['practiceTitle','Practice section heading'],['mockTitle','Mock tests heading'],
     ['footer','Footer caption']
    ].map(([key,title])=><label key={key}>{title}<input maxLength={180} value={site[key]||''} onChange={e=>setSite({...site,[key]:e.target.value})}/></label>)}
   </div>
   <label>About Vocab Station<textarea rows={4} value={site.about||''} onChange={e=>setSite({...site,about:e.target.value})}/></label>
   <label>Learning-day checklist instructions<textarea rows={3} value={site.learningNotice||''} onChange={e=>setSite({...site,learningNotice:e.target.value})}/></label>
   <button className="primary" disabled={busy} onClick={()=>void action({action:'siteSettings',settings:site})}>Publish branding and content</button>
  </section>

  <section className="panel settings-panel admin-controls" id="admin-learners">
   <h2>Per-learner schedule, permissions and words</h2>
   <p>Access can be changed independently for Day 1–180. Allow Day 3 even if Day 1 is incomplete, or lock any day. Changes are retained on the learner account.</p>
   <label>Choose learner<select value={selected} onChange={e=>setSelected(e.target.value)}>
    <option value="">Select a learner</option>
    {users.map(u=><option key={u.id} value={u.id}>{u.name} · @{u.username} · {u.studentId}</option>)}
   </select></label>
   {learner&&<>
    <div className="admin-learner-summary">
     <p><strong>Name:</strong> {learner.name} · <strong>Username:</strong> @{learner.username}</p>
     <p><strong>Learner ID:</strong> {learner.studentId} · <strong>School:</strong> {learner.school||'Not provided'}</p>
     <p><strong>Target exam:</strong> {learner.exam||'Not provided'} · <strong>Start date:</strong> {learner.start||'Not provided'}</p>
     <p><strong>Plan:</strong> {learner.track} days · <strong>Mastered:</strong> {learner.mastered||0} · <strong>Review:</strong> {learner.review||0}</p>
     <p><strong>Active dates:</strong> {Object.keys(learner.activity||{}).length}</p>
    </div>
    <div className="admin-edit-grid">
     <label>Learning day<select value={day} onChange={e=>setDay(Number(e.target.value))}>{Array.from({length:learner.track},(_,i)=><option value={i+1} key={i+1}>Day {i+1} ({learner.adminDayAccess?.[i+1]||'normal'})</option>)}</select></label>
     <label>Access<select value={mode} onChange={e=>setMode(e.target.value)}><option value="allow">Unlock this day</option><option value="lock">Lock this day</option><option value="default">Use normal progression</option></select></label>
    </div>
    <div className="practice-controls">
     <button className="outline" disabled={busy} onClick={()=>void action({action:'dayAccess',day,mode})}>Save day access</button>
     <button className="outline" disabled={busy} onClick={()=>void action({action:'dayCompletion',day,complete:!(learner.adminCompletedDays||[]).includes(day)})}>{(learner.adminCompletedDays||[]).includes(day)?'Remove admin completion':'Mark day complete'}</button>
    </div>
    <small>Unlocked days: {Object.entries(learner.adminDayAccess||{}).filter(([,v])=>v==='allow').map(([k])=>k).join(', ')||'None'} · Locked days: {Object.entries(learner.adminDayAccess||{}).filter(([,v])=>v==='lock').map(([k])=>k).join(', ')||'None'}</small>
    <h3>Give, remove or move vocabulary for this learner</h3>
    <label>Search the complete vocabulary<input value={query} onChange={e=>{setQuery(e.target.value);setWordId('')}} placeholder="Type an English or Bengali word…"/></label>
    <div className="admin-edit-grid">
     <label>Word<select value={wordId} onChange={e=>setWordId(e.target.value)}><option value="">Choose a word</option>{candidates.map(w=><option key={wordKey(w)} value={wordKey(w)}>{w.word} — {w.bengali_meaning}</option>)}</select></label>
     <label>Assign to Day<select value={assignDay} onChange={e=>setAssignDay(Number(e.target.value))}><option value={0}>Reset default day</option>{Array.from({length:learner.track},(_,i)=><option key={i} value={i+1}>Day {i+1}</option>)}</select></label>
    </div>
    <div className="practice-controls">
     <button className="outline" disabled={!wordId||busy} onClick={()=>void action({action:'assignWordDay',wordId,day:assignDay})}>Save word's learning day</button>
     <button className="outline" disabled={!wordId||busy} onClick={()=>void action({action:'excludeWord',wordId,exclude:true})}>Remove word from this learner</button>
     <button className="outline" disabled={!wordId||busy} onClick={()=>void action({action:'excludeWord',wordId,exclude:false})}>Restore word</button>
    </div>
    <small>{Object.keys(learner.adminWordDays||{}).length} custom day assignments · {(learner.adminExcludedWords||[]).length} excluded words</small>
    <h3>Individual assessment decisions</h3>
    {(learner.attempts||[]).slice(-15).reverse().map(a=><div className="notice" key={a.id||String(a.week)+a.date}><span>{a.kind} Week {a.week} — {a.score}/{a.total} ({Math.round((a.score||0)/Math.max(1,a.total)*100)}%) · {a.adminOverride===true?'Admin pass':a.passed?'Passed':'Not passed'}</span><button className="outline" disabled={busy} onClick={()=>void action({action:'overrideAttempt',attemptId:a.id,approve:a.adminOverride!==true})}>{a.adminOverride===true?'Revoke override':'Approve pass'}</button></div>)}
    {!(learner.attempts||[]).length&&<p>No tests submitted yet. Use the existing control desk to assign a test or record a manual pass.</p>}
   </>}
  </section>

  <section className="panel settings-panel admin-controls" id="admin-tests">
   <h2>Weekly mock and revision policy</h2>
   <p>Control scored question quantity, duration, pass threshold, writing tasks, availability, answer visibility and title. Every learner's new test uses the saved settings.</p>
   <div className="admin-edit-grid">
    <label>Week<input type="number" min={1} max={26} value={week} onChange={e=>setWeek(Math.max(1,Math.min(26,Number(e.target.value)||1)))}/></label>
    <label>Title<input maxLength={160} value={test.title||''} onChange={e=>setTest({...test,title:e.target.value})}/></label>
    <label>Scored objective questions<input type="number" min={5} max={60} value={test.questionCount} onChange={e=>setTest({...test,questionCount:Number(e.target.value)})}/></label>
    <label>Time (seconds)<input type="number" min={60} max={7200} value={test.timeSeconds} onChange={e=>setTest({...test,timeSeconds:Number(e.target.value)})}/></label>
    <label>Pass percentage<input type="number" min={1} max={100} value={test.passPercent} onChange={e=>setTest({...test,passPercent:Number(e.target.value)})}/></label>
    <label>Writing questions<input type="number" min={0} max={2} value={test.writingCount} onChange={e=>setTest({...test,writingCount:Number(e.target.value)})}/></label>
   </div>
   <div className="practice-controls">
    <label><input type="checkbox" checked={test.enabled!==false} onChange={e=>setTest({...test,enabled:e.target.checked})}/> Test enabled</label>
    <label><input type="checkbox" checked={test.showAnswers!==false} onChange={e=>setTest({...test,showAnswers:e.target.checked})}/> Show correct answers to learners</label>
   </div>
   <button className="primary" disabled={busy} onClick={()=>void action({action:'testConfig',week,...test})}>Save test settings</button>
   <p className="muted">Use Admin Vocabulary → question editor to replace questions and specify their question type and whether answers are mandatory.</p>
  </section>

  <section className="panel settings-panel admin-controls" id="admin-word-requests">
   <h2>Personal vocabulary requests</h2><p>Learner-submitted vocabulary is reviewed here before it is added to their private collection.</p>
   {(requests.filter(r=>r.status==='pending')).slice().reverse().map(r=><article className="notice" key={r.id}>
    <h3>{r.word?.word} · {r.word?.bengali_meaning}</h3>
    <p>Learner: {users.find(u=>u.id===r.userId)?.name||r.userId} · {r.word?.english_meaning}</p>
    <p>{r.word?.simple_example}</p>
    <div className="practice-controls">
     <button disabled={busy} className="primary" onClick={()=>void action({action:'approveWordRequest',id:r.id})}>Approve and add word</button>
     <button disabled={busy} className="outline" onClick={()=>void action({action:'rejectWordRequest',id:r.id})}>Reject request</button>
    </div>
   </article>)}
   {!requests.some(r=>r.status==='pending')&&<p>No pending word requests.</p>}
  </section>
  <p role="status" aria-live="polite">{status}</p>
 </div>;
}
