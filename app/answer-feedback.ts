import {correctAnswer} from './assessment';
import {checkOwnSentence} from './sentence-check';
export function editDistance(a:string,b:string){const row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let previous=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const old=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,previous+(a[i-1]===b[j-1]?0:1));previous=old;}}return row[b.length];}
export function answerFeedback(q:any,chosen:string){
 if(q.writing){const writingFeedback=checkOwnSentence(chosen,q.w);return {...q,chosen,correct:null,scored:false,writingFeedback,reference:q.answer||null,feedback:chosen.trim()?(writingFeedback.passed?'Basic checks passed. Grammar and meaning have not been verified.':'Review the writing checks below. Grammar and meaning have not been verified.'):'No sentence was submitted.'};}
 const correct=correctAnswer(q,chosen);let feedback=correct?'Correct.':!chosen.trim()?'No answer was submitted.':`The correct answer is “${q.answer}”.`;
 let spellingSuggestion:string|undefined;
 if(!correct&&q.typed&&chosen.trim()){const target=String(q.answer).toLowerCase(),input=chosen.trim().toLowerCase();const distance=editDistance(input,target);if(distance>0&&distance<=Math.max(1,Math.min(2,Math.floor(target.length/3)))){spellingSuggestion=q.answer;feedback=`Possible spelling error: you wrote “${chosen}”; the expected spelling is “${q.answer}”.`;}else feedback=`This is not the expected vocabulary answer. The correct answer is “${q.answer}”.`;}
 return {...q,chosen,correct,scored:true,feedback,spellingSuggestion};
}
