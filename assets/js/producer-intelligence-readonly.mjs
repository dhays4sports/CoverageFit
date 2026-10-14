// Presence of the governed read contract forbids mounting legacy mutation panels,
// including when the store is unavailable or a malformed/null decision is returned.
export const allowsProducerMutationPanels=detail=>!Object.hasOwn(detail||{},'current_decision');
export function producerPageContinuation(result){
 return result.total_scope==='PAGE_ONLY'?{after:result.next_cursor||null,offset:null}:{after:null,offset:result.nextOffset??null};
}
