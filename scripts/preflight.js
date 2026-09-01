const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const required = [
  'server.js','package.json','vite.config.js','middleware/authMiddleware.js',
  'controllers/authController.js','routes/fraudShieldAIRoutes.js',
  'services/fraudShieldAIService.js','AI_BACKEND/main.py',
  'AI_BACKEND/data/scam_messages.json','AI_BACKEND/data/fraud_intelligence.json',
  'src/components/ContextFusionMonitor.jsx','src/PaymentSimulator.jsx'
];
for (const f of required) if (!fs.existsSync(path.join(root,f))) throw new Error(`Missing required file: ${f}`);
const scam = JSON.parse(fs.readFileSync(path.join(root,'AI_BACKEND/data/scam_messages.json'),'utf8'));
const intel = JSON.parse(fs.readFileSync(path.join(root,'AI_BACKEND/data/fraud_intelligence.json'),'utf8'));
if (scam.length < 1000 || scam.length > 1500) throw new Error(`Expected 1000-1500 scam messages, found ${scam.length}`);
if (intel.length < 1000 || intel.length > 1500) throw new Error(`Expected 1000-1500 intelligence records, found ${intel.length}`);
if (scam.filter(x=>x.language==='hinglish').length < 300) throw new Error('Hinglish corpus unexpectedly small');
if (!scam.every(x=>x.synthetic === true)) throw new Error('Scam corpus contains unmarked non-synthetic data');
if (!intel.every(x=>x.synthetic === true)) throw new Error('Intelligence corpus contains unmarked non-synthetic data');
const forbidden = /(AIza[0-9A-Za-z_-]{20,}|sk-[0-9A-Za-z]{20,}|hf_[A-Za-z0-9]{20,})/g;
const sourceFiles = ['server.js','controllers','middleware','routes','services','src','AI_BACKEND/main.py'];
function walk(p){ if(!fs.existsSync(p)) return []; const st=fs.statSync(p); if(st.isDirectory()) return fs.readdirSync(p).flatMap(n=>walk(path.join(p,n))); return [p]; }
const hits=[];
for(const item of sourceFiles.flatMap(x=>walk(path.join(root,x)))){
  if(item.endsWith('.pyc') || item.includes('node_modules')) continue;
  const txt=fs.readFileSync(item,'utf8');
  if(forbidden.test(txt)) hits.push(path.relative(root,item)); forbidden.lastIndex=0;
}
if(hits.length) throw new Error(`Possible hard-coded secret found in: ${hits.join(', ')}`);
console.log(`Preflight OK: ${scam.length} scam messages, ${intel.length} intelligence records, JWT middleware, staged payment pipeline and secret scan passed.`);
