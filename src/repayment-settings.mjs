// A share-only form must never reset an existing reserve or allocation pause.
export function sharePolicyUpdate(current,bps){
 const max=current.fees?9900:10000;
 if(!Number.isInteger(bps)||bps<0||bps>max)throw Error(`Choose a repayment share from 0% to ${max/100}%.`);
 if(typeof current.floor!=='bigint'||current.floor<0n||typeof current.paused!=='boolean')throw Error('Refresh the current repayment settings before saving.');
 return [bps,current.floor,current.paused];
}
