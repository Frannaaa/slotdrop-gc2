// Fran/M1: read-only audit of tracked Git paths across *reachable history*.
// This checks suspicious filenames, NOT whether benign source text contains a secret.
// Run on a complete checkout. Never print any file contents or credentials.
import { execFileSync } from 'node:child_process';

function git(...args) {
  return execFileSync('git',args,{encoding:'utf8',maxBuffer:30*1024*1024}).trim();
}
if (git('rev-parse','--is-shallow-repository') === 'true') {
  throw new Error('Full history is required: fetch all refs before running Git hygiene audit.');
}
const paths=new Set(git('rev-list','--objects','--all')
  .split('\n')
  .map(line=>line.match(/^[a-f0-9]{40,64}\s+(.+)$/)?.[1])
  .filter(Boolean));
const problems=[...paths].filter(path=>{
  const normalized=path.replaceAll('\\','/');
  if(normalized==='.env.example'||normalized.endsWith('/.env.example'))return false;
  return /(^|\/)(node_modules|\.local-data|\.git|\.env(?:\.[^/]*)?|\.release-state\.json)(\/|$)/i.test(normalized)
    || /(^|\/)(?:id_rsa|id_ed25519|service-account(?:-key)?\.json|credentials\.json|secret(?:s)?\.json)$/i.test(normalized)
    || /\.(pem|p12|pfx)$/i.test(normalized);
});
if(problems.length){
  console.error('CHECK FAILED: suspicious committed paths (filenames only):');
  for(const path of problems) console.error('  '+path);
  console.error('Inspect privately for credential exposure; never reveal secret file contents in CI.');
  process.exitCode=1;
} else {
  console.log('PASS: '+paths.size+' distinct reachable historical object paths have no common committed .env, node_modules, local DB, private-key or credential file *names*. This cannot prove that all text contents are secret-free.');
}
