import { encodePaise } from '@/contracts/money';
import type { SurfaceData } from '@/contracts/surfaces';
import { boundedLevel } from './home-presentation';
/** Chart coordinates only; canonical totals remain supplied by the server. */
export function burnGeometry(points:SurfaceData['chart']['burn']){
 const max=points.reduce((m,p)=>[BigInt(p.actual),BigInt(p.pace),m].reduce((a,b)=>a>b?a:b),1n);
 const width=560,height=200;
 const line=(field:'actual'|'pace')=>points.map((p,i)=>`${points.length<2?0:i*width/(points.length-1)},${height-boundedLevel(p[field],encodePaise(max))*height/100}`).join(' ');
 return {actual:line('actual'),pace:line('pace'),maximum:encodePaise(max)};
}
