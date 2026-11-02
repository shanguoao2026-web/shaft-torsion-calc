#!/usr/bin/env node
import { runCli } from './command.js';

try { process.stdout.write(runCli(process.argv.slice(2))); }
catch (error) {
  process.stderr.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
