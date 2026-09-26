import {onRequest as presentation} from './api/distribution/presentation.js';
export const onRequest=context=>{const url=new URL(context.request.url);url.searchParams.set('presentation','paid_agency');return presentation({...context,request:new Request(url,context.request)});};
