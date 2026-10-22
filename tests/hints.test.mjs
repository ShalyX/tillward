import test from 'node:test';
import assert from 'node:assert/strict';
import {projectedNicr} from '../src/native-hints.mjs';
test('native list ratio excludes interest; repayments consume interest first',()=>{
 const unit=10n**18n;
 assert.equal(projectedNicr(unit,2200n*unit,2n*unit,'repay',100n*unit),unit*10n**20n/(2102n*unit));
 assert.equal(projectedNicr(unit,2200n*unit,2n*unit,'repay',1n*unit),unit*10n**20n/(2200n*unit));
});
