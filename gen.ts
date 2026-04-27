import * as fs from 'fs';

const prefixes = ['free', 'online', 'best', 'fast', 'secure', 'quick', 'easy', 'high quality', 'pro', 'simple'];
const actions = ['compress', 'resize', 'convert', 'crop', 'extract text from', 'read text from', 'make pdf from', 'reduce size of', 'optimize'];
const nouns = ['image', 'photo', 'picture', 'jpg', 'jpeg', 'png', 'webp', 'screenshot', 'file'];
const suffixes = ['without losing quality', 'in kb', 'to 50kb', 'to 100kb', 'for website', 'for instagram', 'for whatsapp', 'on mobile', 'tool', 'app', 'online free', 'safely'];
const tools = [
  'image resizer', 'photo compressor', 'image to text', 'photo to text', 'ocr online', 'image to pdf', 'jpg to pdf', 'png to pdf', 'photo crop tool', 'picture cropper', 'pic resizer'
];

let keywords = new Set<string>();

// Pass 1
for (let p of prefixes) {
  for (let t of tools) {
    keywords.add(`${p} ${t}`);
    for (let s of suffixes) {
      keywords.add(`${p} ${t} ${s}`);
      keywords.add(`${t} ${s}`);
    }
  }
}

// Pass 2
for (let a of actions) {
  for (let n of nouns) {
    keywords.add(`${a} ${n}`);
    for (let s of suffixes) {
      keywords.add(`${a} ${n} ${s}`);
    }
  }
}

// Pass 3
for (let p of prefixes) {
  for (let a of actions) {
    for (let n of nouns) {
      keywords.add(`${p} ${a} ${n}`);
      keywords.add(`${a} ${n} ${p}`);
    }
  }
}

let kwArray = Array.from(keywords).slice(0, 1500);

fs.writeFileSync('public/keywords.txt', kwArray.join('\n'));
fs.writeFileSync('keywords.txt', kwArray.join('\n'));
console.log(`Generated ${kwArray.length} keywords`);
