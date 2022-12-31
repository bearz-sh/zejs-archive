import { call } from './std/process/mod.ts';

call('ls',  { stdout: 'inherit', stderr: 'inherit' });