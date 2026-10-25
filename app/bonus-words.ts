import type {Word} from './words';
// Original Vocab Station teaching material; spelling is checked against the source collection.
const rows=[
['meticulous','adjective','Very careful and attentive to detail.','অত্যন্ত যত্নশীল; খুঁটিনাটিতে সতর্ক','The researcher kept meticulous records of every experiment.','গবেষক প্রতিটি পরীক্ষার অত্যন্ত যত্নশীল নথি রেখেছেন।','/məˈtɪkjələs/'],
['pragmatic','adjective','Dealing with problems in a practical way.','বাস্তবসম্মত','The council adopted a pragmatic approach to reducing traffic.','যানজট কমাতে পরিষদ একটি বাস্তবসম্মত পদ্ধতি গ্রহণ করেছে।','/præɡˈmætɪk/'],
['ubiquitous','adjective','Present or found everywhere.','সর্বত্র বিদ্যমান','Mobile phones are ubiquitous in modern society.','আধুনিক সমাজে মোবাইল ফোন সর্বত্র বিদ্যমান।','/juːˈbɪkwɪtəs/'],
['alleviate','verb','To make pain or a problem less severe.','লাঘব করা','Affordable housing can alleviate pressure on low-income families.','সাশ্রয়ী আবাসন নিম্ন আয়ের পরিবারের ওপর চাপ লাঘব করতে পারে।','/əˈliːvieɪt/'],
['bolster','verb','To support or strengthen something.','শক্তিশালী করা; সমর্থন জোগানো','The new evidence will bolster the argument for cleaner transport.','নতুন প্রমাণ পরিবেশবান্ধব পরিবহনের পক্ষে যুক্তি শক্তিশালী করবে।','/ˈbəʊlstə/'],
['detrimental','adjective','Causing harm or damage.','ক্ষতিকর','Air pollution has a detrimental effect on public health.','বায়ুদূষণ জনস্বাস্থ্যের ওপর ক্ষতিকর প্রভাব ফেলে।','/ˌdetrɪˈmentəl/'],
['equitable','adjective','Fair and impartial.','ন্যায্য','An equitable education system gives every child a fair chance.','একটি ন্যায্য শিক্ষাব্যবস্থা প্রতিটি শিশুকে সমান সুযোগ দেয়।','/ˈekwɪtəbl/'],
['scarcity','noun','A situation in which there is not enough of something.','অপ্রতুলতা; সংকট','Water scarcity affects agriculture in many regions.','পানির অপ্রতুলতা অনেক অঞ্চলের কৃষিকে প্রভাবিত করে।','/ˈskeəsəti/'],
['viable','adjective','Able to work successfully in practice.','বাস্তবে কার্যকর; বাস্তবায়নযোগ্য','Solar power is a viable option for remote villages.','দূরবর্তী গ্রামের জন্য সৌরশক্তি একটি বাস্তবায়নযোগ্য বিকল্প।','/ˈvaɪəbl/'],
['nuanced','adjective','Showing awareness of small but important differences.','সূক্ষ্ম পার্থক্য বিবেচনাকারী','The report offers a nuanced view of urban development.','প্রতিবেদনটি নগর উন্নয়নের সূক্ষ্ম পার্থক্য বিবেচনাকারী একটি দৃষ্টিভঙ্গি তুলে ধরে।','/ˈnjuːɑːnst/'],
['corroborate','verb','To support a statement with further evidence.','অতিরিক্ত প্রমাণ দিয়ে সমর্থন করা','Independent studies corroborate the findings of the research.','স্বাধীন গবেষণাগুলো অতিরিক্ত প্রমাণ দিয়ে গবেষণাটির ফলাফল সমর্থন করে।','/kəˈrɒbəreɪt/'],
['synthesise','verb','To combine different ideas into a connected whole.','বিভিন্ন ধারণা সমন্বয় করা','Students learn to synthesise information from several sources.','শিক্ষার্থীরা বিভিন্ন উৎসের তথ্য সমন্বয় করতে শেখে।','/ˈsɪnθəsaɪz/'],
['sustainable','adjective','Able to continue without exhausting resources or harming the environment.','টেকসই','We need sustainable solutions to water shortages.','পানির সংকট মোকাবিলায় আমাদের টেকসই সমাধান প্রয়োজন।','/səˈsteɪnəbl/'],
['resilient','adjective','Able to recover after difficulties.','ঘুরে দাঁড়াতে সক্ষম','Communities must become more resilient to storms.','জনগোষ্ঠীগুলোকে ঝড়ের পর আরও ভালোভাবে ঘুরে দাঁড়াতে সক্ষম হতে হবে।','/rɪˈzɪliənt/'],
['abundant','adjective','Existing in large quantities.','প্রচুর','The region has abundant natural resources.','অঞ্চলটিতে প্রচুর প্রাকৃতিক সম্পদ রয়েছে।','/əˈbʌndənt/']
];
export const bonusWords:Word[]=rows.map(([word,part_of_speech,english_meaning,bengali_meaning,simple_example,bengali_example,phonetic_transcription])=>({id:'vs-'+word,word,label:word,part_of_speech,english_meaning,bengali_meaning,simple_example,bengali_example,phonetic_transcription,source:'Vocab Station additional vocabulary',example_source:'Vocab Station teaching example'}));
