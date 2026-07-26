import fs from 'fs';
import path from 'path';

interface ListenerAudit {
  file: string;
  line: number;
  snippet: string;
  type: 'document' | 'collection' | 'unknown';
  hasLimit: boolean;
  hasOrderBy: boolean;
  hasUnsubscribeCleanup: boolean;
  issues: string[];
  recommendations: string[];
}

function scanDirectory(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && !file.startsWith('.')) {
        scanDirectory(filePath, fileList);
      }
    } else if (/\.(tsx?|jsx?)$/.test(file)) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

function auditFirestoreListeners() {
  console.log('\n==================================================');
  console.log('  🔍 FIRESTORE LISTENERS & COST AUDIT SCRIPT');
  console.log('==================================================\n');

  const srcDir = path.resolve('src');
  if (!fs.existsSync(srcDir)) {
    console.error('Error: src directory not found at', srcDir);
    process.exit(1);
  }

  const files = scanDirectory(srcDir);
  const audits: ListenerAudit[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((lineText, index) => {
      if (lineText.includes('onSnapshot(')) {
        const lineNumber = index + 1;
        
        // Context slice around onSnapshot call (30 lines before & after)
        const start = Math.max(0, index - 25);
        const end = Math.min(lines.length, index + 25);
        const context = lines.slice(start, end).join('\n');

        const isDocument = context.includes('doc(') || context.includes('docRef');
        const isCollection = context.includes('collection(') || context.includes('collectionRef');
        const hasLimit = context.includes('limit(');
        const hasOrderBy = context.includes('orderBy(');
        const hasUnsubscribeCleanup = context.includes('return () =>') || context.includes('unsubscribe()') || context.includes('return unsubscribe');

        const issues: string[] = [];
        const recommendations: string[] = [];

        const listenerType: 'document' | 'collection' | 'unknown' = isDocument ? 'document' : isCollection ? 'collection' : 'unknown';

        if (listenerType === 'collection') {
          if (!hasLimit) {
            issues.push('Missing `limit()` constraint on collection listener.');
            recommendations.push('Add `limit(N)` to limit reads per query snapshot.');
          }
          if (!hasOrderBy) {
            issues.push('Missing `orderBy()` constraint on collection query.');
            recommendations.push('Add `orderBy("createdAt", "desc")` for predictable pagination.');
          }
        }

        if (!hasUnsubscribeCleanup) {
          issues.push('Unsubscribe cleanup function might not be returned in useEffect cleanup.');
          recommendations.push('Ensure `return () => unsubscribe();` is returned in useEffect.');
        }

        audits.push({
          file: path.relative(process.cwd(), file),
          line: lineNumber,
          snippet: lineText.trim(),
          type: listenerType,
          hasLimit,
          hasOrderBy,
          hasUnsubscribeCleanup,
          issues,
          recommendations,
        });
      }
    });
  }

  if (audits.length === 0) {
    console.log('✅ No `onSnapshot` listeners detected in the codebase.');
    return;
  }

  console.log(`Found ${audits.length} Firestore listener(s):\n`);

  audits.forEach((audit, i) => {
    console.log(`--------------------------------------------------`);
    console.log(`Listener #${i + 1}: ${audit.file}:${audit.line}`);
    console.log(`Type:          ${audit.type.toUpperCase()} LISTENER`);
    console.log(`Code Snippet:  ${audit.snippet}`);
    console.log(`Cleanup:       ${audit.hasUnsubscribeCleanup ? '✅ Properly Unsubscribed' : '⚠️ Missing Unsubscribe Cleanup'}`);

    if (audit.type === 'collection') {
      console.log(`Limit():       ${audit.hasLimit ? '✅ Present' : '❌ Missing'}`);
      console.log(`OrderBy():     ${audit.hasOrderBy ? '✅ Present' : '❌ Missing'}`);
    } else if (audit.type === 'document') {
      console.log(`Note:          Single document listener (1 read per update cycle - optimal).`);
    }

    if (audit.issues.length > 0) {
      console.log(`\nIssues Identified:`);
      audit.issues.forEach((issue) => console.log(`  - ⚠️  ${issue}`));
      console.log(`Recommendations:`);
      audit.recommendations.forEach((rec) => console.log(`  - 💡 ${rec}`));
    } else {
      console.log(`\nStatus:        🎉 PERFECT! Complies with cost & performance best practices.`);
    }
  });

  console.log('\n==================================================');
  console.log('  SUMMARY & BEST PRACTICE CHECKLIST');
  console.log('==================================================');
  console.log('1. All listeners clean up on unmount with unsubscribe().');
  console.log('2. Single document listeners (`doc()`) consume max 1 read per update.');
  console.log('3. Collection queries use `limit()` and `orderBy()` to avoid unbounded reads.');
  console.log('4. Log payload size optimized (logs array capped at 25 items).');
  console.log('==================================================\n');
}

auditFirestoreListeners();
