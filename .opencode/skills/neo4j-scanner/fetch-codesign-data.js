// Fetch CoDesign prototype data for "基础数据" sharing
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SHARING_ID = '686059816013115';
const PASSWORD = 'SRSZ';
const SAVE_DIR = path.resolve(__dirname, '..', 'codesign_data');
fs.mkdirSync(SAVE_DIR, { recursive: true });

// Step 1: Get state key
function getStateKey() {
  const out = execSync(`curl.exe -s -X POST -d "password=${PASSWORD}" "https://codesign.qq.com/api/sharings/${SHARING_ID}/state-keys"`, { encoding: 'utf8' });
  const data = JSON.parse(out);
  if (!data.key) throw new Error('Failed to get state key: ' + JSON.stringify(data));
  console.log('State key:', data.key);
  return data.key;
}

// Step 2: Get sharing data using state key
function getSharingData(key) {
  // Try with the key as cookie
  const out = execSync(`curl.exe -s -b "coDesignStateKey=${key}" "https://codesign.qq.com/api/sharings/${SHARING_ID}"`, { encoding: 'utf8' });
  return JSON.parse(out);
}

async function main() {
  const key = getStateKey();
  
  // Try different auth methods
  const methods = [
    { name: 'cookie stateKey', cmd: `curl.exe -s -b "coDesignStateKey=${key}"` },
    { name: 'query string', cmd: `curl.exe -s "https://codesign.qq.com/api/sharings/${SHARING_ID}?state-key=${key}"` },
    { name: 'header X-State-Key', cmd: `curl.exe -s -H "X-State-Key: ${key}"` },
    { name: 'Referer header', cmd: `curl.exe -s -H "Referer: https://codesign.qq.com/s/${SHARING_ID}"` },
  ];

  for (const method of methods) {
    const url = method.name.includes('query') ? '' : `"https://codesign.qq.com/api/sharings/${SHARING_ID}"`;
    const cmd = method.name.includes('Referer') ? `${method.cmd} ${url}` : method.name.includes('query') ? method.cmd : `${method.cmd} ${url}`;
    try {
      const out = execSync(cmd.replace('"https', `"https`), { encoding: 'utf8', timeout: 10000 });
      const data = JSON.parse(out);
      if (data.status === 1 || data.id) {
        console.log(`✅ ${method.name}: SUCCESS`);
        // Save the data
        const savePath = path.join(SAVE_DIR, 'sharing-data.json');
        fs.writeFileSync(savePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Saved to: ${savePath}`);
        console.log(`Sharing title: ${data.title}`);
        console.log(`Prototypes count: ${data.prototypes?.length || 0}`);
        
        // Extract page info
        if (data.prototypes && data.prototypes.length > 0) {
          const proto = data.prototypes[0];
          console.log(`Prototype name: ${proto.name}`);
          console.log(`Pages count: ${proto.pages_count}`);
          
          // Save pages dict
          const pagesPath = path.join(SAVE_DIR, 'pages.json');
          fs.writeFileSync(pagesPath, JSON.stringify(proto.pages, null, 2), 'utf8');
          console.log(`Pages dict saved with ${Object.keys(proto.pages || {}).length} entries`);
          
          // Save tree
          const treePath = path.join(SAVE_DIR, 'tree.json');
          fs.writeFileSync(treePath, JSON.stringify(proto.tree, null, 2), 'utf8');
          console.log(`Tree saved`);
        }
        return data;
      }
    } catch (e) {
      console.log(`❌ ${method.name}: ${e.message.substring(0, 100)}`);
    }
  }
  console.log('All methods failed');
}

main().catch(console.error);
