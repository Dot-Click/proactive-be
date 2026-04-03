const { spawn } = require('child_process');

const push = spawn('npx', ['drizzle-kit', 'push', '--force'], {
  cwd: 'c:\\Users\\flutter\\Desktop\\frontend\\proactive\\proactive-be',
  shell: true
});

const timer = setInterval(() => {
  console.log('Sending CRLF to stdin...');
  push.stdin.write('\r\n');
}, 5000);

push.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('STDOUT:', output);
});

push.stderr.on('data', (data) => {
  console.error('STDERR:', data.toString());
});

push.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
  clearInterval(timer);
  process.exit(code || 0);
});
