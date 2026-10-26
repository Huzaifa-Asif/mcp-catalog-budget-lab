#!/usr/bin/env node
import { open } from 'node:fs/promises';
import { LIMITS, parseAndAnalyze } from './src/core.mjs';
const args = process.argv.slice(2);
if (args.length !== 1 || args[0].startsWith('-')) { console.error('Usage: node cli.mjs <catalog.json>'); process.exitCode = 2; }
else try { const file=await open(args[0],'r'); let source; try { const buffer=Buffer.alloc(LIMITS.maxBytes+1); const {bytesRead}=await file.read(buffer,0,buffer.length,0); if(bytesRead>LIMITS.maxBytes) throw new Error(`Input exceeds ${LIMITS.maxBytes} UTF-8 bytes.`); source=buffer.subarray(0,bytesRead).toString('utf8'); } finally { await file.close(); } const report = parseAndAnalyze(source); console.log(JSON.stringify(report, null, 2)); process.exitCode = report.summary.errorFindings ? 1 : 0; } catch (error) { console.error(`Catalog analysis failed: ${String(error.message).replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ')}`); process.exitCode = 2; }
