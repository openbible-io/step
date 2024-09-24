import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (!existsSync('tmp')) {
	console.log('checking out tmp');
	execSync(`mkdir -p tmp && git --work-tree=./tmp checkout upstream -- .`, { stdio: 'inherit' });
}

execSync(`node src/main.js ./tmp/Translators\\ Amalgamated\\ OT+NT/*.txt`, { stdio: 'inherit' });
