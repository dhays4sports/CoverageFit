window.capture.onImage(data=>document.querySelector('#screen').src=data);let start=null,rect=null;
document.addEventListener('pointerdown',e=>{start={x:e.clientX,y:e.clientY};});
document.addEventListener('pointermove',e=>{if(!start)return;rect={x:Math.min(start.x,e.clientX),y:Math.min(start.y,e.clientY),width:Math.abs(start.x-e.clientX),height:Math.abs(start.y-e.clientY)};const s=document.querySelector('#selection');s.style.display='block';Object.assign(s.style,{left:rect.x+'px',top:rect.y+'px',width:rect.width+'px',height:rect.height+'px'});});
document.addEventListener('pointerup',()=>{if(rect&&rect.width>2&&rect.height>2)window.capture.finish(rect);start=null;});document.addEventListener('keydown',e=>{if(e.key==='Escape')window.capture.finish(null);});
