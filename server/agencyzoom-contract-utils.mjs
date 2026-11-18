// Shared validation without transport or runtime activation dependencies.
export function reject(code){throw Object.assign(new Error(code),{code});}
export function externalId(v){if(typeof v!=='string'||!v.trim()||v.length>100||!/^[A-Za-z0-9_.:-]+$/.test(v))reject('malformed_id');return v;}
