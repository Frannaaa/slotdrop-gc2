// Read-only high-confidence secret signature scan in reachable Git history.
// This supplements, but cannot replace, GitHub secret scanning or a private security review.
// Never output token values, blob contents or credential-bearing URLs.
import { execFileSync } from 'node:child_process';

function git(...args) {
  return execFileSync('git',args,{encoding:'utf8',maxBuffer:30*1024*1024}).trim();
}
if (git('rev-parse','--is-shallow-repository') === 'true') {
  throw new Error('Fetch full reachable Git history before running this check.');
}
const pathRows=git('rev-list','--objects','--all').split('\n')
  .map(line=>line.match(/^([a-f0-9]{40,64})\s+(.+)$/))
  .filter(Boolean)
  .map(match=>({oid:match[1],path:match[2]}));
const textPath = path => /\.(?:js|mjs|cjs|ts|tsx|json|md|html?|css|sql|ya?ml|txt|sh|toml|xml|conf|ini)$/i.test(path)
  || /(^|\/)(?:\.gitignore|\.env\.example|Dockerfile|Makefile)$/.test(path);
const signatures = [
  ['private-key-header',/-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ['github-token',/(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})/],
  ['aws-access-key',/\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
  ['openai-secret-key',/\bsk-(?:proj-)?[A-Za-z0-9_-]{36,}\b/],
  ['slack-token',/\bxox[baprs]-[0-9A-Za-z-]{30,}\b/],
];
let scanned=0, skippedLarge=0;
const violations=[];
const processed=new Set();
for(const {oid,path} of pathRows){
  if(!textPath(path)||processed.has(oid))continue;
  if(git('cat-file','-t',oid)!=='blob')continue;
  const size=Number(git('cat-file','-s',oid));
  if(!Number.isFinite(size)||size>750_000){skippedLarge++;continue;}
  const content=git('cat-file','-p',oid);
  processed.add(oid);
  scanned++;
  for(const [kind,re] of signatures){
    if(re.test(content))violations.push({path,kind});
  }
}
if(violations.length){
  console.error('High-confidence patterns in historical source. File names and categories only; inspect privately:');
  for(const v of violations)console.error('  '+v.path+' ['+v.kind+']');
  process.exitCode=1;
}else{
  console.log('PASS: '+scanned+' distinct reachable text blobs have no common high-confidence private-key, GitHub, AWS, OpenAI or Slack secret signatures ('+skippedLarge+' oversized source blobs skipped). This is not a guarantee that arbitrary secrets are absent.');
}
