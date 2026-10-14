import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../public/dashboard.js',import.meta.url),'utf8');
const functions=source.slice(source.indexOf('function localTime'),source.indexOf('function setMetric'));
const sandbox={Date,Number,Intl,Set,DAY:86400000};
vm.createContext(sandbox);vm.runInContext(functions,sandbox);
const {localTime,rangeOf,soldIn,calc,delta,buckets}=sandbox;
const results=[];
function test(name,fn){fn();results.push({name,result:'passed'})}
const sold=(price,cost=0,fees=0,shipping=0,date='2026-10-14')=>({articleStatus:'Verkauft',cost,sale:{price,fees,shipping,date}});
test('Leerzustand liefert ausschließlich Nullwerte',()=>assert.deepEqual(JSON.parse(JSON.stringify(calc([]))),{rev:0,cnt:0,pro:0,avg:0}));
test('Umsatz, Gewinn, Gebühren, Versand und Durchschnitt aus vorhandenen Datensätzen',()=>{
 const m=calc([sold(80,30,7,4),sold(40,20,3,0)]);
 assert.equal(m.rev,120);assert.equal(m.cnt,2);assert.equal(m.pro,56);assert.equal(m.avg,60);
});
test('Datum-only entspricht lokalem Mitternacht statt UTC',()=>assert.equal(localTime('2026-10-14'),new Date(2026,9,14).getTime()));
test('Fehlendes Verkaufsdatum zählt nur im Zeitraum Alle',()=>{
 const item=sold(20,5,0,0,'');assert.equal(soldIn([item],0,Infinity,false).length,0);assert.equal(soldIn([item],-Infinity,Infinity,true).length,1);
});
test('7 und 30 Tage beginnen am lokalen Tagesanfang und überschneiden Vorperiode nicht',()=>{
 for(const p of ['7','30']){const r=rangeOf(p);const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-(+p-1));assert.equal(r.from,d.getTime());assert.equal(r.pt,r.from);assert.ok(r.pf<r.pt);}
});
test('Zeitraumgrenzen schließen Vorperiode und zukünftige Verkäufe korrekt aus',()=>{
 const r=rangeOf('7');const before=sold(10,0,0,0,new Date(r.from-1).toISOString());const inside=sold(10,0,0,0,new Date(r.from).toISOString());const future=sold(10,0,0,0,new Date(r.to+1000).toISOString());assert.equal(soldIn([before,inside,future],r.from,r.to,false).length,1);
});
test('Kein Prozenttrend bei Null- oder fehlendem Vergleich; echte Änderung berechnet',()=>{assert.equal(delta(20,0),null);assert.equal(delta(20,null),null);assert.equal(delta(120,100),20);assert.equal(delta(50,100),-50)});
test('Ein Verkauf erzeugt keine vorgetäuschte Trendlinie',()=>assert.equal(buckets([sold(50)],rangeOf('all'),10),null));
test('Zwei Verkäufe am identischen Datum erzeugen keinen zeitlichen Trend',()=>assert.equal(buckets([sold(50),sold(70)],rangeOf('all'),10),null));
test('Realer Verlauf bewahrt Umsatz und Gewinn in Zeit-Buckets',()=>{
 const r=rangeOf('30');const list=[sold(50,20,2,3,new Date(r.from+1000).toISOString()),sold(70,30,4,0,new Date(r.from+86400000).toISOString())];const b=buckets(list,r,10);assert.ok(b);assert.equal(b.reduce((n,x)=>n+x.rev,0),120);assert.equal(b.reduce((n,x)=>n+x.pro,0),61);
});
const output={scope:'Tatsächliche Dashboard-Berechnungsfunktionen aus public/dashboard.js. Kein Browsernachweis.',passed:results.length,failed:0,tests:results};
fs.writeFileSync(new URL('./dashboard-results.json',import.meta.url),JSON.stringify(output,null,2));
console.log(JSON.stringify(output,null,2));
