const files = [
  { name: 'a.jpg', size: 1024, lastModified: 123456 },
  { name: 'a.jpg', size: 1024, lastModified: 123456 },
  { name: 'b.jpg', size: 2048, lastModified: 654321 },
];

const unique = new Map();
for (const f of files) {
  if (!f || typeof f.size !== 'number') continue;
  const key = `${f.name}|${f.size}|${f.lastModified || 0}`;
  if (!unique.has(key)) unique.set(key, f);
}

console.log('files', files.length, '-> unique', unique.size);
console.log('unique keys:', Array.from(unique.keys()));
