import examples from './practice-examples.json';
import original from './campus-vocabulary.json';
import type {Word} from './words';
type Example={sentence:string;definition:string;source:string;forms:string[];bengali_meaning?:string};
const source=examples as Record<string,Example>;
const originalMeaning=new Map(original.map(w=>[w.id,w.meaning]));
export function enrichExample(word:Word):Word{const entry=word.id?source[word.id]:undefined;if(!entry)return word;const correction=entry.bengali_meaning&&word.bengali_meaning===originalMeaning.get(word.id!);return{...word,english_meaning:word.english_meaning||entry.definition,bengali_meaning:correction?entry.bengali_meaning!:word.bengali_meaning,simple_example:word.simple_example||entry.sentence,example_source:word.simple_example?word.example_source:entry.source};}
