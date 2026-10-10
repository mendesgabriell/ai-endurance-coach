(function(){
"use strict";
/* =========================================================================
   PRUMO · motor da página.
   Dados chegam prontos em `D` (embutidos no artefato, ou de /api/prumo na
   Vercel). Nada aqui decide treino: o que é cálculo é determinístico e está
   nomeado como tal (prontidão, forma, projeção).
   ========================================================================= */
var D = window.PRUMO_DATA || JSON.parse(document.getElementById("data").textContent);
var P = D.plano, HOJE = D.hoje, PRIV = D.privado || null, QS = new URLSearchParams(location.search);

/* ---------------- utilidades ---------------- */
var DAY=864e5, MES=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"],
    MESL=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"],
    D7=["seg","ter","qua","qui","sex","sáb","dom"], D7A={seg:"Seg",ter:"Ter",qua:"Qua",qui:"Qui",sex:"Sex","sáb":"Sáb",dom:"Dom"},
    D7L={seg:"Segunda",ter:"Terça",qua:"Quarta",qui:"Quinta",sex:"Sexta","sáb":"Sábado",dom:"Domingo"};
function parse(s){ return new Date(s+"T12:00:00Z"); }
function iso(d){ return d.toISOString().slice(0,10); }
function add(s,n){ return iso(new Date(parse(s).getTime()+n*DAY)); }
function diff(a,b){ return Math.round((parse(b)-parse(a))/DAY); }
function dow(s){ return D7[(parse(s).getUTCDay()+6)%7]; }
function ddmm(s){ var d=parse(s); return String(d.getUTCDate()).padStart(2,"0")+"/"+String(d.getUTCMonth()+1).padStart(2,"0"); }
function dm(s){ var d=parse(s); return d.getUTCDate()+" "+MES[d.getUTCMonth()]; }
function dataLonga(s){ var d=parse(s); return D7L[dow(s)]+", "+d.getUTCDate()+" de "+MESL[d.getUTCMonth()]; }
function k1(v){ var r=Math.round(v*10)/10; return (r%1? r.toFixed(1):String(r)).replace(".",","); }
function thou(v){ return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g,"."); }
function hm(m){ return Math.floor(m/60)+"h"+String(Math.round(m%60)).padStart(2,"0"); }
function pace(s){ s=Math.round(s); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); }
function clock(s){ s=Math.round(s); var h=Math.floor(s/3600), m=Math.floor(s%3600/60), x=s%60; return (h?h+":"+String(m).padStart(2,"0"):String(m))+":"+String(x).padStart(2,"0"); }
function hhmm(s){ s=Math.round(s); var h=Math.floor(s/3600), m=Math.floor(s%3600/60); return h+"h"+String(m).padStart(2,"0"); }
function sec(p){ var a=p.split(":").map(Number); return a.length===3? a[0]*3600+a[1]*60+a[2] : a[0]*60+a[1]; }
function esc(s){ return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
function tip(v,l){ return ' data-tip="'+esc(v)+'" data-tl="'+esc(l||"")+'"'; }
function store(k,v){ try{ if(v===undefined) return JSON.parse(localStorage.getItem("prumo:"+k)||"null"); localStorage.setItem("prumo:"+k,JSON.stringify(v)); }catch(e){ return null; } }
function mean(a){ return a.length? a.reduce(function(s,x){return s+x;},0)/a.length : 0; }
function last(a){ return a[a.length-1]; }
function saudacao(){ var h=Number(new Intl.DateTimeFormat("en-US",{timeZone:"America/Sao_Paulo",hour:"numeric",hour12:false}).format(new Date()))%24; return h<5?"Boa noite":h<12?"Bom dia":h<18?"Boa tarde":"Boa noite"; }

/* ---------------- plano ---------------- */
var TERR={rua:"var(--rua)",trilha:"var(--trilha)",esteira:"var(--esteira)",leve:"var(--rua)",caminhada:"var(--muted)",forca:"var(--forca)",bike:"var(--muted)",outro:"var(--muted)"};
var TERRL={rua:"Rua",trilha:"Trilha",esteira:"Esteira",leve:"Leve",caminhada:"Caminhada",forca:"Força",bike:"Bike",outro:"Outro",prova:"Prova"};
var FIM=add(P.inicio,P.semanas.length*7-1), PLAN_KM=P.semanas.reduce(function(s,w){return s+w.km;},0);
function semIdx(date){ var d=diff(P.inicio,date); return d<0?-1:Math.floor(d/7); }
function blocoNome(b){ for(var i=0;i<P.blocos.length;i++) if(P.blocos[i].n===b) return P.blocos[i].nm; return ""; }
function provaEm(date){ for(var i=0;i<D.provas.length;i++) if(D.provas[i].d===date && D.provas[i].plano) return D.provas[i]; return null; }
function plan(date){
  var w=semIdx(date); if(w<0||w>=P.semanas.length) return null;
  var i=diff(P.inicio,date)%7, sem=P.semanas[w], x=sem.d[i];
  var key=x[3]&&P.corrida[x[3]]?x[3]:D7[i], fz=x[5]!==null?(x[5]||null):P.forcaDia[D7[i]];
  if(fz&&!P.forca[fz]) fz=null;
  var pv=provaEm(date);
  return {w:w,i:i,date:date,sem:sem,bloco:sem.b,t:x[1],km:pv?0:x[2],key:key,c:pv?null:P.corrida[key],fz:pv?null:fz,prova:pv};
}

/* ---------------- atividades (intervals.icu + Strava) ---------------- */
var A=D.intervals.acts, RUN={rua:1,trilha:1,esteira:1};
function on(date){ return A.filter(function(a){return a.d===date;}); }
function runs(date){ return on(date).filter(function(a){return RUN[a.t];}); }
function runKm(date){ return runs(date).reduce(function(s,a){return s+a.km;},0); }
function loadDay(date){ return on(date).reduce(function(s,a){return s+(a.load||0);},0); }
var FZ={}; D.strava.forca.forEach(function(f){ FZ[f.d]=f; });
A.forEach(function(a){ if(a.t==="forca"&&!FZ[a.d]) FZ[a.d]={d:a.d,sets:null,min:a.min}; });
function setsOn(date){ var f=FZ[date]; return f? (f.sets? f.sets.length : null) : 0; }
function tonelagem(f){ return f&&f.sets? f.sets.reduce(function(s,x){return s+x[1]*x[2];},0) : 0; }
function runTerr(date){ var r=runs(date); return r.length? r[0].t : null; }
var KM_CICLO=0; for(var d0=P.inicio; d0<=HOJE; d0=add(d0,1)) KM_CICLO+=runKm(d0);
var PCT=KM_CICLO/PLAN_KM;
function semanaDone(w){ var s=0; for(var i=0;i<7;i++){ var d=add(P.inicio,w*7+i); if(d<=HOJE) s+=runKm(d); } return s; }
var W=D.intervals.wellness, WC=W.filter(function(x){return x.ctl!=null;}), WH=W.filter(function(x){return x.hrv!=null;});
var FIT=D.coros.fit, HRV7=D.coros.hrv, SONO=D.coros.sono;
var FSRC="strava", FPER=store("fper")||"tudo", PERD={"1m":31,"3m":92,"6m":183,"1a":366,"tudo":9999};
function serieFit(src){ if(src==="intervals") return WC.map(function(x){return {d:x.d,f:x.ctl,a:x.atl};}); return (D.strava.fitness||[]).map(function(x){return {d:x[0],f:x[1],a:x[2]};}); }

/* estado técnico de um dia: previsto × realizado */
function estado(date,planned,done){
  if(!planned&&done) return "extra";
  if(!planned) return "livre";
  if(date>HOJE) return "previsto";
  if(date===HOJE&&!done) return "hoje";
  if(done>=planned*0.7) return "feito";
  if(done>0) return "parcial";
  return "nao";
}
var EST={feito:["Realizado","var(--good)"],parcial:["Parcial","var(--warn)"],nao:["Não aconteceu","var(--crit)"],hoje:["Hoje","var(--accent)"],
  previsto:["Previsto","var(--axis)"],extra:["Extra","var(--ink-2)"],livre:["Livre","var(--axis)"]};

/* ---------------- prontidão (só relógio, regra fixa) ---------------- */
var NIV=[null,["Parado","var(--crit)","Não corre e não levanta."],["Segura","var(--serious)","Metade do tempo, zona 2. Só máquina."],
  ["Atenção","var(--warn)","Mantém o tempo, corta a intensidade."],["Liberado","var(--good)","A sessão como está."],["Pronto","var(--good)","Pode subir o alvo."]];
function sonoHoje(){ var s=last(SONO), w=last(W.filter(function(x){return x.sono!=null;})); if(s&&(!w||s[0]>=w.d)) return {d:s[0],nota:s[1],min:s[2],deitou:s[8],levantou:s[9]}; return w?{d:w.d,nota:null,min:w.sono}:null; }
function hrvHoje(){ var h=last(HRV7), w=last(WH); if(h&&(!w||h[0]>=w.d)) return {d:h[0],v:h[1],faixa:[h[2],h[3]],base:h[4],sit:h[5]}; if(!w) return null; var base=mean(WH.slice(-8,-1).map(function(x){return x.hrv;}))||w.hrv, r=w.hrv/base; return {d:w.d,v:w.hrv,faixa:[Math.round(base*0.9),Math.round(base*1.1)],base:Math.round(base),sit:r>=1.08?"acima":r>=0.9?"normal":"abaixo"}; }
function fcHoje(){ var rh=W.filter(function(x){return x.rhr!=null;}), c=last(rh); if(!c) return null; return {d:c.d,v:c.rhr,media:mean(rh.slice(-8,-1).map(function(x){return x.rhr;}))}; }
function fresco(d){ return d===HOJE; }
function lido(d){ return d?(fresco(d)?'lido hoje':'<span style="color:var(--accent)">lido '+ddmm(d)+' · desatualizado</span>'):'sem leitura'; }
function prontidao(){
  var it=[], t=0, h=hrvHoje(), sn=sonoHoje(), fc=fcHoje(), datas=[];
  if(h){ var hs=h.sit==="acima"?2:h.sit==="normal"?1:-2; it.push({k:"HRV",v:h.v+" ms",s:hs,l:h.sit+" do normal ("+h.faixa[0]+"–"+h.faixa[1]+")",d:h.d}); t+=hs; datas.push(h.d); }
  var ss=0;
  if(sn&&sn.nota!=null){ ss=sn.nota>=85?2:sn.nota>=70?1:sn.nota>=55?0:-2; if(sn.min<360) ss-=1; it.push({k:"Sono",v:sn.nota+" · "+hm(sn.min),s:ss,l:"nota "+sn.nota,d:sn.d}); datas.push(sn.d); }
  else if(sn){ var m=sn.min; ss=m>=480?2:m>=420?1:m>=360?0:-2; it.push({k:"Sono",v:hm(m),s:ss,l:m>=480?"8 h ou mais":m>=420?"entre 7 e 8 h":m>=360?"entre 6 e 7 h":"menos de 6 h",d:sn.d}); datas.push(sn.d); }
  t+=ss;
  if(fc){ var rs=fc.v<=fc.media?1:fc.v>=fc.media+5?-2:0; it.push({k:"FC repouso",v:fc.v+" bpm",s:rs,l:"média 7d "+Math.round(fc.media),d:fc.d}); t+=rs; datas.push(fc.d); }
  var ac=0, cr=0; for(var k=0;k<28;k++){ var ld=loadDay(add(HOJE,-k)); if(k<7) ac+=ld; cr+=ld; } cr=cr/4; var ratio=cr?ac/cr:0, cs=ratio<=0.9?1:ratio<=1.3?0:ratio<=1.5?-1:-2;
  it.push({k:"Carga 7 dias",v:Math.round(ac)+" · "+ratio.toFixed(1).replace(".",",")+"×",s:cs,l:"da média de 4 semanas ("+Math.round(cr)+")",d:HOJE}); t+=cs;
  var n=t>=5?5:t>=3?4:t>=1?3:t>=-1?2:1, vivo=datas.length>=2&&datas.every(fresco), ultima=datas.length?datas.slice().sort().pop():null;
  return {n:n,total:t,itens:it,vivo:vivo,ultima:ultima};
}
var AJ={3:["Atenção","mantém o tempo, corta a intensidade"],2:["Segura","metade do tempo, zona 2; na força, só máquina"],1:["Parado","não corre e não levanta"]};
function ajuste(pd){
  var n=PRON.n; if(!pd||!PRON.vivo||n>=4||pd.prova) return null;
  var forte=!!(pd.c&&/limiar|tiro|subida|long|ritmo|progress|teste|fartlek/i.test(pd.c.n));
  if(n===3&&!forte) return null;
  var motivo=PRON.itens.filter(function(x){return x.s<0;}).map(function(x){return x.k.toLowerCase()+" "+x.v+" ("+x.l+")";}).join(" · ")||"soma dos sinais do relógio";
  var c=null; if(pd.c&&n>=2){ c= n===3?{n:"Rodagem leve · ajustado",km:pd.km,presc:"Zona 2 o tempo todo, FC até 142, sem o bloco de intensidade."}:{n:"Rodagem leve curta · ajustado",km:Math.round(pd.km/2),presc:"Metade do previsto, zona 2."}; c.de=pd.c.n; }
  var f=null; if(pd.fz&&n===2){ f={n:P.forca[pd.fz].nome+" · só máquina",presc:"Metade das séries, sem peso livre."}; }
  return {n:n,c:c,f:f,motivo:motivo,titulo:AJ[n][0],regra:n===1?"o relógio recomenda descanso; o previsto fica abaixo e a decisão é sua":AJ[n][1]};
}
var PRON=prontidao(); if(QS.get("pron")){ PRON.n=Math.max(1,Math.min(5,+QS.get("pron"))); }

/* ---------------- ícones ---------------- */
var IC={mtn:'<path d="M3 19l6-10 4 6 2-3 6 7z"/>',pulse:'<path d="M3 12h4l2-5 4 10 2-5h6"/>',heart:'<path d="M12 20s-7-4.4-7-9.6A4 4 0 0112 8a4 4 0 017 2.4C19 15.6 12 20 12 20z"/>',
  moon:'<path d="M20 14.6A8 8 0 019.4 4 8 8 0 1020 14.6z"/>',run:'<path d="M5 19L19 5M10 5h9v9"/>',iron:'<path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/>',
  incl:'<path d="M3 19h18M6 17l12-8"/>',flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',drop:'<path d="M12 3s6 7 6 11a6 6 0 01-12 0c0-4 6-11 6-11z"/>',
  gate:'<path d="M4 20V8l8-5 8 5v12M9 20v-6h6v6"/>',vial:'<path d="M9 3h6M10 3v12a2 2 0 004 0V3M10 10h4"/>',ticket:'<path d="M4 7h16v3a2 2 0 000 4v3H4v-3a2 2 0 000-4z"/>',
  cal:'<path d="M4 6h16v14H4zM4 10h16M9 3v4M15 3v4"/>',cam:'<path d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',arrow:'<path d="M7 17L17 7M9 7h8v8"/>',ig:'<path d="M4 4h16v16H4zM12 16a4 4 0 100-8 4 4 0 000 8zM17 7h.01"/>',
  walk:'<path d="M13 4a1 1 0 100-2 1 1 0 000 2zM9 22l2-7 3 2v5M8 12l3-4 3 1 2 3h3"/>',bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  watch:'<path d="M8 3h8l1 4H7zM8 21h8l1-4H7zM5 7h14v10H5z"/>',scale:'<path d="M12 3v18M5 7h14M7 7l-3 6a3 3 0 006 0zM17 7l-3 6a3 3 0 006 0z"/>',
  food:'<path d="M7 3v6a2 2 0 004 0V3M9 11v10M17 3c-1.6 1.4-2.2 3.4-2.2 5.4 0 1.5.7 2.4 2.2 2.6V21"/>'};
function ic(n){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+IC[n]+'</svg>'; }
var SHOE='<svg viewBox="0 0 120 60" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 44c0-6 4-9 10-10l18-3 10-12c3-3 7-3 9 0l6 8c4 5 10 7 17 8l18 3c9 2 15 6 15 12v2H8z"/><path d="M8 50h106M46 26l6 5M53 21l6 5"/></svg>';
function sq(color,icon){ return '<span class="sq" style="background:'+color+'">'+ic(icon)+'</span>'; }

/* ---------------- primitivas de gráfico ---------------- */
function vb(w,h,inner,label){ return '<svg viewBox="0 0 '+w+' '+h+'" width="100%" role="img" aria-label="'+esc(label)+'">'+inner+'</svg>'; }
function colPath(x,y,w,h,r){ if(h<=0.5) return ""; r=Math.min(r===undefined?4:r,w/2,h); return "M"+x+","+(y+h)+"V"+(y+r)+"Q"+x+","+y+" "+(x+r)+","+y+"H"+(x+w-r)+"Q"+(x+w)+","+y+" "+(x+w)+","+(y+r)+"V"+(y+h)+"Z"; }
function rowPath(x,y,w,h,r){ if(w<=0.5) return ""; r=Math.min(r===undefined?4:r,h/2,w); return "M"+x+","+y+"H"+(x+w-r)+"Q"+(x+w)+","+y+" "+(x+w)+","+(y+r)+"V"+(y+h-r)+"Q"+(x+w)+","+(y+h)+" "+(x+w-r)+","+(y+h)+"H"+x+"Z"; }
function smooth(pts){ if(pts.length<3) return pts.map(function(p,i){return (i?"L":"M")+p[0].toFixed(1)+","+p[1].toFixed(1);}).join(""); var d="M"+pts[0][0].toFixed(1)+","+pts[0][1].toFixed(1); for(var i=0;i<pts.length-1;i++){ var p0=pts[i-1]||pts[i], p1=pts[i], p2=pts[i+1], p3=pts[i+2]||p2; var c1x=p1[0]+(p2[0]-p0[0])/6, c1y=p1[1]+(p2[1]-p0[1])/6, c2x=p2[0]-(p3[0]-p1[0])/6, c2y=p2[1]-(p3[1]-p1[1])/6; d+="C"+c1x.toFixed(1)+","+c1y.toFixed(1)+" "+c2x.toFixed(1)+","+c2y.toFixed(1)+" "+p2[0].toFixed(1)+","+p2[1].toFixed(1); } return d; }
function spark(vals,w,h,color,endc){
  var pts=vals.map(function(v,i){return [i,v];}).filter(function(p){return p[1]!==null&&p[1]!==undefined;});
  if(pts.length<2) return '<div style="height:'+h+'px"></div>';
  var mn=Math.min.apply(null,pts.map(function(p){return p[1];})), mx=Math.max.apply(null,pts.map(function(p){return p[1];})); if(mx===mn){mx+=1;mn-=1;}
  var X=function(i){return 3+i/(vals.length-1)*(w-6);}, Y=function(v){return 3+(1-(v-mn)/(mx-mn))*(h-8);};
  var d=smooth(pts.map(function(p){return [X(p[0]),Y(p[1])];})), lp=last(pts);
  return '<svg viewBox="0 0 '+w+' '+h+'" width="100%" height="'+h+'" aria-hidden="true" preserveAspectRatio="none"><path d="'+d+' L'+X(lp[0]).toFixed(1)+','+h+' L'+X(pts[0][0]).toFixed(1)+','+h+'Z" fill="'+color+'" opacity=".08"/><path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="2" stroke-linecap="round" vector-effect="non-scaling-stroke"/><circle cx="'+X(lp[0]).toFixed(1)+'" cy="'+Y(lp[1]).toFixed(1)+'" r="4" fill="'+(endc||color)+'" stroke="var(--card)" stroke-width="2"/></svg>';
}
function kpi(icon,label,val,unit,pill,color){ return '<div class="kpi"><span class="ki" style="color:'+(color||"var(--ink)")+'">'+ic(icon)+'</span><div style="min-width:0"><span class="kl">'+label+'</span><span class="kv">'+val+(unit?'<small>'+unit+'</small>':'')+'</span></div>'+(pill||"")+'</div>'; }
function hello(title,line,kpis){ return '<section class="hello"><div><p class="dt">'+line+'</p><h1>'+title+'</h1></div><div class="kpis">'+kpis+'</div></section>'; }
function card(cls,head,body,meta,right){ return '<article class="card '+cls+'"><div class="ch"><h2>'+head+'</h2>'+(right?'<div class="r">'+right+'</div>':(meta?'<span class="m">'+meta+'</span>':''))+'</div>'+body+'</article>'; }

/* =========================================================================
   COMPONENTES
   ========================================================================= */
var FEITO=store("feito")||{}, ABERTO={};
function tenisPara(pd){
  if(!pd||!pd.c) return null; var L=tenisLista(), em=L.ultimos; if(!em.length) return null;
  var q=/limiar|tiro|ritmo|progress|qualidade|teste|prova/i.test(pd.c.n), tipo=pd.t==="trilha"?"trilha":q?"prova":"rua";
  var cand=em.filter(function(t){return t.tipo===tipo;}); if(!cand.length&&tipo==="prova") cand=em.filter(function(t){return t.tipo==="rua";}); if(!cand.length) cand=em;
  return cand.slice().sort(function(a,b){return (a.ultimo||"")<(b.ultimo||"")?-1:1;})[0];
}
function sessoes(pd,publico,only){
  if(!pd) return '<p class="lbl">Fora do ciclo.</p>';
  var aj=ajuste(pd), pre=aj?'<div class="alerta">'+ic("bolt")+'<div><b>'+(aj.n===1?'Atenção · prontidão 1 (Parado)':'Atenção · treino ajustado · prontidão '+aj.n+' ('+aj.titulo+')')+'</b>'+esc(aj.regra)+'. Motivo: '+esc(aj.motivo)+'.'+(aj.n===1?'':' O previsto continua em "Treino completo".')+'</div></div>':(!PRON.vivo&&!publico?'<p class="note" style="margin-bottom:10px">Prontidão de hoje ainda não chegou do relógio'+(PRON.ultima?' (última leitura '+ddmm(PRON.ultima)+')':'')+'. O treino abaixo é o previsto, sem ajuste.</p>':'');
  if(pd.prova) return '<div class="ses">'+sq("var(--good)","flag")+'<div><p class="t">'+esc(pd.prova.n)+'</p><p class="s">'+pd.prova.km+' km'+(pd.prova.dplus?' · '+thou(pd.prova.dplus)+' m D+':'')+' · '+esc(pd.prova.meta)+'</p></div><p class="n">Prova</p></div>';
  var o=pre;
  if(pd.c&&only!=="f"){
    var kd=pd.date+":c", c=pd.c, tc=TERR[pd.t], op=ABERTO[kd], tn=tenisPara(pd), ac=aj&&aj.c;
    o+='<div class="ses'+(FEITO[kd]?' done':'')+(op?' open':'')+'">'+sq(tc,pd.t==="trilha"?"mtn":pd.t==="esteira"?"incl":"run")
      +'<div style="min-width:0"><p class="t">'+esc(ac?ac.n:c.n)+'</p><p class="s">'+(ac?'era: '+esc(c.n)+' · ':'')+TERRL[pd.t]+(c.loc?' · '+esc(c.loc):'')+'</p><p class="s" style="color:var(--ink);margin-top:2px">'+esc(ac?ac.presc:(c.presc[pd.bloco]||""))+'</p>'+(tn?'<p class="s" style="margin-top:3px">Tênis: <b style="color:var(--ink);font-weight:600">'+esc(tn.marca+" "+tn.modelo)+'</b> · '+thou(tn.km)+' km'+(tn.ultimo?' · usado em '+ddmm(tn.ultimo):'')+'</p>':'')+'</div>'
      +'<p class="n">'+k1(ac?ac.km:pd.km)+'<small>km</small></p>'
      +'<div class="full"><p>'+(ac?'<b>Previsto: '+esc(c.n)+' · '+k1(pd.km)+' km.</b> ':'')+esc(c.obj)+'</p><ol>'+c.passos.map(function(p){return '<li>'+esc(p)+'</li>';}).join("")+'</ol>'+(c.reg?'<div class="reg">'+esc(c.reg)+'</div>':'')+'</div>'
      +'<div class="acts2"><button class="btn mini" data-abre="'+kd+'">'+(op?'Fechar':'Treino completo')+'</button>'+(publico?'':'<button class="btn mini'+(FEITO[kd]?' dark':'')+'" data-feito="'+kd+'">'+(FEITO[kd]?'Realizado ✓':'Marcar realizado')+'</button>')+'</div></div>';
  }
  if(pd.fz&&only!=="c"){
    var f=P.forca[pd.fz], kf=pd.date+":f", af=aj&&aj.f, sr=f.ex.reduce(function(s,e){ if(/^Abdominal/.test(e[0])) return s; var m=/^(\d+)/.exec(e[1]); return s+(m?+m[1]:3); },0), op2=ABERTO[kf];
    o+='<div class="ses'+(FEITO[kf]?' done':'')+(op2?' open':'')+'">'+sq("var(--ink)","iron")
      +'<div style="min-width:0"><p class="t">'+esc(af?af.n:f.nome)+'</p><p class="s">'+(af?esc(af.presc)+' · ':'')+f.ex.length+' exercícios · ~'+Math.round(sr*2.6)+' min · mais abdominal e esteira inclinada</p></div>'
      +'<p class="n">'+sr+'<small>séries</small></p>'
      +'<div class="full"><p>'+esc(f.tip)+'</p><ol>'+f.ex.map(function(e){return '<li><b>'+esc(e[0])+'</b> — '+esc(e[1])+(e[3]?'<br><span style="color:var(--muted)">'+esc(e[3])+'</span>':'')+'</li>';}).join("")+'</ol></div>'
      +'<div class="acts2"><button class="btn mini" data-abre="'+kf+'">'+(op2?'Fechar':'Treino completo')+'</button>'+(publico?'':'<button class="btn mini'+(FEITO[kf]?' dark':'')+'" data-feito="'+kf+'">'+(FEITO[kf]?'Realizado ✓':'Marcar realizado')+'</button>')+'</div></div>';
  }
  return o||'<p class="lbl">'+(only==="f"?"Sem força hoje.":only==="c"?"Sem corrida hoje.":"Dia livre.")+'</p>';
}

function gauge(nv){
  var cx=150, cy=132, r=108, o="", gap=2.4;
  for(var k=1;k<=5;k++){
    var a0=Math.PI*(1-(k-1)/5)-(gap/2)*Math.PI/180, a1=Math.PI*(1-k/5)+(gap/2)*Math.PI/180;
    var on=nv.n===k;
    o+='<path d="M'+(cx+r*Math.cos(a0)).toFixed(1)+','+(cy-r*Math.sin(a0)).toFixed(1)+' A'+r+','+r+' 0 0 1 '+(cx+r*Math.cos(a1)).toFixed(1)+','+(cy-r*Math.sin(a1)).toFixed(1)+'" fill="none" stroke="'+NIV[k][1]+'" stroke-width="'+(on?22:13)+'" opacity="'+(on?1:.2)+'"'+tip(k+" · "+NIV[k][0],NIV[k][2])+'/>';
    var am=(a0+a1)/2; o+='<text class="ax" x="'+(cx+(r+22)*Math.cos(am)).toFixed(1)+'" y="'+(cy-(r+22)*Math.sin(am)+3.5).toFixed(1)+'" text-anchor="middle">'+k+'</text>';
  }
  var am2=Math.PI*(1-(nv.n-.5)/5);
  o+='<line x1="'+cx+'" y1="'+cy+'" x2="'+(cx+(r-26)*Math.cos(am2)).toFixed(1)+'" y2="'+(cy-(r-26)*Math.sin(am2)).toFixed(1)+'" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/><circle cx="'+cx+'" cy="'+cy+'" r="6" fill="var(--ink)"/>';
  o+='<text x="'+cx+'" y="'+(cy-36)+'" text-anchor="middle" style="font-size:40px;font-weight:600;fill:var(--ink);letter-spacing:-1.5px">'+nv.n+'</text>';
  return '<svg viewBox="0 0 300 146" width="100%" role="img" aria-label="Prontidão nível '+nv.n+'">'+o+'</svg>';
}
function prontCard(publico){
  var nv=PRON;
  var o='<div class="ch"><h2>Prontidão</h2><span class="pill" style="background:var(--card-2)"><i style="background:'+NIV[nv.n][1]+'"></i>'+nv.n+' · '+NIV[nv.n][0]+(nv.vivo?'':' · de '+ddmm(nv.ultima||HOJE))+'</span></div>';
  o+='<div class="gauge-wrap">'+gauge(nv)+'</div><p style="text-align:center;font-size:13px;color:var(--ink-2);margin-top:-8px">'+NIV[nv.n][2]+'</p>';
  o+='<div class="fat">'+nv.itens.map(function(x){ var c=x.s>=1?"var(--good)":x.s===0?"var(--warn)":"var(--crit)"; return '<div><span class="k"><i style="background:'+c+'"></i>'+x.k+'</span><span class="v">'+x.v+' <small>'+esc(x.l)+'</small></span><span class="lbl" style="display:block;font-size:10.5px">'+lido(x.d)+'</span></div>'; }).join("")+'</div>'+(nv.vivo?'':'<p class="note" style="color:var(--accent)">Leitura de hoje ainda não chegou do relógio. Sincroniza o COROS no celular; o painel lê o intervals.icu a cada abertura.</p>');
  if(!publico) o+='<p class="note">Lido do relógio: HRV contra a faixa normal, sono, FC de repouso contra a média de 7 dias e carga dos últimos 7 dias contra a média de 4 semanas. Abaixo de 4, o treino do dia muda sozinho e avisa.</p>';
  return o;
}

/* contagem: próxima prova em destaque */
function alvoTs(p){ return Date.parse(p.d+"T"+(p.hora||"06:00")+":00-03:00"); }
function parts(t){ var f=Math.max(0,t-Date.now()); return {d:Math.floor(f/DAY),h:Math.floor(f/36e5)%24,m:Math.floor(f/6e4)%60,s:Math.floor(f/1e3)%60}; }
var PROX=D.provas.filter(function(p){return p.d>=HOJE;}), NEXT=PROX[0], AS=D.provas.filter(function(p){return p.cls==="A";});
function proxCard(){
  var c=parts(alvoTs(NEXT));
  var o='<div class="ch"><h2>Próxima prova</h2><span class="pill'+(NEXT.cls==="A"?' red':'')+'">Prova '+NEXT.cls+'</span></div>';
  o+='<div><p style="font-size:15px;font-weight:600;letter-spacing:-.02em">'+esc(NEXT.n)+'</p><p class="lbl">'+ddmm(NEXT.d)+' · '+NEXT.km+' km'+(NEXT.dplus?' · '+thou(NEXT.dplus)+' m D+':'')+' · '+esc(NEXT.meta)+'</p></div>';
  o+='<div class="row" style="align-items:baseline;gap:6px"><span class="big num" data-cd="d:'+NEXT.d+'">'+c.d+'</span><span class="lbl">dias</span><span class="sp"></span>'
    +'<span class="num" style="font-size:20px;font-weight:600;letter-spacing:-.03em"><span data-cd="h:'+NEXT.d+'">'+String(c.h).padStart(2,"0")+'</span><small class="lbl">h</small> <span data-cd="m:'+NEXT.d+'">'+String(c.m).padStart(2,"0")+'</span><small class="lbl">min</small></span></div>';
  o+='<hr class="hr"><div class="list">'+AS.map(function(p){ var dd=parts(alvoTs(p)).d; return '<div class="li" style="grid-template-columns:1fr auto"><div style="min-width:0"><p class="lt">'+esc(p.c)+' · '+p.km+' km</p><p class="ls">'+ddmm(p.d)+' · '+esc(p.meta)+'</p></div><span class="num" style="font-size:22px;font-weight:600;letter-spacing:-.04em" data-cd="d:'+p.d+'">'+dd+'</span></div>'; }).join("")+'</div>';
  return o;
}

/* semana: só corrida conta como volume; caminhada fica de fora */
function semana(w,publico){
  w=Math.max(0,Math.min(P.semanas.length-1,w)); var sem=P.semanas[w], days=[], tp=0, td=0, nc=0, ncd=0, nf=0, nfd=0;
  for(var i=0;i<7;i++){ var d=add(P.inicio,w*7+i), pd=plan(d), done=d<=HOJE?runKm(d):0, st=setsOn(d), fzOk=!!FZ[d]; days.push({d:d,pd:pd,done:done,sets:st,fz:fzOk}); tp+=pd.km; td+=done; if(pd.c||pd.prova) nc++; if(d<=HOJE&&done>0) ncd++; if(pd.fz) nf++; if(d<=HOJE&&pd.fz&&fzOk) nfd++; }
  var o='<div class="week">'+days.map(function(x){
    var pd=x.pd, st=estado(x.d,pd.km,x.done), tc=TERR[runTerr(x.d)||pd.t]||"var(--rua)", pct=pd.km?Math.min(1,x.done/pd.km):0;
    var titulo=pd.prova?pd.prova.c:pd.c?pd.c.n:"Sem corrida", sub=pd.prova?k1(pd.prova.km)+" km":pd.c?TERRL[pd.t]+(pd.c.loc?" · "+esc(pd.c.loc.split(" · ")[0]):""):"";
    var num=pd.prova?'<b>'+k1(pd.prova.km)+'</b><small>km</small>':x.done?'<b>'+k1(x.done)+'</b><small>de '+k1(pd.km)+' km</small>':pd.km?'<b>'+k1(pd.km)+'</b><small>km</small>':'<b>—</b>';
    var bar=pd.km||x.done?'<div class="wbar"'+tip((x.done?k1(x.done)+" de ":"")+k1(pd.km)+" km",titulo)+'><i style="width:'+(pd.km?Math.round(pct*100):100)+'%;background:'+tc+'"></i></div>':'<div class="wbar none"></div>';
    var fz=pd.prova?'':pd.fz?'<p class="wf'+(x.fz?' ok':'')+'"'+tip(P.forca[pd.fz].nome,x.sets?x.sets+" séries registradas":x.fz?"feita":"")+'>'+ic("iron")+'<span>'+esc(P.forca[pd.fz].nome)+'</span>'+(x.sets?'<b>'+x.sets+' s</b>':x.fz?'<b>✓</b>':'')+'</p>':'<p class="wf none">'+ic("iron")+'<span>sem força</span></p>';
    return '<div class="day'+(x.d===HOJE?' today':'')+(pd.prova?' race':'')+'"><div class="dn"><b>'+D7A[D7[pd.i]]+' <span>'+parse(x.d).getUTCDate()+'</span></b></div>'
      +'<p class="wt">'+esc(titulo)+'</p><p class="ws"><i style="background:'+tc+'"></i>'+sub+'</p>'
      +'<p class="km num">'+num+'</p>'+bar+fz+'<span class="st"><i style="background:'+EST[st][1]+'"></i>'+EST[st][0]+'</span></div>';
  }).join("")+'</div>';
  var head='<div class="ch"><h2>Semana '+(w+1)+' <span class="m">de 25 · '+esc(sem.b)+' '+esc(blocoNome(sem.b))+'</span></h2><div class="r">'+(publico?'':'<button class="ico" data-wk="'+(w-1)+'" aria-label="Semana anterior" style="width:28px;height:28px">‹</button><button class="ico" data-wk="'+(w+1)+'" aria-label="Próxima semana" style="width:28px;height:28px">›</button>')+'</div></div>';
  var res='<div class="wsum"><div><b class="num">'+k1(td)+'</b><span>de '+k1(tp)+' km</span></div><div><b class="num">'+ncd+'</b><span>de '+nc+' corridas</span></div><div><b class="num">'+nfd+'</b><span>de '+nf+' sessões de força</span></div><div><span class="lbl">'+esc(sem.dt)+'</span></div></div>';
  return head+res+o+'<div class="legend"><span><i style="background:var(--rua)"></i>Rua</span><span><i style="background:var(--esteira)"></i>Esteira</span><span><i style="background:var(--trilha)"></i>Trilha</span><span>Barra = rodado sobre o previsto</span><span>Caminhada não conta</span></div>';
}
function atencao(){
  var it=(PRIV&&PRIV.atencao)||[];
  if(!it.length) return '<p class="lbl">Nada pendente.</p>';
  return '<div class="list">'+it.map(function(x){ var dd=x[4]?diff(HOJE,x[4]):null;
    var pill=x[4]===null?'<span class="pill warn"><i></i>Conferir</span>':dd<=0?'<span class="pill red">Hoje</span>':'<span class="pill">'+(dd===1?'Amanhã':'Em '+dd+' dias')+'</span>';
    return '<div class="li">'+sq(x[1],x[0])+'<div style="min-width:0"><p class="lt">'+x[2]+'</p><p class="ls">'+x[3]+'</p>'+(x[4]?'<div class="meter"><i style="width:'+Math.max(4,Math.min(100,(1-dd/x[5])*100))+'%;background:'+(dd<=7?'var(--accent-fill)':'var(--ink)')+'"></i></div>':'')+'</div>'+pill+'</div>'; }).join("")+'</div>';
}

/* fitness · fadiga · forma (intervals.icu, modelo de Banister como o Strava) */
function fitness(h,src,per){
  src=src||FSRC; per=per||FPER; var SA=serieFit(src), S=SA.slice(-PERD[per]), n=S.length, Wd=1000, H=h||260, L=36, R=60, T=18, B=36;
  var top=Math.max.apply(null,S.map(function(x){return Math.max(x.f,x.a);})), ymax=Math.ceil((top*1.08)/10)*10;
  var ymin=Math.min(-10,Math.floor(Math.min.apply(null,S.map(function(x){return x.f-x.a;}))/10)*10);
  var X=function(i){return L+i/(n-1)*(Wd-L-R);}, Y=function(v){return T+(1-(v-ymin)/(ymax-ymin))*(H-T-B);}, o="";
  var step=10; while((ymax-ymin)/step*15>(H-T-B)) step*=2;
  for(var g=Math.ceil(ymin/step)*step; g<=ymax; g+=step) o+='<line class="gl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(g)+'" y2="'+Y(g)+'"/><text class="ax" x="'+(L-8)+'" y="'+(Y(g)+3.5)+'" text-anchor="end">'+g+'</text>';
  o+='<line x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(0)+'" y2="'+Y(0)+'" stroke="var(--axis)" stroke-width="1"/>';
  var tsb=S.map(function(x,i){return [X(i),Y(x.f-x.a)];}), sm=n>120?function(p){return p.map(function(q,i){return (i?"L":"M")+q[0].toFixed(1)+","+q[1].toFixed(1);}).join("");}:smooth;
  o+='<path d="'+sm(tsb)+' L'+X(n-1).toFixed(1)+','+Y(0)+' L'+X(0).toFixed(1)+','+Y(0)+'Z" fill="var(--tsb)" opacity=".10"/><path d="'+sm(tsb)+'" fill="none" stroke="var(--tsb)" stroke-width="1.5"/>';
  o+='<path d="'+sm(S.map(function(x,i){return [X(i),Y(x.a)];}))+'" fill="none" stroke="var(--atl)" stroke-width="1.5" opacity=".9"/>';
  o+='<path d="'+sm(S.map(function(x,i){return [X(i),Y(x.f)];}))+'" fill="none" stroke="var(--ctl)" stroke-width="2.5" stroke-linejoin="round"/>';
  var provas=(D.strava.provasFit||{});
  Object.keys(provas).forEach(function(d){ var i=S.findIndex(function(x){return x.d===d;}); if(i<0) return; o+='<line x1="'+X(i)+'" x2="'+X(i)+'" y1="'+(T+10)+'" y2="'+Y(ymin)+'" stroke="var(--axis)" stroke-dasharray="3 4"/><circle cx="'+X(i)+'" cy="'+Y(S[i].f)+'" r="4" fill="var(--card)" stroke="var(--ctl)" stroke-width="2"'+tip(provas[d],ddmm(d)+" · fitness "+S[i].f.toFixed(0))+'/>'; });
  var pk=0; S.forEach(function(x,i){ if(x.f>S[pk].f) pk=i; });
  if(pk<n-3) o+='<text class="vl" x="'+Math.min(X(pk),Wd-R-30)+'" y="'+(Y(S[pk].f)-10)+'" text-anchor="middle">pico '+S[pk].f.toFixed(0)+'</text>';
  var lx=X(n-1), lc=last(S), labs=[{v:lc.f,c:"var(--ctl)",t:lc.f.toFixed(0),cls:"vl"},{v:lc.a,c:"var(--atl)",t:lc.a.toFixed(0),cls:"ax",st:"fill:var(--accent);font-weight:600"},{v:lc.f-lc.a,c:"var(--tsb)",t:(lc.f-lc.a>=0?"+":"")+(lc.f-lc.a).toFixed(0),cls:"ax",st:"fill:var(--tsb);font-weight:600"}];
  labs.forEach(function(l){ l.y=Y(l.v); }); labs.sort(function(p,q){return p.y-q.y;});
  for(var i=1;i<labs.length;i++) if(labs[i].y-labs[i-1].y<16) labs[i].y=labs[i-1].y+16;
  labs.forEach(function(l){ o+='<circle cx="'+lx+'" cy="'+Y(l.v)+'" r="4.5" fill="'+l.c+'" stroke="var(--card)" stroke-width="2"/><text class="'+l.cls+'" x="'+(lx+9)+'" y="'+(l.y+4)+'"'+(l.st?' style="'+l.st+'"':'')+'>'+l.t+'</text>'; });
  S.forEach(function(x,i){ o+='<rect x="'+(X(i)-(Wd-L-R)/n/2)+'" y="'+T+'" width="'+((Wd-L-R)/n)+'" height="'+(H-T-B)+'" fill="transparent"'+tip("fitness "+x.f.toFixed(0)+" · fadiga "+x.a.toFixed(0)+" · forma "+(x.f-x.a>=0?"+":"")+(x.f-x.a).toFixed(0),ddmm(x.d)+(x.d.slice(0,4)!==HOJE.slice(0,4)?"/"+x.d.slice(2,4):""))+'/>'; });
  var lm=-1, every=n>400?3:n>200?2:1, k=0; S.forEach(function(x,i){ var m=parse(x.d).getUTCMonth(); if(m!==lm){ if(k%every===0&&(i>0||n<=40)) o+='<text class="ax" x="'+X(i)+'" y="'+(H-14)+'">'+MES[m]+(m===0||i===0?" "+x.d.slice(2,4):"")+'</text>'; lm=m; k++; } });
  var legSrc = "Modelo do Strava sobre o esforço relativo de todas as atividades com FC, médias exponenciais de 42 e 7 dias · desde "+ddmm(SA[0].d)+"/"+SA[0].d.slice(2,4);
  return vb(Wd,H,o,"Fitness, fadiga e forma")+'<div class="legend"><span><i class="ln" style="background:var(--ctl)"></i>Fitness</span><span><i class="ln" style="background:var(--atl)"></i>Fadiga</span><span><i style="background:var(--tsb);opacity:.5"></i>Forma</span><span><i class="dot rg"></i>Prova</span></div><p class="note">'+legSrc+'</p>';
}
function fitnessPer(){ return '<div class="seg light" role="group" aria-label="Período">'+["1m","3m","6m","1a","tudo"].map(function(p){return '<button type="button" data-fper="'+p+'" aria-pressed="'+(FPER===p)+'">'+p+'</button>';}).join("")+'</div>'; }
function fitnessSeg(){ return ""; }
function reSemanal(){
  var RE=D.strava.re||{}, mon0=add(HOJE,-((parse(HOJE).getUTCDay()+6)%7)), weeks=[], n=12;
  for(var i=n-1;i>=0;i--){ var m=add(mon0,-i*7), v=0; for(var k=0;k<7;k++) v+=RE[add(m,k)]||0; weeks.push({m:m,v:v}); }
  var Wd=480,H=170,L=36,R=10,T=18,B=30, mx=Math.max(100,Math.ceil(Math.max.apply(null,weeks.map(function(w){return w.v;}))/100)*100), bw=(Wd-L-R)/n, Y=function(v){return T+(1-v/mx)*(H-T-B);}, o="";
  for(var g=0;g<=mx;g+=mx/4) o+='<line class="gl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(g)+'" y2="'+Y(g)+'"/><text class="ax" x="'+(L-8)+'" y="'+(Y(g)+3.5)+'" text-anchor="end">'+g+'</text>';
  var med=mean(weeks.slice(0,n-1).map(function(w){return w.v;}));
  weeks.forEach(function(w,i){ var x=L+i*bw+bw*.2, ww=bw*.6, cur=i===n-1; o+='<path d="'+colPath(x,Y(w.v),ww,Y(0)-Y(w.v),3)+'" fill="'+(cur?'var(--accent-fill)':'var(--ink)')+'"'+tip(w.v+" de esforço relativo","semana de "+ddmm(w.m)+(cur?" · em curso":""))+'/>'; if(i%2===(n-1)%2) o+='<text class="ax" x="'+(x+ww/2)+'" y="'+(H-14)+'" text-anchor="middle">'+ddmm(w.m)+'</text>'; });
  o+='<line x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(med)+'" y2="'+Y(med)+'" stroke="var(--axis)" stroke-dasharray="4 4"/><text class="ax" x="'+(Wd-R)+'" y="'+(Y(med)-4)+'" text-anchor="end">média '+Math.round(med)+'</text>';
  return vb(Wd,H,o,"Esforço relativo por semana")+'<p class="note">Soma do esforço relativo do Strava, segunda a domingo, todas as atividades. A semana em curso em vermelho; a linha é a média das 11 anteriores.</p>';
}

function fitnessStats(src){
  src=src||FSRC; var S=serieFit(src), lc=last(S), pk=S.reduce(function(m,x){return x.f>m.f?x:m;},S[0]), w7=S[S.length-8]||S[0], d=lc.f-w7.f;
  var alvo = '<div><span class="k">Pico do registro</span><span class="v">'+pk.f.toFixed(0)+'</span><span class="d">'+ddmm(pk.d)+'/'+pk.d.slice(2,4)+'</span></div>';
  return '<div class="stat3"><div><span class="k">Fitness</span><span class="v">'+lc.f.toFixed(0)+'</span><span class="d '+(d>=0?'up':'dn')+'">'+(d>=0?'+':'')+d.toFixed(1)+' em 7 dias</span></div><div><span class="k">Fadiga</span><span class="v">'+lc.a.toFixed(0)+'</span><span class="d">7 dias</span></div><div><span class="k">Forma</span><span class="v">'+(lc.f-lc.a>=0?'+':'')+(lc.f-lc.a).toFixed(0)+'</span><span class="d">'+(lc.f-lc.a>5?'descansado':lc.f-lc.a>-10?'equilibrado':'em fadiga')+'</span></div>'+alvo+'</div>';
}

/* carga por dia (vermelho = esforço; prova = verde) */
function heatCiclo(){ return heat(0,0,add(P.inicio,-((parse(P.inicio).getUTCDay()+6)%7))); }
function heat(weeksBack,weeksAhead,start0){
  var mon0=add(HOJE,-((parse(HOJE).getUTCDay()+6)%7)), start=start0||add(mon0,-weeksBack*7), weeks=start0?Math.ceil((diff(start0,FIM)+1)/7):weeksBack+weeksAhead+1, cs=18, g=3, L=30, T=16, o="", lastM=-1;
  var TON=["var(--e0)","var(--e1)","var(--e2)","var(--e3)","var(--e4)","var(--e5)"], tot=0, dias=0, ativos=0;
  for(var r=0;r<7;r++) o+='<text class="ax" x="0" y="'+(T+r*(cs+g)+12.5)+'">'+D7A[D7[r]]+'</text>';
  for(var w=0;w<weeks;w++){
    var mon=add(start,w*7), m=parse(mon).getUTCMonth();
    if(m!==lastM){ o+='<text class="ax" x="'+(L+w*(cs+g))+'" y="9">'+MES[m]+'</text>'; lastM=m; }
    for(var r2=0;r2<7;r2++){
      var d=add(mon,r2), x=L+w*(cs+g), y=T+r2*(cs+g), pv=provaEm(d)||(d===D.paraty.d?{c:"Paraty",n:D.paraty.n}:null);
      if(d<=HOJE){
        var ld=loadDay(d), fz=!!FZ[d]; dias++; tot+=ld; if(ld||fz) ativos++;
        var lv=ld===0?0:ld<=25?1:ld<=60?2:ld<=100?3:ld<=160?4:5;
        var lbl=on(d).map(function(a){return a.t==="forca"?"força":a.km?TERRL[a.t].toLowerCase()+" "+k1(a.km)+" km":a.t;}).join(" + ");
        o+='<rect x="'+x+'" y="'+y+'" width="'+cs+'" height="'+cs+'" rx="3" fill="'+(pv?'var(--good)':TON[lv])+'"'+tip((pv?pv.c+" · ":"")+"carga "+Math.round(ld),D7A[D7[r2]]+" "+ddmm(d)+(lbl?" · "+lbl:""))+'/>';
        if(fz&&!pv) o+='<circle cx="'+(x+cs/2)+'" cy="'+(y+cs/2)+'" r="2.4" fill="'+(lv>=3?'var(--card)':'var(--ink)')+'" pointer-events="none"/>';
      } else {
        var pd=plan(d);
        o+='<rect x="'+(x+.5)+'" y="'+(y+.5)+'" width="'+(cs-1)+'" height="'+(cs-1)+'" rx="3" fill="'+(pv?'var(--good-wash)':'none')+'" stroke="'+(pv?'var(--good)':'var(--hair)')+'"'+tip(pv?pv.c:(pd&&pd.c?pd.c.n+" · "+k1(pd.km)+" km":"livre"),ddmm(d))+'/>';
      }
      if(d===HOJE) o+='<rect x="'+(x-1.5)+'" y="'+(y-1.5)+'" width="'+(cs+3)+'" height="'+(cs+3)+'" rx="4" fill="none" stroke="var(--accent)" stroke-width="2"/>';
    }
  }
  var Wd=L+weeks*(cs+g), H=T+7*(cs+g);
  var stats='<div class="row" style="gap:22px;flex-wrap:wrap"><div><span class="mid num">'+ativos+'</span><span class="lbl"> de '+dias+' dias com treino</span></div><div><span class="mid num">'+thou(tot)+'</span><span class="lbl"> de carga no período</span></div></div>';
  return stats+'<svg viewBox="0 0 '+Wd+' '+H+'" width="'+Wd+'" style="max-width:100%;height:auto" role="img" aria-label="Carga de treino por dia">'+o+'</svg>'+'<div class="legend"><span>Leve</span>'+TON.slice(1).map(function(c){return '<i style="background:'+c+'"></i>';}).join("")+'<span>Pesado</span><span style="margin-left:8px"><i class="dot" style="background:var(--ink)"></i>Dia com força</span><span><i style="background:var(--good)"></i>Prova</span><span><i class="rg"></i>Previsto</span></div>';
}

function feed(n){
  var ev=[], s=last(SONO), h=last(HRV7);
  ev.push([HOJE,"moon","var(--s-rem)","Sono "+s[1],hm(s[2])+" · deitou "+s[8]]);
  ev.push([HOJE,"pulse","var(--good)","HRV "+h[1]+" ms",h[5]+" do normal ("+h[2]+"–"+h[3]+")"]);
  A.slice().reverse().forEach(function(a){
    if(a.t==="forca"){ var f=FZ[a.d]; ev.push([a.d,"iron","var(--ink)","Força"+(f&&f.sets?" · "+f.sets.length+" séries":""),a.min+" min"+(f&&f.sets&&tonelagem(f)?" · "+thou(tonelagem(f))+" kg deslocados":"")]); }
    else if(a.t==="caminhada") ev.push([a.d,"walk","var(--muted)","Caminhada · "+k1(a.km)+" km",a.min+" min · não conta como treino"]);
    else if(RUN[a.t]) ev.push([a.d,a.t==="trilha"?"mtn":a.t==="esteira"?"incl":"run",TERR[a.t],TERRL[a.t]+" · "+k1(a.km)+" km",pace(a.min*60/a.km)+"/km · FC "+(a.hr||"—")+" · carga "+(a.load||0)]);
  });
  return '<div class="list">'+ev.slice(0,n||7).map(function(e){ var dd=diff(e[0],HOJE); return '<div class="li">'+sq(e[2],e[1])+'<div style="min-width:0"><p class="lt">'+esc(e[3])+'</p><p class="ls">'+esc(e[4])+'</p></div><span class="lbl">'+(dd===0?"hoje":dd===1?"ontem":ddmm(e[0]))+'</span></div>'; }).join("")+'</div>';
}

/* volume semanal: previsto × rodado */
function volume(h){
  var Wd=1000, H=h||230, L=34, R=10, T=16, B=40, n=P.semanas.length, bw=(Wd-L-R)/n, cur=semIdx(HOJE), mx=110, Y=function(v){return T+(1-v/mx)*(H-T-B);}, o="";
  [0,25,50,75,100].forEach(function(v){ o+='<line class="gl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(v)+'" y2="'+Y(v)+'"/><text class="ax" x="'+(L-8)+'" y="'+(Y(v)+3.5)+'" text-anchor="end">'+v+'</text>'; });
  P.semanas.forEach(function(s,i){
    var x=L+i*bw+bw*.18, w=Math.min(24,bw*.64), dn=semanaDone(i), past=add(P.inicio,i*7)<=HOJE;
    o+='<path d="'+colPath(x,Y(s.km),w,Y(0)-Y(s.km))+'" fill="'+(i===cur?'var(--accent-wash)':'var(--card-3)')+'"'+tip(s.km+" km previstos","Semana "+(i+1)+" · "+s.dt+(past?" · rodou "+k1(dn)+" km":""))+'/>';
    if(past&&dn>0) o+='<path d="'+colPath(x+w*.2,Y(dn),w*.6,Y(0)-Y(dn),3)+'" fill="'+(i===cur?'var(--accent-fill)':'var(--ink)')+'"'+tip(k1(dn)+" km rodados","Semana "+(i+1)+" · previsto "+s.km)+'/>';
    if(i%2===0||i===n-1) o+='<text class="ax" x="'+(x+w/2)+'" y="'+(Y(0)+14)+'" text-anchor="middle">'+(i+1)+'</text>';
  });
  var bn=null, bx=0; P.semanas.forEach(function(s,i){ if(s.b!==bn){ if(bn!==null) o+=fx(bx,L+i*bw,bn); bx=L+i*bw; bn=s.b; } }); o+=fx(bx,Wd-R,bn);
  function fx(x0,x1,b){ return '<line x1="'+(x0+3)+'" x2="'+(x1-3)+'" y1="'+(H-12)+'" y2="'+(H-12)+'" stroke="var(--ink)" stroke-width="2"/><text class="ax" x="'+(x0+3)+'" y="'+(H-1)+'">'+blocoNome(b)+'</text>'; }
  o+='<line class="bl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(0)+'" y2="'+Y(0)+'"/>';
  return vb(Wd,H,o,"Volume semanal previsto e rodado")+'<div class="legend"><span><i style="background:var(--card-3)"></i>Previsto</span><span><i style="background:var(--ink)"></i>Rodado</span><span><i style="background:var(--accent-fill)"></i>Semana atual</span></div>';
}

/* terreno: plano do ciclo × rodado, primeiro as barras, depois a tabela */
function terreno(){
  var pl={rua:0,esteira:0,trilha:0}, dn={rua:0,esteira:0,trilha:0};
  P.semanas.forEach(function(s){ s.d.forEach(function(x){ var t=x[1]==="leve"?"rua":x[1]; pl[t]+=x[2]; }); });
  A.forEach(function(a){ if(a.d>=P.inicio&&RUN[a.t]) dn[a.t]+=a.km; });
  function bar(obj,label){ var tot=obj.rua+obj.esteira+obj.trilha||1, seg=["rua","esteira","trilha"].map(function(t){ var w=obj[t]/tot*100; return w>0?'<div style="width:'+w+'%;background:'+TERR[t]+';height:22px;border-radius:4px"'+tip(k1(obj[t])+" km",TERRL[t]+" · "+Math.round(w)+"%")+'></div>':""; }).join("");
    return '<div><div class="row" style="justify-content:space-between;margin-bottom:6px"><span style="font-size:13px;font-weight:500">'+label+'</span><span class="lbl num">'+thou(tot)+' km</span></div><div style="display:flex;gap:2px">'+seg+'</div></div>'; }
  var tp=pl.rua+pl.esteira+pl.trilha, tdn=dn.rua+dn.esteira+dn.trilha||1;
  var rows='<div class="tbl"><table><thead><tr><th>Terreno</th><th class="n">Plano</th><th class="n">%</th><th class="n">Rodado</th><th class="n">%</th></tr></thead><tbody>'+["rua","esteira","trilha"].map(function(t){
    return '<tr><td><span class="row"><i style="width:10px;height:10px;border-radius:3px;background:'+TERR[t]+'"></i>'+TERRL[t]+'</span></td><td class="n">'+thou(pl[t])+' km</td><td class="n">'+Math.round(pl[t]/tp*100)+'%</td><td class="n">'+k1(dn[t])+' km</td><td class="n">'+Math.round(dn[t]/tdn*100)+'%</td></tr>'; }).join("")+'</tbody></table></div>';
  return bar(pl,"Plano do ciclo")+bar(dn,"Rodado até agora")+rows;
}

/* planejado × realizado, linguagem técnica */
function auditoria(n,tipo){
  var rows="", d=HOJE, k=0, cont={feito:0,parcial:0,nao:0,extra:0};
  while(k<(n||10)&&d>=P.inicio){
    var pd=plan(d), dk=runKm(d), st=setsOn(d), sc=estado(d,pd.km,dk), sf=pd.fz?estado(d,1,st?1:0):(st?"extra":"livre");
    if(tipo!=="f"&&cont[sc]!==undefined) cont[sc]++; if(tipo!=="c"&&cont[sf]!==undefined) cont[sf]++;
    var r=runs(d)[0];
    rows+='<tr><td>'+D7A[dow(d)]+' '+ddmm(d)+'</td>'+(tipo!=="f"?'<td>'+(pd.c?esc(pd.c.n)+' · '+k1(pd.km)+' km':pd.prova?esc(pd.prova.c):'—')+'</td><td class="n">'+(dk?k1(dk)+' km · '+pace(r.min*60/r.km)+'/km':'—')+'</td><td><span class="pill"><i style="background:'+EST[sc][1]+'"></i>'+EST[sc][0]+'</span></td>':'')
      +(tipo!=="c"?'<td>'+(pd.fz||'—')+'</td><td class="n">'+(st?st+' séries':FZ[d]?'feita':'—')+'</td><td><span class="pill"><i style="background:'+EST[sf][1]+'"></i>'+EST[sf][0]+'</span></td>':'')+'</tr>';
    d=add(d,-1); k++;
  }
  var tot=cont.feito+cont.parcial+cont.nao||1, r0=38, c=2*Math.PI*r0, a=0, dz="";
  [["feito",cont.feito],["parcial",cont.parcial],["nao",cont.nao]].forEach(function(s){ if(!s[1]) return; var l=s[1]/tot*c; dz+='<circle cx="50" cy="50" r="'+r0+'" fill="none" stroke="'+EST[s[0]][1]+'" stroke-width="13" stroke-dasharray="'+Math.max(0,l-2)+' '+(c-l+2)+'" stroke-dashoffset="'+(-a)+'" transform="rotate(-90 50 50)"'+tip(s[1]+" sessões",EST[s[0]][0])+'/>'; a+=l; });
  var donut='<svg viewBox="0 0 100 100" width="104" height="104" role="img" aria-label="Sessões por estado"><circle cx="50" cy="50" r="'+r0+'" fill="none" stroke="var(--card-3)" stroke-width="13"/>'+dz+'<text x="50" y="47" text-anchor="middle" style="font-size:19px;font-weight:600;fill:var(--ink)">'+Math.round(cont.feito/tot*100)+'%</text><text x="50" y="62" text-anchor="middle" class="ax" style="font-size:9px">realizado</text></svg>';
  var head=(tipo!=="f"?'<th>Corrida prevista</th><th class="n">Realizado</th><th></th>':'')+(tipo!=="c"?'<th>Força</th><th class="n">Realizado</th><th></th>':'');
  return '<div class="row" style="gap:22px;flex-wrap:wrap">'+donut+'<div class="legend" style="flex-direction:column;gap:6px"><span><i style="background:var(--good)"></i>'+cont.feito+' realizadas</span><span><i style="background:var(--warn)"></i>'+cont.parcial+' parciais</span><span><i style="background:var(--crit)"></i>'+cont.nao+' não aconteceram</span><span><i style="background:var(--ink-2)"></i>'+cont.extra+' extras</span></div></div>'
    +'<div class="tbl"><table><thead><tr><th>Dia</th>'+head+'</tr></thead><tbody>'+rows+'</tbody></table></div>';
}

/* periodização: blocos, volume, provas, marcos, hoje */
function periodizacao(h,detail){
  var Wd=1000, H=h||200, L=6, R=6, n=P.semanas.length, bw=(Wd-L-R)/n, o="", cur=semIdx(HOJE);
  var TON={"Bloco 0":"var(--card-3)","Bloco 1":"var(--e2)","Bloco 2":"var(--e3)","Bloco 3":"var(--e4)","Bloco 4":"var(--e2)"};
  var bn=null, bx=0; P.semanas.forEach(function(s,i){ if(s.b!==bn){ if(bn!==null) o+=blk(bx,i,bn); bn=s.b; bx=i; } }); o+=blk(bx,n,bn);
  function blk(i0,i1,b){ var x=L+i0*bw, w=(i1-i0)*bw-3, q=P.blocos.filter(function(z){return z.n===b;})[0];
    return '<rect x="'+x+'" y="18" width="'+w+'" height="30" rx="6" fill="'+TON[b]+'"'+tip(b+" · "+blocoNome(b),q?q.dt+" · "+q.q.slice(0,90):"")+'/><text x="'+(x+8)+'" y="37" style="font-size:12px;font-weight:600;fill:'+(b==="Bloco 2"||b==="Bloco 3"?'#fff':'var(--ink)')+'">'+blocoNome(b)+'</text>'; }
  var mxk=Math.max.apply(null,P.semanas.map(function(z){return z.km;})), mx=Math.ceil(mxk*1.08/10)*10, Y=function(v){return 128-v/mx*66;};
  P.semanas.forEach(function(s,i){ var x=L+i*bw+bw*.2, w=bw*.6, dn=semanaDone(i); o+='<path d="'+colPath(x,Y(s.km),w,128-Y(s.km),3)+'" fill="'+(i===cur?'var(--accent-wash)':'var(--card-3)')+'"'+tip(s.km+" km previstos","Semana "+(i+1)+" · "+s.dt)+'/>'; if(dn>0&&add(P.inicio,i*7)<=HOJE) o+='<path d="'+colPath(x+w*.2,Y(dn),w*.6,128-Y(dn),2)+'" fill="'+(i===cur?'var(--accent-fill)':'var(--ink)')+'"/>'; if(detail&&(i%4===0||i===n-1)) o+='<text class="ax" x="'+(x+w/2)+'" y="140" text-anchor="middle">s'+(i+1)+'</text>'; });
  o+='<line class="bl" x1="'+L+'" x2="'+(Wd-R)+'" y1="128" y2="128"/>';
  D.marcos.forEach(function(g){ var w=semIdx(g.d); if(w<0) return; var x=L+w*bw+bw/2, soon=g.d>=HOJE&&diff(HOJE,g.d)<=10;
    o+='<path d="M'+x+',150 l6,7 l-6,7 l-6,-7z" fill="'+(soon?'var(--accent-fill)':g.d<HOJE?'var(--good)':'var(--ink)')+'"'+tip(g.c+" · "+g.t,ddmm(g.d)+" · abre: "+g.abre)+'/>'+(detail?'<text class="ax" x="'+x+'" y="176" text-anchor="middle" style="font-weight:600;fill:var(--ink-2)">'+g.c+'</text>':''); });
  D.provas.filter(function(p){return p.plano;}).forEach(function(p){ var w=semIdx(p.d), x=L+w*bw+bw/2; o+='<circle cx="'+x+'" cy="'+(detail?190:160)+'" r="5" fill="var(--good)"'+tip(p.n,ddmm(p.d))+'/><text class="vl" x="'+(x+9)+'" y="'+(detail?194:164)+'" style="fill:var(--good-text)">'+esc(p.c)+'</text>'; });
  if(cur>=0){ var tx=L+(diff(P.inicio,HOJE)/7)*bw; o+='<line x1="'+tx+'" x2="'+tx+'" y1="8" y2="'+(H-6)+'" stroke="var(--accent)" stroke-width="1.5"/><text class="vlr" x="'+(tx+5)+'" y="12">hoje</text>'; }
  return vb(Wd,H,o,"Periodização do ciclo")+(detail?'<div class="legend"><span><i style="background:var(--card-3)"></i>Previsto</span><span><i style="background:var(--ink)"></i>Rodado</span><span><i style="background:var(--ink);transform:rotate(45deg);border-radius:2px;width:8px;height:8px"></i>Marco</span><span><i class="dot" style="background:var(--good)"></i>Prova</span></div>':'');
}
function marcos(){
  return '<div class="list">'+D.marcos.map(function(g,i){ var dd=diff(HOJE,g.d), cur=dd>=0&&(i===0||diff(HOJE,D.marcos[i-1].d)<0);
    return '<div class="li"><span class="sq" style="background:'+(cur?'var(--accent-fill)':dd<0?'var(--good)':'var(--card-3)')+';color:'+(cur||dd<0?'#fff':'var(--ink-2)')+';font-weight:700;font-size:11px">'+g.c+'</span><div style="min-width:0"><p class="lt">'+esc(g.t)+'</p><p class="ls">Destrava: '+esc(g.abre)+'</p></div><span class="'+(cur?'pill red':'pill')+'">'+(dd<0?'passou':dd===0?'hoje':ddmm(g.d))+'</span></div>'; }).join("")+'</div>';
}

/* percurso real (traçado oficial) com a posição do ciclo */
var PK=store("perfil")||"indomit";
function percurso(key,h,puro){
  var pf=D.perfis[key], Wd=1000, H=h||250, L=44, R=16, T=24, B=36, pts=pf.pts;
  var amin=Math.floor((pf.altmin-120)/250)*250, amax=Math.ceil((pf.altmax+120)/250)*250;
  var X=function(k){return L+k/pf.km*(Wd-L-R);}, Y=function(a){return T+(1-(a-amin)/(amax-amin))*(H-T-B);}, o="";
  for(var a=amin;a<=amax;a+=(amax-amin>1500?500:250)) o+='<line class="gl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(a)+'" y2="'+Y(a)+'"/><text class="ax" x="'+(L-8)+'" y="'+(Y(a)+3.5)+'" text-anchor="end">'+thou(a)+'</text>';
  var line=pts.map(function(p,i){return (i?"L":"M")+X(p[0]).toFixed(1)+","+Y(p[1]).toFixed(1);}).join(""), base=Y(amin);
  o+='<path d="'+line+'L'+X(pf.km)+','+base+'L'+X(0)+','+base+'Z" fill="var(--ink)" opacity=".07"/>';
  var frac=puro?0:(key==="indomit"?PCT:0), fk=Math.min(1,frac)*pf.km, done=pts.filter(function(p){return p[0]<=fk;});
  if(!puro&&done.length>1){ o+='<path d="'+done.map(function(p,i){return (i?"L":"M")+X(p[0]).toFixed(1)+","+Y(p[1]).toFixed(1);}).join("")+'L'+X(fk)+','+base+'L'+X(0)+','+base+'Z" fill="var(--accent-fill)" opacity=".22"/>'; }
  o+='<path d="'+line+'" fill="none" stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round"/><line class="bl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+base+'" y2="'+base+'"/>';
  for(var k=0;k<=pf.km;k+=(pf.km>60?10:5)) o+='<text class="ax" x="'+X(k)+'" y="'+(H-14)+'" text-anchor="middle">'+k+'</text>';
  o+='<text class="ax" x="'+(Wd-R)+'" y="'+(H-1)+'" text-anchor="end">km</text>';
  var top=pts.reduce(function(m,p){return p[1]>m[1]?p:m;});
  o+='<circle cx="'+X(top[0])+'" cy="'+Y(top[1])+'" r="4" fill="var(--ink)" stroke="var(--card)" stroke-width="2"/><text class="vl" x="'+X(top[0])+'" y="'+(Y(top[1])-9)+'" text-anchor="middle">'+thou(top[1])+' m · km '+Math.round(top[0])+'</text>';
  if(!puro){ var my=done.length?Y(last(done)[1]):Y(pts[0][1]);
  o+='<line x1="'+X(fk)+'" x2="'+X(fk)+'" y1="'+(T-10)+'" y2="'+base+'" stroke="var(--accent)" stroke-width="1.5"/><circle cx="'+X(fk)+'" cy="'+my+'" r="7" fill="var(--accent-fill)" stroke="var(--card)" stroke-width="3"'+tip("km "+k1(fk)+" de "+pf.km,"cada km do ciclo anda no percurso · "+k1(frac*100)+"%")+'/><text class="vlr" x="'+(X(fk)+10)+'" y="'+(T-2)+'">você · km '+k1(fk)+'</text>'; }
  pts.forEach(function(p,i){ if(i%4) return; o+='<rect x="'+(X(p[0])-4)+'" y="'+T+'" width="8" height="'+(H-T-B)+'" fill="transparent"'+tip(thou(p[1])+" m","km "+k1(p[0]))+'/>'; });
  return vb(Wd,H,o,"Perfil de "+pf.nome);
}
function cicloPercurso(){
  var pf=D.perfis.mision, lm=D.provas.filter(function(p){return p.c==="La Misión";})[0], ind=D.provas.filter(function(p){return p.c==="Indomit";})[0];
  var tot=diff(P.inicio,lm.d), fr=Math.max(0,Math.min(1,diff(P.inicio,HOJE)/tot)), fi=diff(P.inicio,ind.d)/tot;
  var Wd=1000, H=250, L=44, R=16, T=28, B=36, pts=pf.pts, amin=Math.floor((pf.altmin-120)/250)*250, amax=Math.ceil((pf.altmax+120)/250)*250;
  var X=function(k){return L+k/pf.km*(Wd-L-R);}, Y=function(a){return T+(1-(a-amin)/(amax-amin))*(H-T-B);}, base=Y(amin), o="";
  for(var a=amin;a<=amax;a+=500) o+='<line class="gl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(a)+'" y2="'+Y(a)+'"/><text class="ax" x="'+(L-8)+'" y="'+(Y(a)+3.5)+'" text-anchor="end">'+thou(a)+'</text>';
  var line=pts.map(function(p,i){return (i?"L":"M")+X(p[0]).toFixed(1)+","+Y(p[1]).toFixed(1);}).join("");
  o+='<path d="'+line+'L'+X(pf.km)+','+base+'L'+X(0)+','+base+'Z" fill="var(--ink)" opacity=".07"/>';
  var fk=fr*pf.km, done=pts.filter(function(p){return p[0]<=fk;}); if(done.length>1) o+='<path d="'+done.map(function(p,i){return (i?"L":"M")+X(p[0]).toFixed(1)+","+Y(p[1]).toFixed(1);}).join("")+'L'+X(fk)+','+base+'L'+X(0)+','+base+'Z" fill="var(--accent-fill)" opacity=".22"/>';
  o+='<path d="'+line+'" fill="none" stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round"/><line class="bl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+base+'" y2="'+base+'"/>';
  [0,.25,.5,.75,1].forEach(function(q){ o+='<text class="ax" x="'+X(q*pf.km)+'" y="'+(H-14)+'" text-anchor="middle">'+Math.round(q*100)+'%</text>'; });
  function altAt(k){ var p=pts.reduce(function(m,q){return Math.abs(q[0]-k)<Math.abs(m[0]-k)?q:m;}); return p[1]; }
  var xi=X(fi*pf.km), yi=Y(altAt(fi*pf.km));
  o+='<line x1="'+xi+'" x2="'+xi+'" y1="'+(T-4)+'" y2="'+base+'" stroke="var(--good)" stroke-dasharray="4 4"/><circle cx="'+xi+'" cy="'+yi+'" r="6" fill="var(--good)" stroke="var(--card)" stroke-width="2"'+tip(ind.n,ddmm(ind.d)+" · "+Math.round(fi*100)+"% do caminho")+'/><text class="vl" x="'+(xi+9)+'" y="'+(T+6)+'" style="fill:var(--good-text)">Indomit · '+ddmm(ind.d)+'</text>';
  var my=done.length?Y(last(done)[1]):Y(pts[0][1]);
  o+='<line x1="'+X(fk)+'" x2="'+X(fk)+'" y1="'+(T-10)+'" y2="'+base+'" stroke="var(--accent)" stroke-width="1.5"/><circle cx="'+X(fk)+'" cy="'+my+'" r="7" fill="var(--accent-fill)" stroke="var(--card)" stroke-width="3"'+tip(Math.round(fr*100)+"% do tempo até a La Misión",ddmm(HOJE)+" · dia "+diff(P.inicio,HOJE)+" de "+tot)+'/><text class="vlr" x="'+(X(fk)+10)+'" y="'+(T-2)+'">você · '+Math.round(fr*100)+'%</text>';
  o+='<text class="vl" x="'+(Wd-R)+'" y="'+(T-2)+'" text-anchor="end">La Misión · '+ddmm(lm.d)+'</text>';
  var dplus=A.filter(function(x){return x.d>=P.inicio&&RUN[x.t];}).reduce(function(m,x){return m+(x.dplus||0);},0);
  var tr=A.filter(function(x){return x.d>=P.inicio&&x.t==="trilha"&&x.km>2;}), rate=tr.length?mean(tr.map(function(x){return x.min*60/(x.km+(x.dplus||0)/100);})):null;
  var st='<div class="stat3"><div><span class="k">Rodado até a Indomit</span><span class="v">'+k1(KM_CICLO)+'<small> de '+thou(PLAN_KM)+' km</small></span><span class="d">'+k1(PCT*100)+'% · semana '+(WK+1)+' de 25</span></div>'
    +'<div><span class="k">Desnível acumulado</span><span class="v">'+thou(dplus)+'<small> m</small></span><span class="d">'+(dplus/ind.dplus).toFixed(1).replace(".",",")+' Indomits · '+(dplus/lm.dplus).toFixed(2).replace(".",",")+' La Misión</span></div>'
    +'<div><span class="k">Ritmo em trilha no ciclo</span><span class="v">'+(rate?pace(rate):'—')+'<small>'+(rate?' /km-esforço':'')+'</small></span><span class="d">alvo 6:30 Indomit · 7:01 La Misión'+(tr.length?' · '+tr.length+' treinos':' · sem trilha ainda')+'</span></div>'
    +'<div><span class="k">Do caminho no tempo</span><span class="v">'+Math.round(fr*100)+'<small> %</small></span><span class="d">dia '+diff(P.inicio,HOJE)+' de '+tot+' até a La Misión</span></div></div>';
  return st+vb(Wd,H,o,"O ciclo desenhado sobre o percurso da La Misión")+'<p class="note">O ciclo inteiro é o da La Misión; a Indomit é um ponto no caminho. A posição anda com o tempo; o km, o desnível e o ritmo por km-esforço dizem se o corpo está acompanhando. km-esforço = km + D+/100.</p>';
}
function comoMontado(){
  var bl=P.blocos.map(function(b){ return '<div class="pr"><p class="n">'+esc(b.n)+(b.dt?' · '+esc(b.dt):'')+'</p><p class="t">'+esc(b.nm)+'</p><p>'+esc(b.q||"")+'</p></div>'; }).join("");
  var vi=[["Corrida","Base na semana, longo no fim de semana","Rodagem base e qualidade em dias alternados; o longo de trilha mora no sábado, no Votu, porque é o único dia que a logística permite."],
    ["Montanha","Subida na esteira durante a semana","Inclinação alta abaixo de 120 bpm, 20 a 30 minutos nos dias de academia. O desnível de verdade vem do fim de semana."],
    ["Força","Fisiculturista, seis vezes por semana","Rodízio de seis treinos, abdominal todo dia, glúteo e lombar como focos. O alvo é o corpo e a força total, não a prova."],
    ["Decisão","O relógio modula o dia","Prontidão abaixo de 4 muda o treino na hora: corta intensidade, encurta ou tira. O aviso aparece no treino do dia."]];
  return '<p class="sub">Os blocos, do macro para o micro</p><div class="principios" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">'+bl+'</div><p class="sub" style="margin-top:14px">Os vieses que montaram o ciclo</p><div class="principios" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">'+vi.map(function(x){return '<div class="pr"><p class="n">'+x[0]+'</p><p class="t">'+x[1]+'</p><p>'+x[2]+'</p></div>';}).join("")+'</div>';
}
/* projeção: números (COROS + RP + meta) e curva até a meta */
function riegel(t,d1,d2){ return t*Math.pow(d2/d1,1.06); }
var DIST=[["5k",5,"5 km"],["10k",10,"10 km"],["21k",21.0975,"Meia"],["42k",42.195,"Maratona"],["50k",50,"50 km plano"]];
function projNumeros(){
  var prev=FIT.prev, prs=D.strava.prs, metas={"21k":6000,"42k":12600};
  var rows=DIST.map(function(x){ var k=x[0], pv=prev[k]!=null?prev[k]:riegel(prev["42k"],42.195,50), pr=prs[k], m=metas[k];
    return '<tr><td style="font-weight:500">'+x[2]+'</td><td class="n">'+clock(pv)+'<br><span class="lbl">'+pace(pv/x[1])+'/km</span></td><td class="n pr">'+(pr?clock(pr.t):'—')+(pr?'<br><span class="lbl" style="font-weight:400">'+esc(pr.onde.split(" ·")[0])+' · '+ddmm(pr.d)+'</span>':'')+'</td><td class="n">'+(m?clock(m):'—')+'</td><td class="n">'+(m?'<span style="color:'+(pv-m>0?'var(--accent)':'var(--good-text)')+';font-weight:600">'+(pv-m>0?'−':'+')+clock(Math.abs(pv-m))+'</span>':'<span class="lbl">sem meta</span>')+'</td></tr>'; }).join("");
  return '<div class="tbl fit"><table><thead><tr><th>Distância</th><th class="n"><span class="lg">Previsão COROS</span><span class="sm">COROS</span></th><th class="n"><span class="lg">Melhor no Strava · 2026</span><span class="sm">Strava 2026</span></th><th class="n">Meta</th><th class="n">Falta</th></tr></thead><tbody>'+rows+'</tbody></table></div><p class="note">Previsão do relógio (VO₂max '+FIT.vo2+', limiar '+FIT.limiar+'/km). 50 km plano por Riegel a partir da maratona. Melhores tempos registrados no Strava em 2026 — os RPs de antes entram quando você passar.</p>';
}
function projCurva(key){
  var pv=D.provas.filter(function(p){return key==="21k"?p.c==="Rio 21K":p.c==="POA 42K";})[0];
  var hist=(D.previsoes||[]).filter(function(h){return h[key]!=null&&h.d<=HOJE;}), t0=FIT.prev[key], meta=pv.meta_s, pr=D.strava.prs[key].t, Wd=640, H=250, L=56, R=22, T=28, B=34;
  var d0=P.inicio, d1=pv.d, X=function(d){return L+Math.max(0,diff(d0,d))/diff(d0,d1)*(Wd-L-R);};
  var vals=hist.map(function(h){return h[key];}).concat([t0,pr,meta]), ymax=Math.max.apply(null,vals)*1.03, ymin=meta*0.95, Y=function(v){return T+(v-ymin)/(ymax-ymin)*(H-T-B);}, o="";
  var step=key==="21k"?120:300; for(var g=Math.ceil(ymin/step)*step; g<=ymax; g+=step) o+='<line class="gl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(g)+'" y2="'+Y(g)+'"/><text class="ax" x="'+(L-8)+'" y="'+(Y(g)+3.5)+'" text-anchor="end">'+hhmm(g)+'</text>';
  var cur=d0, k=0; while(cur<=d1){ var dt=parse(cur), nx=iso(new Date(Date.UTC(dt.getUTCFullYear(),dt.getUTCMonth()+1,1))); if(k>0) o+='<text class="ax" x="'+X(cur)+'" y="'+(H-14)+'" text-anchor="middle">'+MES[dt.getUTCMonth()]+'</text>'; cur=nx; k++; }
  o+='<line x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(pr)+'" y2="'+Y(pr)+'" stroke="var(--axis)" stroke-dasharray="3 4"/><text class="ax" x="'+(Wd-R)+'" y="'+(Y(pr)-5)+'" text-anchor="end">RP '+clock(pr)+'</text>';
  o+='<line x1="'+L+'" x2="'+X(d1)+'" y1="'+Y(meta)+'" y2="'+Y(meta)+'" stroke="var(--accent)" stroke-dasharray="4 4"/><circle cx="'+X(d1)+'" cy="'+Y(meta)+'" r="6" fill="var(--accent-fill)" stroke="var(--card)" stroke-width="2"'+tip(clock(meta),"meta · "+ddmm(d1))+'/><text class="vlr" x="'+(X(d1)-10)+'" y="'+(Y(meta)-9)+'" text-anchor="end">meta '+clock(meta)+' · '+ddmm(d1)+'</text>';
  o+='<line x1="'+X(HOJE)+'" x2="'+X(d1)+'" y1="'+Y(t0)+'" y2="'+Y(t0)+'" stroke="var(--ink-2)" stroke-dasharray="2 4"/><circle cx="'+X(d1)+'" cy="'+Y(t0)+'" r="6" fill="var(--card)" stroke="var(--ink-2)" stroke-width="2"'+tip(clock(t0),"se nada mudar · "+ddmm(d1))+'/><text class="ax" x="'+(X(d1)-10)+'" y="'+(Y(t0)+15)+'" text-anchor="end">se nada mudar · '+clock(t0)+'</text>';
  o+='<line x1="'+X(HOJE)+'" x2="'+X(d1)+'" y1="'+Y(t0)+'" y2="'+Y(meta)+'" stroke="var(--axis)" stroke-dasharray="6 5"/>';
  var pts=hist.map(function(h){return [X(h.d),Y(h[key])];}); if(!hist.length||last(hist).d!==HOJE) pts.push([X(HOJE),Y(t0)]);
  if(pts.length>1) o+='<path d="'+pts.map(function(q,i){return (i?"L":"M")+q[0].toFixed(1)+","+q[1].toFixed(1);}).join("")+'" fill="none" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round"/>';
  hist.forEach(function(h){ if(h.d===HOJE) return; o+='<circle cx="'+X(h.d)+'" cy="'+Y(h[key])+'" r="3" fill="var(--ink)"'+tip(clock(h[key]),"previsão · "+ddmm(h.d))+'/>'; });
  o+='<circle cx="'+X(HOJE)+'" cy="'+Y(t0)+'" r="7" fill="var(--ink)" stroke="var(--card)" stroke-width="2"'+tip(clock(t0),"previsão hoje · COROS")+'/><text class="vl" x="'+(X(HOJE)+11)+'" y="'+(Y(t0)+4)+'">hoje '+clock(t0)+'</text>';
  var gap=t0-meta, mesesR=Math.max(1,diff(HOJE,d1)/30.44);
  o+='<text class="ax" x="'+L+'" y="'+(T-12)+'">↑ mais rápido · para chegar em '+clock(meta)+': '+(gap>0?'−'+clock(gap/mesesR)+' por mês até a prova':'já está na meta')+'</text>';
  return '<div style="min-width:0"><p style="font-size:13px;font-weight:600;margin-bottom:4px">'+esc(pv.n)+' <span class="lbl">'+ddmm(pv.d)+'</span></p>'+vb(Wd,H,o,"Projeção para "+pv.n)+'<div class="legend"><span><i class="ln" style="background:var(--ink)"></i>Projeção do relógio</span><span><i class="ln" style="background:var(--accent)"></i>Meta</span><span><i class="ln" style="background:var(--ink-2)"></i>Se nada mudar</span><span><i class="ln" style="background:var(--axis)"></i>Trajetória</span></div></div>';
}
function projTrail(){
  var pa=D.paraty, kme=pa.km+pa.dplus/100, rate=pa.t/kme;
  var it=[{n:"Paraty 58K",s:"referência · "+ddmm(pa.d)+" · "+hhmm(pa.t),kme:kme,t:pa.t,ref:true,c:"var(--axis)",ic:"flag"},
    {n:"Indomit · meta 8h50",s:"20/03/2027 · "+k1(D.perfis.indomit.km)+" km + "+thou(D.perfis.indomit.dplus)+" m",kme:D.perfis.indomit.km+D.perfis.indomit.dplus/100,t:31800,c:"var(--accent-fill)",ic:"mtn"},
    {n:"La Misión · meta 20h",s:"13/08/2027 · "+k1(D.perfis.mision.km)+" km + "+thou(D.perfis.mision.dplus)+" m",kme:D.perfis.mision.km+D.perfis.mision.dplus/100,t:72000,c:"var(--ink)",ic:"mtn"}];
  it.forEach(function(x){ x.r=x.t/x.kme; }); var mn=Math.min.apply(null,it.map(function(x){return x.r;}));
  return '<div style="min-width:0"><p style="font-size:13px;font-weight:600;margin-bottom:4px">Trilha · o ritmo que cada meta pede <span class="lbl">min por km-esforço</span></p><div class="list">'+it.map(function(x){ var d=Math.round((1-x.r/rate)*100);
    return '<div class="li" style="grid-template-columns:auto 1fr auto">'+sq(x.c,x.ic)+'<div style="min-width:0"><p class="lt">'+x.n+'</p><p class="ls">'+x.s+' · '+Math.round(x.kme)+' km-esforço</p><div class="meter" style="margin-top:6px"><i style="width:'+Math.round(mn/x.r*100)+'%;background:'+x.c+'"></i></div></div><div style="text-align:right"><p class="num" style="font-size:18px;font-weight:600;letter-spacing:-.03em;line-height:1">'+pace(x.r)+'<span class="lbl">/km-e</span></p><p class="lbl">'+(x.ref?'o que você fez':(d>0?'−':'+')+Math.abs(d)+'% que Paraty')+'</p></div></div>'; }).join("")+'</div><p class="note">km-esforço = km + D+/100 (ITRA). A barra é velocidade: cheia é a meta mais rápida. As duas metas pedem '+Math.round((1-it[2].r/rate)*100)+'% a mais por km-esforço do que em Paraty; na La Misión, pelo dobro da distância.</p></div>';
}
/* corpo */
function hrvChart(){
  var S=WH.slice(-30), n=S.length, Wd=1000, H=250, L=34, R=40, T=18, B=34, mn=35, mx=100, X=function(i){return L+i/(n-1)*(Wd-L-R);}, Y=function(v){return T+(1-(v-mn)/(mx-mn))*(H-T-B);}, o="";
  [40,55,70,85,100].forEach(function(v){ o+='<line class="gl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(v)+'" y2="'+Y(v)+'"/><text class="ax" x="'+(L-8)+'" y="'+(Y(v)+3.5)+'" text-anchor="end">'+v+'</text>'; });
  var idx={}; S.forEach(function(x,i){ idx[x.d]=i; });
  var band=HRV7.map(function(h){return X(idx[h[0]])+","+Y(h[3]);}).join(" ")+" "+HRV7.slice().reverse().map(function(h){return X(idx[h[0]])+","+Y(h[2]);}).join(" ");
  o+='<polygon points="'+band+'" fill="var(--good)" opacity=".12"/>';
  o+='<polyline points="'+HRV7.map(function(h){return X(idx[h[0]])+","+Y(h[4]);}).join(" ")+'" fill="none" stroke="var(--ink-2)" stroke-width="1.2" stroke-dasharray="4 4"/>';
  o+='<path d="'+smooth(S.map(function(x,i){return [X(i),Y(x.hrv)];}))+'" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/>';
  HRV7.forEach(function(h){ var i=idx[h[0]]; if(i===undefined) return; var c=h[5]==="abaixo"?"var(--crit)":h[5]==="acima"?"var(--good)":"var(--ink)"; o+='<circle cx="'+X(i)+'" cy="'+Y(h[1])+'" r="5" fill="'+c+'" stroke="var(--card)" stroke-width="2"'+tip(h[1]+" ms",ddmm(h[0])+" · "+h[5]+" do normal · faixa "+h[2]+"–"+h[3])+'/>'; });
  S.forEach(function(x,i){ o+='<rect x="'+(X(i)-(Wd-L-R)/n/2)+'" y="'+T+'" width="'+((Wd-L-R)/n)+'" height="'+(H-T-B)+'" fill="transparent"'+tip(x.hrv+" ms",ddmm(x.d))+'/>'; });
  var lc=last(S); o+='<text class="vl" x="'+(X(n-1)+8)+'" y="'+(Y(lc.hrv)+4)+'">'+lc.hrv+'</text>';
  var lm=-1; S.forEach(function(x,i){ var m=parse(x.d).getUTCMonth(); if(m!==lm){ o+='<text class="ax" x="'+X(i)+'" y="'+(H-14)+'">'+MES[m]+'</text>'; lm=m; } });
  return vb(Wd,H,o,"HRV noturno")+'<div class="legend"><span><i style="background:var(--good);opacity:.35"></i>Faixa normal (COROS, 7 dias)</span><span><i class="ln" style="background:var(--ink-2)"></i>Base</span><span><i class="dot" style="background:var(--good)"></i>Acima</span><span><i class="dot" style="background:var(--crit)"></i>Abaixo</span></div>';
}
function fcChart(){
  var S=W.filter(function(x){return x.rhr!=null;}).slice(-30), n=S.length, Wd=1000, H=250, L=34, R=40, T=18, B=34, mn=38, mx=58, X=function(i){return L+i/(n-1)*(Wd-L-R);}, Y=function(v){return T+(1-(v-mn)/(mx-mn))*(H-T-B);}, o="";
  [40,44,48,52,56].forEach(function(v){ o+='<line class="gl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(v)+'" y2="'+Y(v)+'"/><text class="ax" x="'+(L-8)+'" y="'+(Y(v)+3.5)+'" text-anchor="end">'+v+'</text>'; });
  o+='<path d="'+smooth(S.map(function(x,i){return [X(i),Y(x.rhr)];}))+'" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/>';
  S.forEach(function(x,i){ o+='<rect x="'+(X(i)-(Wd-L-R)/n/2)+'" y="'+T+'" width="'+((Wd-L-R)/n)+'" height="'+(H-T-B)+'" fill="transparent"'+tip(x.rhr+" bpm",ddmm(x.d))+'/>'; });
  var ip=S.findIndex(function(x){return x.d===D.paraty.d;}), ia=ip+1;
  if(ip>=0){ o+='<line x1="'+X(ip)+'" x2="'+X(ip)+'" y1="'+T+'" y2="'+(H-B)+'" stroke="var(--accent)" stroke-width="1.2"/><text class="vlr" x="'+(X(ip)-5)+'" y="'+(T+8)+'" text-anchor="end">Paraty</text>'; if(S[ia]) o+='<circle cx="'+X(ia)+'" cy="'+Y(S[ia].rhr)+'" r="5" fill="var(--accent-fill)" stroke="var(--card)" stroke-width="2"/><text class="vl" x="'+(X(ia)+8)+'" y="'+(Y(S[ia].rhr)+4)+'">'+S[ia].rhr+' · dia seguinte</text>'; }
  var lc=last(S), mn7=Math.min.apply(null,S.map(function(x){return x.rhr;}));
  o+='<circle cx="'+X(n-1)+'" cy="'+Y(lc.rhr)+'" r="5" fill="var(--ink)" stroke="var(--card)" stroke-width="2"/><text class="vl" x="'+(X(n-1)+8)+'" y="'+(Y(lc.rhr)+4)+'">'+lc.rhr+(lc.rhr===mn7?' · mínima':'')+'</text>';
  var lm=-1; S.forEach(function(x,i){ var m=parse(x.d).getUTCMonth(); if(m!==lm){ o+='<text class="ax" x="'+X(i)+'" y="'+(H-14)+'">'+MES[m]+'</text>'; lm=m; } });
  return vb(Wd,H,o,"Frequência cardíaca de repouso");
}
function notaCor(n){ return n<60?"var(--e5)":n<80?"var(--e3)":n<90?"var(--g1)":"var(--good)"; }
function sonoChart(){
  var Wd=1000, H=260, L=30, R=8, T=26, B=36, mx=10*60, n=SONO.length, bw=(Wd-L-R)/n, Y=function(m){return T+(1-m/mx)*(H-T-B);}, o="";
  [0,3,6,9].forEach(function(h){ o+='<line class="gl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(h*60)+'" y2="'+Y(h*60)+'"/><text class="ax" x="'+(L-6)+'" y="'+(Y(h*60)+3.5)+'" text-anchor="end">'+h+'h</text>'; });
  o+='<rect x="'+L+'" y="'+Y(480)+'" width="'+(Wd-L-R)+'" height="'+(Y(420)-Y(480))+'" fill="var(--good)" opacity=".2"/><line x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(420)+'" y2="'+Y(420)+'" stroke="var(--good)" stroke-width="1.2"/><line x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(480)+'" y2="'+Y(480)+'" stroke="var(--good)" stroke-width="1.2"/>';
  o+='<line x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(540)+'" y2="'+Y(540)+'" stroke="var(--good)" stroke-width="1.5" stroke-dasharray="6 4"/>';
  var ST=[["Profundo",4,"var(--s-deep)"],["REM",6,"var(--s-rem)"],["Leve",5,"var(--s-light)"],["Acordado",7,"var(--s-awake)"]];
  SONO.forEach(function(s,i){ var w=Math.min(26,bw*.6), x=L+i*bw+(bw-w)/2, yb=Y(0);
    ST.forEach(function(st,k){ var m=s[3]*s[st[1]]/100, h=Y(0)-Y(m); if(h<.5) return; var y=yb-h; o+='<path d="'+(k===ST.length-1?colPath(x,y,w,h-2,4):'M'+x+','+y+'h'+w+'v'+(h-2)+'h-'+w+'z')+'" fill="'+st[2]+'"'+tip(hm(m),st[0]+" · "+ddmm(s[0]))+'/>'; yb=y; });
    o+='<rect x="'+(x+w/2-12)+'" y="'+(yb-19)+'" width="24" height="15" rx="4" fill="'+notaCor(s[1])+'"/><text x="'+(x+w/2)+'" y="'+(yb-8)+'" text-anchor="middle" style="font-size:10.5px;font-weight:700;fill:#fff">'+s[1]+'</text><text class="ax" x="'+(x+w/2)+'" y="'+(Y(0)+14)+'" text-anchor="middle">'+parse(s[0]).getUTCDate()+'</text>'; });
  o+='<line class="bl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(0)+'" y2="'+Y(0)+'"/><text class="ax" x="'+L+'" y="'+(T-12)+'">Nota do sono sobre cada noite · dia de acordar</text>';
  return vb(Wd,H,o,"Sono por fase")+'<div class="legend">'+ST.map(function(s){return '<span><i style="background:'+s[2]+'"></i>'+s[0]+'</span>';}).join("")+'<span><i style="background:var(--good);opacity:.3"></i>Meta 7–8 h</span><span><i class="ln" style="background:var(--good)"></i>9 h · sonho</span><span style="margin-left:6px">Nota:</span><span><i style="background:var(--e5)"></i>&lt; 60</span><span><i style="background:var(--e3)"></i>60–79</span><span><i style="background:var(--g1)"></i>80–89</span><span><i style="background:var(--good)"></i>90+</span></div>';
}
function janelaSono(){
  /* dias no X; relógio no Y, 20h embaixo e 10h em cima. Barra = deitou → levantou. */
  var Wd=480, H=270, L=40, R=104, T=16, B=30, t0=20*60, t1=34*60, n=SONO.length, bw=(Wd-L-R)/n, Y=function(m){return T+(1-(m-t0)/(t1-t0))*(H-T-B);}, o="";
  function mc(h){ var a=h.split(":").map(Number), m=a[0]*60+a[1]; return m<12*60?m+24*60:m; }
  [20,22,24,2,4,6,8,10].forEach(function(h){ var m=(h<12?h+24:h)*60; o+='<line class="gl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(m)+'" y2="'+Y(m)+'"/><text class="ax" x="'+(L-6)+'" y="'+(Y(m)+3.5)+'" text-anchor="end">'+String(h%24).padStart(2,"0")+'h</text>'; });
  /* faixa de acordar 5h–6h e de deitar 21h–22h (8 h de sono) */
  o+='<rect x="'+L+'" y="'+Y(30*60)+'" width="'+(Wd-L-R)+'" height="'+(Y(29*60)-Y(30*60))+'" fill="var(--good)" opacity=".10"/><text class="ax" x="'+(Wd-R+6)+'" y="'+(Y(29.5*60)+3.5)+'" style="fill:var(--good-text)">acordar 5h–6h</text>';
  o+='<rect x="'+L+'" y="'+Y(22*60)+'" width="'+(Wd-L-R)+'" height="'+(Y(21*60)-Y(22*60))+'" fill="var(--good)" opacity=".10"/><text class="ax" x="'+(Wd-R+6)+'" y="'+(Y(21.5*60)+3.5)+'" style="fill:var(--good-text)">deitar 21h–22h · 8 h</text>';
  o+='<line x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(23*60)+'" y2="'+Y(23*60)+'" stroke="var(--accent)" stroke-width="1.2" stroke-dasharray="4 3"/><text class="ax" x="'+(Wd-R+6)+'" y="'+(Y(23*60)+3.5)+'" style="fill:var(--accent)">23h · limite para 7 h</text>';
  SONO.forEach(function(s,i){ var a=mc(s[8]), b=mc(s[9]); if(b<a) b+=24*60; var w=Math.min(16,bw*.5), x=L+i*bw+(bw-w)/2, dur=s[2];
    var cor= dur>=480?'var(--good)': dur>=420?'var(--ink)':'var(--accent-fill)';
    o+='<path d="'+colPath(x,Y(b),w,Y(a)-Y(b),5)+'" fill="'+cor+'"'+tip(s[8]+" → "+s[9]+" · "+hm(dur),ddmm(s[0])+" · nota "+s[1])+'/>';
    o+='<text class="ax" x="'+(x+w/2)+'" y="'+(H-10)+'" text-anchor="middle">'+parse(s[0]).getUTCDate()+'</text>'; });
  return vb(Wd,H,o,"Hora de deitar e de levantar, contra as metas")+'<div class="legend"><span><i style="background:var(--good)"></i>8 h ou mais</span><span><i style="background:var(--ink)"></i>7 a 8 h</span><span><i style="background:var(--accent-fill)"></i>Menos de 7 h</span></div>';
}
function sonoMeta(){
  var ult=SONO.slice(-7), med=mean(ult.map(function(s){return s[2];})), noites8=ult.filter(function(s){return s[2]>=480;}).length, noites7=ult.filter(function(s){return s[2]>=420;}).length;
  var medBed=mean(ult.map(function(s){ var a=s[8].split(":").map(Number), m=a[0]*60+a[1]; return m<12*60?m+24*60:m; })), hb=Math.floor(medBed/60)%24, mb=Math.round(medBed%60);
  return '<div class="stat3"><div><span class="k">Média · 7 noites</span><span class="v">'+hm(med)+'</span><span class="d '+(med>=480?'up':'dn')+'">'+(med>=480?'na meta de 8 h':'faltam '+Math.round(480-med)+' min para 8 h')+'</span></div><div><span class="k">Noites com 8 h+</span><span class="v">'+noites8+'<small> de 7</small></span><span class="d">'+noites7+' com 7 h+</span></div><div><span class="k">Deitou, em média</span><span class="v">'+String(hb).padStart(2,"0")+'h'+String(mb).padStart(2,"0")+'</span><span class="d">meta 21h30 para 8 h às 5h30</span></div></div>'
    +'<div class="tbl"><table><thead><tr><th>Para acordar às</th><th class="n">7 h · mínimo</th><th class="n">8 h · ideal</th><th class="n">9 h · sonho</th></tr></thead><tbody>'+[["5h00","22h00","21h00","20h00"],["5h30","22h30","21h30","20h30"],["6h00","23h00","22h00","21h00"]].map(function(r){return '<tr><td style="font-weight:500">'+r[0]+'</td><td class="n">'+r[1]+'</td><td class="n pr">'+r[2]+'</td><td class="n">'+r[3]+'</td></tr>';}).join("")+'</tbody></table></div>';
}

/* kit */
var KIT_TAB=store("kittab")||"ultimos", FOTOS=store("fotos")||{};
function ring(p,size){ var r=size/2-5, c=2*Math.PI*r, col=p>=.9?"var(--crit)":p>=.75?"var(--warn)":"var(--ink)"; return '<svg viewBox="0 0 '+size+' '+size+'" width="'+size+'" height="'+size+'" aria-hidden="true"><circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="var(--card-3)" stroke-width="6"/><circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="6" stroke-linecap="round" stroke-dasharray="'+(c*Math.min(1,p))+' '+c+'" transform="rotate(-90 '+size/2+' '+size/2+')"/><text x="50%" y="54%" text-anchor="middle" style="font-size:12px;font-weight:600;fill:var(--ink)">'+Math.round(p*100)+'%</text></svg>'; }
function tenisLista(){
  var uso=D.strava.usoTenis, ult=[], seen={};
  Object.keys(uso).sort().reverse().forEach(function(d){ var id=uso[d]; if(!seen[id]){ seen[id]=d; ult.push(id); } });
  var T=D.strava.tenis, byId={}; T.forEach(function(t){ byId[t.id]=t; });
  return {ultimos:ult.map(function(id){ var t=byId[id]; t.ultimo=seen[id]; return t; }).filter(Boolean), todos:T.slice().sort(function(a,b){return b.km-a.km;})};
}
function tenis(publico,tab){
  var L=tenisLista(), lista=tab==="todos"?L.todos:L.ultimos, cap=function(t){return t.tipo==="trilha"?900:t.tipo==="prova"?400:800;};
  var seg='<div class="seg light" role="group"><button type="button" data-kit="ultimos" aria-pressed="'+(tab==="ultimos")+'">Em uso · '+L.ultimos.length+'</button><button type="button" data-kit="todos" aria-pressed="'+(tab==="todos")+'">Todos · '+L.todos.length+'</button></div>';
  var cards='<div class="shoes'+(tab==="todos"?' all':'')+'">'+lista.map(function(t){ var p=t.km/cap(t), img=FOTOS[t.id];
    return '<div class="shoe"><div class="ph">'+(img?'<img alt="'+esc(t.modelo)+'" src="'+img+'">':SHOE)+(publico?'':'<label class="btn mini">'+ic("cam")+'Foto<input class="up" type="file" accept="image/*" data-foto="'+t.id+'"></label>')+'</div>'
      +'<div class="row"><div style="min-width:0;flex:1"><p class="nm" title="'+esc(t.modelo)+'">'+esc(t.modelo)+'</p><p class="br">'+esc(t.marca)+(t.apelido?' · “'+esc(t.apelido)+'”':'')+' · '+(TERRL[t.tipo]||t.tipo)+'</p></div>'+ring(p,52)+'</div>'
      +'<div class="row num"><b style="font-size:19px;font-weight:600;letter-spacing:-.03em">'+thou(t.km)+'</b><span class="lbl">de '+cap(t)+' km estimados</span><span class="sp"></span>'+(t.ultimo?'<span class="lbl">'+ddmm(t.ultimo)+'</span>':'')+'</div></div>'; }).join("")+'</div>';
  return seg+cards+'<p class="note">Quilometragem e nomes vêm do Strava. Vida útil estimada: 800 km rua, 900 km trilha, 400 km de prova.</p>';
}
function usoKit(){
  var it=[["watch","var(--ink)","COROS PACE 3","Relógio · sono, HRV, FC, treinos e o plano no pulso"],["arrow","var(--rua)","Strava","Fitness, esforço relativo, tênis, RPs e treinos públicos"],["iron","var(--trilha)","Academia Ultra · Vila Mariana","Wellhub Silver"],["food","var(--esteira)","MyFitnessPal","Comida, água e peso · via Apple Health"],["drop","var(--accent-fill)","Dobro","Suplementação em treino · o que entra, eu anoto"]];
  return '<div class="list">'+it.map(function(x){return '<div class="li">'+sq(x[1],x[0])+'<div style="min-width:0"><p class="lt">'+x[2]+'</p><p class="ls">'+x[3]+'</p></div></div>';}).join("")+'</div>';
}
function suplementos(){
  var C=["Rodagem","Qualidade","Longão","Força"], R=["Antes","Durante","Depois"], M={"Longão|Durante":["Comer a cada 40 min","Beber pelo relógio"],"Força|Depois":["Proteína"]};
  var cel=function(c,r){ var v=M[c+"|"+r]; return v?v.map(function(x){return '<span class="pill ink" style="margin:2px 4px 2px 0">'+x+'</span>';}).join(""):'<span class="chip ghost" style="font-weight:500">a definir</span>'; };
  var mesa='<div class="tbl lgb"><table><thead><tr><th></th>'+C.map(function(c){return '<th>'+c+'</th>';}).join("")+'</tr></thead><tbody>'+R.map(function(r){ return '<tr><td style="font-weight:500">'+r+'</td>'+C.map(function(c){ return '<td>'+cel(c,r)+'</td>'; }).join("")+'</tr>'; }).join("")+'</tbody></table></div>';
  var lista='<div class="list smb">'+C.map(function(c){ return '<div class="li" style="display:block"><p class="lt" style="margin-bottom:6px">'+c+'</p>'+R.map(function(r){ return '<p class="ls" style="margin:3px 0"><span style="display:inline-block;min-width:58px;color:var(--muted)">'+r+'</span>'+cel(c,r)+'</p>'; }).join("")+'</div>'; }).join("")+'</div>';
  return mesa+lista;
}
function fuelLine(){
  var Wd=640, H=118, L=10, R=14, X=function(m){return L+m/180*(Wd-L-R);}, o='<line x1="'+L+'" x2="'+(Wd-R)+'" y1="60" y2="60" stroke="var(--ink)" stroke-width="2"/>';
  for(var m=0;m<=180;m+=30) o+='<line x1="'+X(m)+'" x2="'+X(m)+'" y1="56" y2="64" stroke="var(--ink)"/><text class="ax" x="'+X(m)+'" y="82" text-anchor="middle">'+(m?hm(m):"0")+'</text>';
  for(var f=40;f<=180;f+=40) o+='<path d="'+colPath(X(f)-9,28,18,22,5)+'" fill="var(--accent-fill)"'+tip("Comer",hm(f))+'/><text class="vlr" x="'+X(f)+'" y="20" text-anchor="middle">'+hm(f)+'</text>';
  for(var g=15;g<=180;g+=15) o+='<circle cx="'+X(g)+'" cy="98" r="5" fill="var(--rua)"'+tip("Beber",hm(g))+'/>';
  o+='<text class="lb" x="'+L+'" y="114">gole a cada 15 min, com ou sem sede</text>';
  return vb(Wd,H,o,"Ensaio de alimentação no longão")+'<div class="legend"><span><i style="background:var(--accent-fill)"></i>Comer · a cada 40 min</span><span><i class="dot" style="background:var(--rua)"></i>Beber · pelo relógio</span></div>';
}

/* força: volume deslocado (Strava) */
var GRP=D.strava.grupo, GCOL={Costas:"var(--rua)",Peito:"var(--accent-fill)",Ombro:"var(--esteira)",Braço:"var(--trilha)",Abdômen:"var(--ink-2)",Lombar:"var(--muted)",Perna:"var(--ink)"};
function volForca(){
  var F=D.strava.forca, Wd=1000, H=250, L=44, R=10, T=20, B=40, bw=(Wd-L-R)/F.length, mx=Math.max(4000,Math.ceil(Math.max.apply(null,F.map(tonelagem))/2000)*2000), Y=function(v){return T+(1-v/mx)*(H-T-B);}, o="";
  for(var g=0;g<=mx;g+=mx/4) o+='<line class="gl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(g)+'" y2="'+Y(g)+'"/><text class="ax" x="'+(L-8)+'" y="'+(Y(g)+3.5)+'" text-anchor="end">'+(g>=1000?(g/1000).toFixed(0)+'t':g)+'</text>';
  F.forEach(function(f,i){ var w=Math.min(28,bw*.55), x=L+i*bw+(bw-w)/2, por={}, tot=0; f.sets.forEach(function(s){ var gk=GRP[s[0]]||"Outro", v=s[1]*s[2]; por[gk]=(por[gk]||0)+v; tot+=v; });
    if(!tot){ o+='<rect x="'+x+'" y="'+(Y(0)-3)+'" width="'+w+'" height="3" rx="1.5" fill="var(--axis)"'+tip("sem carga registrada",ddmm(f.d)+" · "+f.sets.length+" séries")+'/><text class="ax" x="'+(x+w/2)+'" y="'+(Y(0)-8)+'" text-anchor="middle">'+f.sets.length+' séries</text>'; }
    var yb=Y(0); Object.keys(por).sort(function(a,b){return por[b]-por[a];}).forEach(function(gk,k,arr){ var h=Y(0)-Y(por[gk]); if(h<.5) return; var y=yb-h; o+='<path d="'+(k===arr.length-1?colPath(x,y,w,h-2,4):'M'+x+','+y+'h'+w+'v'+Math.max(0,h-2)+'h-'+w+'z')+'" fill="'+(GCOL[gk]||"var(--muted)")+'"'+tip(thou(por[gk])+" kg",gk+" · "+ddmm(f.d))+'/>'; yb=y; });
    if(tot) o+='<text class="vl" x="'+(x+w/2)+'" y="'+(yb-6)+'" text-anchor="middle">'+(tot/1000).toFixed(1)+'t</text>';
    o+='<text class="ax" x="'+(x+w/2)+'" y="'+(Y(0)+14)+'" text-anchor="middle">'+ddmm(f.d)+'</text><text class="ax" x="'+(x+w/2)+'" y="'+(Y(0)+27)+'" text-anchor="middle">'+f.sets.length+' s</text>'; });
  o+='<line class="bl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(0)+'" y2="'+Y(0)+'"/>';
  return vb(Wd,H,o,"Volume de carga deslocada por sessão de força")+'<div class="legend">'+Object.keys(GCOL).filter(function(g){return D.strava.forca.some(function(f){return f.sets.some(function(s){return (GRP[s[0]]||"")===g;});});}).map(function(g){return '<span><i style="background:'+GCOL[g]+'"></i>'+g+'</span>';}).join("")+'</div>';
}
var FAGG=store("fagg")||"semana";
function semanaForca(w){
  w=Math.max(0,Math.min(P.semanas.length-1,w)); var days=[], np=0, nd=0;
  for(var i=0;i<7;i++){ var d=add(P.inicio,w*7+i), pd=plan(d), f=FZ[d]; days.push({d:d,pd:pd,f:f}); if(pd&&pd.fz) np++; if(d<=HOJE&&f) nd++; }
  var o='<div class="week">'+days.map(function(x){ var pd=x.pd, nome=pd&&pd.fz?P.forca[pd.fz].nome:(pd&&pd.prova?pd.prova.c:"Sem força"), feito=!!x.f, st=pd&&pd.prova?"livre":!pd||!pd.fz?(feito?"extra":"livre"):x.d>HOJE?"previsto":x.d===HOJE&&!feito?"hoje":feito?"feito":"nao";
    var ton=x.f?tonelagem(x.f):0, sets=x.f&&x.f.sets?x.f.sets.length:0;
    return '<div class="day'+(x.d===HOJE?' today':'')+'"><div class="dn"><b>'+D7A[D7[i_(x.d)]]+' <span>'+parse(x.d).getUTCDate()+'</span></b></div><p class="wt">'+esc(nome)+'</p><p class="ws"><i style="background:var(--ink)"></i>'+(pd&&pd.fz?pd.fz:'—')+'</p>'
      +'<p class="km num">'+(feito?(ton?'<b>'+(ton/1000).toFixed(1).replace(".",",")+'</b><small>t · '+sets+' séries</small>':'<b>'+(sets||'✓')+'</b><small>'+(sets?'séries':'feita')+'</small>'):'<b>—</b>')+'</p>'
      +'<div class="wbar'+(feito?'':' none')+'"><i style="width:'+(feito?100:0)+'%;background:var(--ink)"></i></div>'
      +'<span class="st"><i style="background:'+EST[st][1]+'"></i>'+EST[st][0]+'</span></div>'; }).join("")+'</div>';
  function i_(d){ return (parse(d).getUTCDay()+6)%7; }
  var sem=P.semanas[w];
  return '<div class="ch"><h2>Semana '+(w+1)+' <span class="m">de 25 · força</span></h2><div class="r"><button class="ico" data-wk="'+(w-1)+'" aria-label="Semana anterior" style="width:28px;height:28px">‹</button><button class="ico" data-wk="'+(w+1)+'" aria-label="Próxima semana" style="width:28px;height:28px">›</button></div></div><div class="wsum"><div><b class="num">'+nd+'</b><span>de '+np+' sessões</span></div><div><span class="lbl">'+esc(sem.dt)+'</span></div></div>'+o;
}
function forcaAgg(){
  var F=D.strava.forca.slice().sort(function(a,b){return a.d<b.d?-1:1;}), G={}, ord=[];
  F.forEach(function(f){ var k= FAGG==="treino"?f.d: FAGG==="semana"?add(f.d,-((parse(f.d).getUTCDay()+6)%7)): FAGG==="mes"?f.d.slice(0,7):"ciclo"; if(!G[k]){ G[k]={k:k,t:0,s:0,n:0}; ord.push(k); } G[k].t+=tonelagem(f); G[k].s+=f.sets?f.sets.length:0; G[k].n++; });
  var rows=ord.map(function(k){return G[k];}), n=rows.length, Wd=1000, H=240, L=44, R=10, T=20, B=42, bw=(Wd-L-R)/Math.max(n,1), mx=Math.max(2000,Math.ceil(Math.max.apply(null,rows.map(function(r){return r.t;}))/2000)*2000), Y=function(v){return T+(1-v/mx)*(H-T-B);}, o="";
  for(var g=0;g<=mx;g+=mx/4) o+='<line class="gl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(g)+'" y2="'+Y(g)+'"/><text class="ax" x="'+(L-8)+'" y="'+(Y(g)+3.5)+'" text-anchor="end">'+(g>=1000?(g/1000)+'t':g)+'</text>';
  rows.forEach(function(r,i){ var w=Math.min(60,bw*.55), x=L+i*bw+(bw-w)/2, lab= FAGG==="treino"?ddmm(r.k): FAGG==="semana"?"sem. "+ddmm(r.k): FAGG==="mes"?MES[+r.k.slice(5,7)-1]+"/"+r.k.slice(2,4):"ciclo";
    o+='<path d="'+colPath(x,Y(r.t),w,Y(0)-Y(r.t),4)+'" fill="var(--ink)"'+tip(thou(r.t)+" kg deslocados",lab+" · "+r.s+" séries · "+r.n+(r.n>1?" sessões":" sessão"))+'/><text class="vl" x="'+(x+w/2)+'" y="'+(Y(r.t)-6)+'" text-anchor="middle">'+(r.t?(r.t/1000).toFixed(1).replace(".",",")+'t':'—')+'</text><text class="ax" x="'+(x+w/2)+'" y="'+(Y(0)+14)+'" text-anchor="middle">'+lab+'</text><text class="ax" x="'+(x+w/2)+'" y="'+(Y(0)+27)+'" text-anchor="middle">'+r.s+' s</text>'; });
  o+='<line class="bl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(0)+'" y2="'+Y(0)+'"/>';
  var tot=rows.reduce(function(m,r){return m+r.t;},0), sets=rows.reduce(function(m,r){return m+r.s;},0), ns=F.length;
  var seg='<div class="seg light" role="group" aria-label="Agrupar">'+[["treino","Treino"],["semana","Semana"],["mes","Mês"],["ciclo","Ciclo"]].map(function(x){return '<button type="button" data-fagg="'+x[0]+'" aria-pressed="'+(FAGG===x[0])+'">'+x[1]+'</button>';}).join("")+'</div>';
  var st='<div class="stat3"><div><span class="k">Carga deslocada</span><span class="v">'+(tot/1000).toFixed(1).replace(".",",")+'<small> t</small></span><span class="d">'+ns+' sessões registradas</span></div><div><span class="k">Séries</span><span class="v">'+sets+'</span><span class="d">'+(ns?Math.round(sets/ns):0)+' por sessão</span></div><div><span class="k">Média por sessão</span><span class="v">'+(ns?(tot/ns/1000).toFixed(1).replace(".",","):'—')+'<small> t</small></span><span class="d">kg × repetições</span></div><div><span class="k">Maior sessão</span><span class="v">'+(ns?(Math.max.apply(null,F.map(tonelagem))/1000).toFixed(1).replace(".",","):'—')+'<small> t</small></span><span class="d">no registro</span></div></div>';
  return '<div class="ch" style="margin-top:-6px"><span class="m">kg × repetições, do Strava</span><div class="r">'+seg+'</div></div>'+st+vb(Wd,H,o,"Carga deslocada e séries por "+FAGG);
}
var FABRE={};
function forcaLog(){
  var F=D.strava.forca.slice().sort(function(a,b){return a.d<b.d?1:-1;});
  if(!F.length) return '<p class="lbl">Sem sessão registrada ainda.</p>';
  return '<div class="list">'+F.map(function(f){ var pd=plan(f.d), nome=pd&&pd.fz?P.forca[pd.fz].nome:"Força", ton=tonelagem(f), ex={}, ordem=[]; (f.sets||[]).forEach(function(s){ if(!ex[s[0]]){ ex[s[0]]=[]; ordem.push(s[0]); } ex[s[0]].push(s[1]?s[1]+"×"+s[2]:s[2]+" rep"); });
    var grupos={}; (f.sets||[]).forEach(function(s){ var g=GRP[s[0]]||"Outro"; grupos[g]=(grupos[g]||0)+s[1]*s[2]; }); var gl=Object.keys(grupos).sort(function(a,b){return grupos[b]-grupos[a];}).slice(0,3).join(" · ");
    var ab=FABRE[f.d];
    return '<div class="li" style="grid-template-columns:auto 1fr auto;align-items:start"><span class="sq" style="background:var(--ink)">'+ic("iron")+'</span><div style="min-width:0"><p class="lt">'+esc(nome)+' <span class="lbl">'+D7A[dow(f.d)]+' '+ddmm(f.d)+'</span></p><p class="ls">'+(f.sets?f.sets.length+' séries · '+(ton?thou(ton)+' kg · ':'sem carga anotada · ')+esc(gl):'sem séries anotadas')+'</p>'
      +(ab?'<div class="reg" style="margin-top:8px;padding:8px 10px;border-radius:8px;background:var(--card-2);font-size:12.5px">'+ordem.map(function(e){return '<div><b>'+esc(e)+'</b> '+ex[e].join(", ")+'</div>';}).join("")+'</div>':'')
      +'</div><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">'+(f.sets?'<button class="btn mini" data-fabre="'+f.d+'">'+(ab?'Fechar':'Séries')+'</button>':'')+(f.id?'<a class="btn mini" href="https://www.strava.com/activities/'+f.id+'" target="_blank" rel="noopener">Strava '+ic("arrow")+'</a>':'')+'</div></div>'; }).join("")+'</div>';
}
function volGrupo(){
  var por={}, sets={}; D.strava.forca.forEach(function(f){ f.sets.forEach(function(s){ var g=GRP[s[0]]||"Outro"; por[g]=(por[g]||0)+s[1]*s[2]; sets[g]=(sets[g]||0)+1; }); });
  var ks=Object.keys(por).sort(function(a,b){return por[b]-por[a];}), mx=por[ks[0]]||1;
  return '<div class="list">'+ks.map(function(g){ return '<div class="li" style="grid-template-columns:1fr auto"><div style="min-width:0"><div class="row" style="justify-content:space-between"><span class="row"><i style="width:10px;height:10px;border-radius:3px;background:'+(GCOL[g]||"var(--muted)")+'"></i><b style="font-size:13.5px">'+g+'</b></span><span class="lbl num">'+sets[g]+' séries</span></div><div class="meter" style="margin-top:6px"><i style="width:'+(por[g]/mx*100)+'%;background:'+(GCOL[g]||"var(--muted)")+'"></i></div></div><span class="num" style="font-size:16px;font-weight:600">'+(por[g]>=1000?(por[g]/1000).toFixed(1)+' t':thou(por[g])+' kg')+'</span></div>'; }).join("")+'</div><p class="note">Carga × repetições, do que o Strava registrou. Sessão de 29/09 sem carga anotada.</p>';
}
function seriesForca(){
  var F=D.strava.forca, Wd=1000, H=220, L=34, R=10, T=16, B=36, mx=40, bw=(Wd-L-R)/F.length, Y=function(v){return T+(1-v/mx)*(H-T-B);}, o="";
  [0,10,20,30,40].forEach(function(v){ o+='<line class="gl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(v)+'" y2="'+Y(v)+'"/><text class="ax" x="'+(L-8)+'" y="'+(Y(v)+3.5)+'" text-anchor="end">'+v+'</text>'; });
  F.forEach(function(f,i){ var w=Math.min(24,bw*.5), x=L+i*bw+(bw-w)/2, n=f.sets.length, cyc=f.d>=P.inicio; o+='<path d="'+colPath(x,Y(n),w,Y(0)-Y(n))+'" fill="'+(cyc?'var(--ink)':'var(--axis)')+'"'+tip(n+" séries",D7A[dow(f.d)]+" "+ddmm(f.d))+'/><text class="vl" x="'+(x+w/2)+'" y="'+(Y(n)-6)+'" text-anchor="middle">'+n+'</text><text class="ax" x="'+(x+w/2)+'" y="'+(Y(0)+14)+'" text-anchor="middle">'+ddmm(f.d)+'</text>'; });
  o+='<line x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(17)+'" y2="'+Y(17)+'" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="5 4"/><text class="vlr" x="'+(L+6)+'" y="'+(Y(17)-6)+'">prescrito · 17 por sessão</text><line class="bl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(0)+'" y2="'+Y(0)+'"/>';
  return vb(Wd,H,o,"Séries por sessão")+'<div class="legend"><span><i style="background:var(--axis)"></i>Antes do ciclo</span><span><i style="background:var(--ink)"></i>No ciclo</span><span><i class="ln" style="background:var(--accent)"></i>Prescrição</span></div>';
}

/* agenda */
var MES_VER=store("mes")||HOJE.slice(0,7);
function mes(){
  var y=+MES_VER.slice(0,4), m=+MES_VER.slice(5,7)-1, first=MES_VER+"-01", off=(parse(first).getUTCDay()+6)%7, days=new Date(Date.UTC(y,m+1,0)).getUTCDate(), o="", tk=0;
  D7.forEach(function(d){ o+='<div class="wd">'+D7A[d]+'</div>'; }); for(var i=0;i<off;i++) o+='<div class="md out"></div>';
  for(var dd=1;dd<=days;dd++){ var ds=MES_VER+"-"+String(dd).padStart(2,"0"), pd=plan(ds), pv=D.provas.filter(function(p){return p.d===ds;})[0], done=ds<=HOJE?runKm(ds):0, st=ds<=HOJE?setsOn(ds):0, inner='<span class="d">'+dd+'</span>';
    if(pv) inner+='<span class="tx" style="color:var(--good-text);font-weight:600">'+esc(pv.c)+' · '+(pv.km||"?")+' km</span>';
    else if(pd){ var km=done||pd.km; tk+=pd.km; if(pd.c) inner+='<span class="rk" style="width:'+Math.max(12,Math.min(100,km/26*100))+'%;background:'+TERR[runTerr(ds)||pd.t]+';opacity:'+(ds<=HOJE?1:.45)+'"'+tip(k1(km)+" km",(done?"rodado · ":"previsto · ")+pd.c.n)+'></span><span class="tx">'+esc(pd.c.n)+'</span>'; if(pd.fz) inner+='<span class="tx" style="color:var(--muted)">'+pd.fz+(st?' · '+st+' s':'')+'</span>'; }
    o+='<div class="md'+(ds===HOJE?' today':'')+(pv?' race':'')+'">'+inner+'</div>'; }
  return '<div class="ch"><h2 style="text-transform:capitalize">'+MESL[m]+' '+y+'</h2><div class="r"><span class="m num">'+thou(tk)+' km previstos</span><button class="ico" data-mes="-1" aria-label="Mês anterior" style="width:28px;height:28px">‹</button><button class="ico" data-mes="1" aria-label="Próximo mês" style="width:28px;height:28px">›</button></div></div><div class="mgrid">'+o+'</div><div class="legend"><span><i style="background:var(--rua)"></i>Rua</span><span><i style="background:var(--esteira)"></i>Esteira</span><span><i style="background:var(--trilha)"></i>Trilha</span><span><i style="background:var(--good-wash);outline:1px solid var(--good)"></i>Prova</span><span>Barra clara = previsto</span></div>';
}
function proximas(){
  return '<div class="list">'+PROX.map(function(p){ var dd=diff(HOJE,p.d); return '<div class="li"><span class="sq" style="background:'+(p.cls==="A"?'var(--accent-fill)':'var(--card-3)')+';color:'+(p.cls==="A"?'#fff':'var(--ink)')+';font-size:11px;font-weight:700">'+p.cls+'</span><div style="min-width:0"><p class="lt">'+esc(p.n)+'</p><p class="ls">'+ddmm(p.d)+(p.km?' · '+k1(p.km)+' km':'')+(p.dplus?' · '+thou(p.dplus)+' m D+':'')+' · '+esc(p.meta)+'</p><div class="meter"><i style="width:'+Math.max(3,100-dd/330*100)+'%;background:'+(p.cls==="A"?'var(--accent-fill)':'var(--ink)')+'"></i></div></div><span class="num" style="font-size:18px;font-weight:600;letter-spacing:-.03em">'+dd+'<span class="lbl"> d</span></span></div>'; }).join("")+'</div>';
}
function temporada(){
  var a="2026-10-01", b="2027-09-30", Wd=1000, H=160, L=8, R=8, tot=diff(a,b), X=function(d){return L+diff(a,d)/tot*(Wd-L-R);}, o="";
  for(var i=0;i<12;i++){ var ms=iso(new Date(Date.UTC(2026,9+i,1))); o+='<line class="gl" x1="'+X(ms)+'" x2="'+X(ms)+'" y1="20" y2="136"/><text class="ax" x="'+(X(ms)+4)+'" y="150">'+MES[(9+i)%12]+'</text>'; }
  o+='<rect x="'+X(a)+'" y="56" width="'+(X(FIM)-X(a))+'" height="22" rx="5" fill="var(--ink)"'+tip("Ciclo da Indomit","28/09 → 21/03 · 25 semanas")+'/><text x="'+X("2026-10-05")+'" y="71" style="font-size:11.5px;font-weight:600;fill:var(--card)">Ciclo da Indomit · 25 semanas</text>';
  o+='<rect x="'+X("2027-03-22")+'" y="56" width="'+(X("2027-08-13")-X("2027-03-22"))+'" height="22" rx="5" fill="none" stroke="var(--ink)" stroke-dasharray="4 3"'+tip("Ciclo da La Misión","a montar no coach")+'/><text x="'+X("2027-03-29")+'" y="71" style="font-size:11.5px;font-weight:500;fill:var(--ink-2)">Ciclo da La Misión · a montar</text>';
  D.provas.forEach(function(p,i){ var x=X(p.d), y=p.cls==="A"?34:(i%2?108:124), r=p.cls==="A"?8:6; o+='<line x1="'+x+'" x2="'+x+'" y1="'+(p.cls==="A"?42:82)+'" y2="'+(p.cls==="A"?56:y-6)+'" stroke="var(--axis)"/><circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+(p.cls==="A"?'var(--accent-fill)':p.cls==="?"?'var(--card)':'var(--ink)')+'" stroke="'+(p.cls==="?"?'var(--ink)':'var(--card)')+'" stroke-width="2"'+tip(p.n,ddmm(p.d)+(p.km?" · "+k1(p.km)+" km":"")+" · "+p.meta)+'/><text class="'+(p.cls==="A"?'vlr':'lb')+'" x="'+(x+(p.cls==="A"?12:9))+'" y="'+(y+4)+'">'+esc(p.c)+'</text>'; });
  var tx=X(HOJE); o+='<line x1="'+tx+'" x2="'+tx+'" y1="14" y2="136" stroke="var(--accent)" stroke-width="1.5"/><text class="vlr" x="'+(tx+4)+'" y="14">hoje</text>';
  return vb(Wd,H,o,"Temporada 2026–27")+'<div class="legend"><span><i class="dot" style="background:var(--accent-fill)"></i>Prova A</span><span><i class="dot" style="background:var(--ink)"></i>Prova B ou C</span><span><i class="rg dot" style="border-color:var(--ink)"></i>A definir</span></div>';
}

/* vitrine */
function topo(){
  var Wd=1200, H=420, o='<rect width="'+Wd+'" height="'+H+'" fill="#111110"/>', seed=7; function rnd(){ seed=(seed*16807)%2147483647; return seed/2147483647; }
  [[820,220,1],[430,300,.7],[1040,110,.55]].forEach(function(pk){ var ph=[rnd()*6,rnd()*6,rnd()*6]; for(var k=1;k<=16;k++){ var base=k*24*pk[2]+8, d=""; for(var t=0;t<=64;t++){ var a=t/64*Math.PI*2, rr=base*(1+.16*Math.sin(3*a+ph[0])+.08*Math.sin(5*a+ph[1])+.05*Math.sin(7*a+ph[2])); d+=(t?"L":"M")+(pk[0]+rr*Math.cos(a)*1.55).toFixed(1)+","+(pk[1]+rr*Math.sin(a)).toFixed(1); } o+='<path d="'+d+'Z" fill="none" stroke="#F4F3EE" stroke-opacity="'+(k%4===0?.34:.13)+'" stroke-width="'+(k%4===0?1.4:1)+'"/>'; } });
  o+='<circle cx="820" cy="220" r="9" fill="#EF4F3A"/><circle cx="820" cy="220" r="22" fill="none" stroke="#EF4F3A" stroke-opacity=".5"/>';
  return '<svg viewBox="0 0 '+Wd+' '+H+'" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true">'+o+'</svg>';
}
var PV=store("prova")||NEXT.c;
function provaSeg(p){ return '<div class="seg light multi provas" role="group" aria-label="Prova">'+D.provas.map(function(q){return '<button type="button" data-prova="'+esc(q.c)+'" aria-pressed="'+(q.c===p.c)+'">'+esc(q.c)+(q.cls==="A"?' <i></i>':'')+'</button>';}).join("")+'</div>'; }
function provaCard(p){
  var c=parts(alvoTs(p)), key=p.c==="Indomit"?"indomit":p.c==="La Misión"?"mision":null, planAte=0, feito=0;
  for(var d=P.inicio; d<p.d&&d<=FIM; d=add(d,1)){ var pd=plan(d); if(pd) planAte+=pd.km; if(d<=HOJE) feito+=runKm(d); }
  var alem=p.d>FIM, cl=p.clima, proj="";
  if(p.c==="Rio 21K"||p.c==="POA 42K"){ var kk=p.c==="Rio 21K"?"21k":"42k", t0=FIT.prev[kk]; proj='<span class="v">'+clock(t0)+'</span><span class="d">o relógio projeta hoje · meta '+clock(p.meta_s)+(t0>p.meta_s?' · faltam '+clock(t0-p.meta_s):' · dentro da meta')+'</span>'; }
  else if(key){ var pf=D.perfis[key], kme=pf.km+pf.dplus/100, pa=D.paraty, rate=pa.t/(pa.km+pa.dplus/100), need=p.meta_s/kme; proj='<span class="v">'+pace(need)+'<small> /km-e</small></span><span class="d">o que a meta pede · Paraty foi '+pace(rate)+' · '+Math.round((1-need/rate)*100)+'% mais rápido</span>'; }
  else proj='<span class="v">—</span><span class="d">sem projeção ainda</span>';
  var o='<div class="ch"><h2>'+esc(p.n)+'</h2><span class="m">'+dataLonga(p.d)+(p.hora?' · largada '+p.hora:'')+(p.lugar?' · '+esc(p.lugar):'')+'</span></div>';
  o+='<div class="rc"><div class="rc-a"><div class="chips2" style="margin-top:0">'+(p.km?'<span>'+k1(p.km)+' km</span>':'<span>distância a definir</span>')+(p.dplus?'<span>'+thou(p.dplus)+' m D+</span>':'')+'<span>meta · '+esc(p.meta)+'</span><span>prova '+esc(p.cls)+'</span></div>'
    +'<p class="note" style="margin-top:10px">'+(p.cls==="A"?'Prova A: é para ela que o ciclo aponta.':p.cls==="B"?'Prova B: aferição no meio do caminho, sem polimento.':p.cls==="C"?'Prova C: participação, sem meta de tempo.':'Participação a confirmar.')+'</p></div>'
    +'<div class="rc-b stat3"><div><span class="k">Rodado até a prova</span><span class="v">'+k1(feito)+'<small> de '+thou(planAte)+' km</small></span><span class="d">'+(alem?'do ciclo da Indomit · o da La Misión é montado depois':'planejado até '+ddmm(p.d))+'</span></div>'
    +'<div><span class="k">Clima esperado</span>'+(cl?'<span class="v">'+Math.round(cl.tmin)+'–'+Math.round(cl.tmax)+'<small> °C</small></span><span class="d">chuva em '+cl.chuva_pct+'% dos dias · umidade '+cl.umidade+'% · '+cl.anos+' na semana da prova</span>':'<span class="v">—</span><span class="d">sem histórico</span>')+'</div>'
    +'<div><span class="k">Projeção</span>'+proj+'</div></div></div>';
  o+=key?'<div style="margin-top:14px">'+percurso(key,200,true)+'</div><p class="note">Traçado oficial ('+esc(D.perfis[key].fonte.split(" · ")[0])+'). '+esc(D.perfis[key].terreno)+'.</p>':'<p class="note" style="margin-top:10px">Sem traçado oficial cadastrado para esta prova.</p>';
  return o;
}
var ART={"UTMB":"ao"};
function heroBlock(p){
  var c=parts(alvoTs(p)), foto=FOTOS.hero, lm=D.provas.filter(function(q){return q.c==="La Misión";})[0];
  return '<section class="hero"><div class="bg">'+(foto?'<img alt="Gabriel treinando" src="'+foto+'">':topo())+'</div><div class="shade"></div><div class="swap"><label class="btn mini">'+ic("cam")+(foto?'Trocar foto':'Colocar foto')+'<input class="up" type="file" accept="image/*" data-foto="hero"></label></div>'
    +'<div class="tx"><div><p class="eb">Gabriel Mendes · trail e ultra · São Paulo · '+saudacao().toLowerCase()+', visitante</p><h1>Rumo '+(ART[p.c]||"à")+' <em>'+esc(p.c)+'</em></h1><div class="chips"><span>'+esc(p.n)+'</span><span>'+ddmm(p.d)+(p.hora?' · '+p.hora:'')+'</span>'+(p.km?'<span>'+k1(p.km)+' km'+(p.dplus?' · '+thou(p.dplus)+' m D+':'')+'</span>':'')+'<span>meta · '+esc(p.meta)+'</span>'+(p.c!=="La Misión"&&lm?'<span>o alvo do ano: La Misión em '+parts(alvoTs(lm)).d+' dias</span>':'')+'</div><div class="chips" style="margin-top:8px"><a class="btn" href="https://www.instagram.com/'+esc(D.atleta.ig)+'/" target="_blank" rel="noopener" style="background:rgba(255,255,255,.14);color:#fff;border-color:rgba(255,255,255,.3)">'+ic("ig")+'Instagram</a><a class="btn" href="https://www.strava.com/athletes/'+esc(D.atleta.strava||"")+'" target="_blank" rel="noopener" style="background:rgba(255,255,255,.14);color:#fff;border-color:rgba(255,255,255,.3)">'+ic("arrow")+'Strava</a></div></div>'
    +'<div class="cds num">'+[["d",c.d,"dias"],["h",c.h,"horas"],["m",c.m,"min"],["s",c.s,"seg"]].map(function(x){return '<div class="cd"><b data-cd="'+x[0]+':'+p.d+'">'+(x[0]==="d"?x[1]:String(x[1]).padStart(2,"0"))+'</b><span>'+x[2]+'</span></div>';}).join("")+'</div></div></section>';
}
function destaques(){
  var s=last(SONO), h=hrvHoje(), fz=last(serieFit(FSRC)), sh=sonoHoje();
  var it=[["Fitness",fz.f.toFixed(0),'forma '+(fz.f-fz.a>=0?'+':'')+(fz.f-fz.a).toFixed(0)+' · fadiga '+fz.a.toFixed(0),spark(serieFit(FSRC).slice(-30).map(function(x){return x.f;}),200,30,"var(--ink)","var(--accent-fill)")],
    ["HRV da noite",(h?h.v:"—")+'<small style="font-size:14px;color:var(--muted)"> ms</small>',h?h.sit+' do normal · '+(fresco(h.d)?'hoje':ddmm(h.d)):'sem leitura',spark(WH.slice(-14).map(function(x){return x.hrv;}),200,30,"var(--good)")],
    ["Sono",sh&&sh.nota!=null?String(sh.nota):(sh?hm(sh.min):"—"),sh?(sh.nota!=null?hm(sh.min)+' dormindo':'dormindo')+' · '+(fresco(sh.d)?'hoje':ddmm(sh.d)):'sem leitura',spark(W.filter(function(x){return x.sono!=null;}).slice(-14).map(function(x){return Math.round(x.sono/6)/10;}),200,30,"var(--s-rem)")],
    ["Prontidão",String(PRON.n),NIV[PRON.n][0]+' · '+NIV[PRON.n][2].toLowerCase(),''],
    ["FC de repouso",last(W.filter(function(x){return x.rhr!=null;})).rhr+'<small style="font-size:14px;color:var(--muted)"> bpm</small>','mínima do registro',spark(W.filter(function(x){return x.rhr!=null;}).slice(-14).map(function(x){return x.rhr;}),200,30,"var(--ink)")],
    ["VO₂max",String(FIT.vo2),'limiar '+FIT.limiar+'/km · COROS','']];
  return '<div class="hl-grid">'+it.map(function(x){return '<div class="hl"><span class="lbl"><i></i>'+x[0]+'</span><p class="mid">'+x[1]+'</p><span class="lbl">'+x[2]+'</span>'+x[3]+'</div>';}).join("")+'</div>';
}

function treinosPublicos(){
  var rs=A.filter(function(a){return RUN[a.t]&&a.km>2;}).slice().reverse().slice(0,6), links=D.strava.corridasStrava;
  return '<div class="list">'+rs.map(function(a){ var id=links[a.d]; return '<div class="li"><span class="sq" style="background:'+TERR[a.t]+';width:56px;height:56px;border-radius:12px;flex-direction:column;font-size:15px;font-weight:600;letter-spacing:-.02em">'+k1(a.km)+'<small style="font-size:9.5px;opacity:.8">km</small></span><div style="min-width:0"><p class="lt">'+esc(a.n||TERRL[a.t])+'</p><p class="ls">'+pace(a.min*60/a.km)+'/km · FC '+(a.hr||"—")+(a.dplus?' · '+thou(a.dplus)+' m D+':'')+' · carga '+(a.load||0)+'</p></div>'+(id?'<a class="btn mini" href="https://www.strava.com/activities/'+id+'" target="_blank" rel="noopener">Strava '+ic("arrow")+'</a>':'<span class="lbl">'+ddmm(a.d)+'</span>')+'</div>'; }).join("")+'</div>';
}
function instagram(){ var o='<div class="ig">'; for(var i=0;i<6;i++) o+='<a href="https://www.instagram.com/mendesgabriell/" target="_blank" rel="noopener" aria-label="Abrir Instagram">'+ic(i%2?"mtn":"ig")+'</a>'; return o+'</div><a class="btn dark" href="https://www.instagram.com/mendesgabriell/" target="_blank" rel="noopener" style="align-self:flex-start">Seguir @mendesgabriell '+ic("arrow")+'</a>'; }
function comoFunciona(){
  var t=[["Método","Mede antes de opinar","Prontidão, fitness, fadiga e forma saem de regra fixa sobre o dado do relógio. O modelo lê o número; não inventa."],
    ["Viés 1","Força como fisiculturista","Musculação pesada seis vezes por semana, com isoladores e volume alto. O objetivo é o corpo de 2023, não só a prova."],
    ["Viés 2","Cardio extra todo dia de academia","20 a 30 minutos de esteira inclinada abaixo de 120 bpm, antes ou depois do ferro. Oxidação de gordura e perna de subida."],
    ["Viés 3","Trilha só no fim de semana","Durante a semana a subida é na esteira. O terreno técnico mora no Votu, aos sábados."],
    ["Auditoria","Previsto contra realizado, todo dia","Cada sessão é comparada ao prescrito. Rápido demais em dia leve conta como fora do alvo."],
    ["Regra","Caminhada não é treino","Entra no registro, sai do volume. Km de corrida é só corrida."]];
  return '<div class="principios">'+t.map(function(x){return '<div class="pr"><p class="n">'+x[0]+'</p><p class="t">'+x[1]+'</p><p>'+x[2]+'</p></div>';}).join("")+'</div>';
}

/* =========================================================================
   TELAS
   ========================================================================= */
var WK=Math.max(0,Math.min(24,semIdx(HOJE))), TR_TAB=QS.get("tr")||store("trtab")||"corrida";
function secao(n,t,sub){ return '<div class="sec"><span class="n">'+n+'</span><h2>'+t+'</h2>'+(sub?'<p>'+sub+'</p>':'')+'</div>'; }
function vHoje(){
  var pd=plan(HOJE), w=WK, sem=P.semanas[w], sn=sonoHoje(), fz=last(serieFit(FSRC)), nr=nutriRows(), nh=nr[nr.length-1];
  var k=kpi("flag","Próxima prova",'<span data-cd="d:'+NEXT.d+'">'+parts(alvoTs(NEXT)).d+'</span>',"dias · "+esc(NEXT.c),'','var(--accent)')
    +kpi("bolt","Prontidão",PRON.n,NIV[PRON.n][0],'','var(--good-text)')
    +kpi("pulse","Fitness",fz.f.toFixed(0),"forma "+(fz.f-fz.a>=0?"+":"")+(fz.f-fz.a).toFixed(0))
    +kpi("moon","Sono",sn?(sn.nota!=null?sn.nota:hm(sn.min)):"—",sn?(sn.nota!=null?hm(sn.min):"")+(fresco(sn.d)?"":" · "+ddmm(sn.d)):"sem leitura",'','var(--s-rem)')
    +kpi("food","Comida",nh&&nh.kcal!=null?Math.round(nh.kcal).toLocaleString("pt-BR"):"—",nh&&nh.kcal!=null?"kcal":"sem registro")
    +kpi("drop","Água",nh&&nh.agua!=null?(nh.agua/1000).toFixed(1).replace(".",",")+" L":"—",nh&&nh.agua!=null?"MyFitnessPal":"sem registro",'','var(--rua)');
  return hello(saudacao()+", Gabriel",dataLonga(HOJE)+" · Semana "+(w+1)+" de 25 · "+sem.b+" "+blocoNome(sem.b),k)
    +'<div class="grid">'
    +secao("01","Agora","o treino do dia, decidido pelo relógio")
    +card("c7","Treino de hoje",sessoes(pd),pd?pd.bloco+" · "+blocoNome(pd.bloco):"")
    +'<article class="card c5" id="pront">'+prontCard()+'</article>'
    +secao("02","A semana","previsto contra realizado, e o que precisa de você")
    +'<article class="card c8" id="semcard">'+semana(WK)+'</article>'
    +card("c4","Precisa de você",atencao())
    +secao("03","Tendência","fitness, esforço e comida")
    +'<article class="card c8"><div class="ch"><h2>Fitness e forma</h2><div class="r">'+fitnessPer()+'</div></div>'+fitnessStats()+fitness(240)+'</article>'
    +card("c4","Nutrição de hoje",nutriHoje(),nr.length?"MyFitnessPal":"sem registro")
    +card("c8","Carga por dia",heatCiclo(),"carga do dia: corrida + força + caminhada · prova em verde")
    +card("c4","Esforço por semana",reSemanal(),"Strava · 12 semanas")
    +'</div>';
}
function vTreino(){
  var w=WK, wd=semanaDone(w), seg='<div class="seg" role="group" aria-label="Corrida ou força"><button type="button" data-tr="corrida" aria-pressed="'+(TR_TAB==="corrida")+'">Corrida</button><button type="button" data-tr="forca" aria-pressed="'+(TR_TAB==="forca")+'">Força</button></div>';
  if(TR_TAB==="corrida"){
    var k=kpi("run","Semana",k1(wd),"de "+P.semanas[w].km+" km",'','var(--rua)')+kpi("mtn","Ciclo",k1(KM_CICLO),"de "+thou(PLAN_KM)+" km")+kpi("incl","Limiar · relógio",FIT.limiar,"/km",'<span class="pill">espirométrico a marcar</span>')+kpi("flag","Próxima prova",diff(HOJE,NEXT.d),"dias · "+NEXT.c,'','var(--accent)');
    return hello("Treino · corrida","Semana "+(w+1)+" de 25 · "+P.semanas[w].b+" "+blocoNome(P.semanas[w].b),k)+'<div style="margin-bottom:14px">'+seg+'</div><div class="grid">'
      +card("c5","Treino de hoje",sessoes(plan(HOJE),false,"c"),dataLonga(HOJE))
      +'<article class="card c7" id="semcard">'+semana(WK)+'</article>'
      +card("c12","Calendário do bloco",periodizacao(200,true),"25 semanas · marcos e provas")
      +card("c8","Volume semanal",volume(230),"km")+card("c4","Terreno",terreno())
      +card("c12","Previsto × realizado",auditoria(10,"c"),"últimos 10 dias")+'</div>';
  }
  var F=D.strava.forca.filter(function(f){return f.d>=P.inicio;}), feitas=Object.keys(FZ).filter(function(d){return d>=P.inicio&&d<=HOJE;}).length, plan10=0; for(var d=P.inicio;d<=HOJE;d=add(d,1)){ var pd=plan(d); if(pd&&pd.fz) plan10++; }
  var tot=F.reduce(function(s,f){return s+tonelagem(f);},0), sets=F.reduce(function(s,f){return s+(f.sets?f.sets.length:0);},0), planTot=0; P.semanas.forEach(function(s,i){ s.d.forEach(function(x,j){ var fz=x[5]!==null?(x[5]||null):P.forcaDia[D7[j]]; if(fz&&P.forca[fz]&&!provaEm(add(P.inicio,i*7+j))) planTot++; }); });
  var k2=kpi("iron","Sessões no ciclo",feitas,"de "+plan10+" previstas até hoje",'<span class="pill">'+planTot+' no ciclo</span>')+kpi("bolt","Séries no ciclo",sets,"")+kpi("scale","Carga deslocada",(tot/1000).toFixed(1).replace(".",","),"t no ciclo")+kpi("mtn","Média por sessão",F.length?(tot/F.length/1000).toFixed(1).replace(".",","):"—","t");
  return hello("Treino · força","Rodízio de seis, abdominal todo dia",k2)+'<div style="margin-bottom:14px">'+seg+'</div><div class="grid">'
    +card("c5","Força de hoje",sessoes(plan(HOJE),false,"f"),dataLonga(HOJE))
    +'<article class="card c7" id="semcard" data-forca="1">'+semanaForca(WK)+'</article>'
    +'<article class="card c8"><div class="ch"><h2>Carga deslocada e séries</h2></div>'+forcaAgg()+'</article>'+card("c4","Por grupo muscular",volGrupo(),"no registro")
    +card("c7","Histórico de sessões",forcaLog(),"Strava · entra na sessão")+card("c5","Previsto × realizado",auditoria(10,"f"),"últimos 10 dias")+'</div>';
}
function vCiclo(){
  var w=WK, k=kpi("cal","Semana",w+1,"de 25")+kpi("mtn","Planejado",thou(PLAN_KM),"km até a Indomit")+kpi("run","Rodado",k1(KM_CICLO),"km",'','var(--rua)')+kpi("flag","Do caminho",k1(PCT*100),"%",'','var(--accent)');
  return hello("O ciclo","28/09/2026 → 13/08/2027 · a La Misión é o ciclo; a Indomit é um ponto no caminho",k)+'<div class="grid">'
    +secao("01","Periodização","a informação mais importante: do macro para o micro")
    +card("c8","Periodização",periodizacao(200,true),"blocos, volume, marcos e provas")+card("c4","Marcos",marcos())
    +secao("02","Projeção","atualizada a cada sincronia do relógio")
    +'<article class="card c12"><div class="grid" style="gap:16px"><div class="c6">'+projNumeros()+'</div><div class="c6">'+projTrail()+'</div><div class="c6">'+projCurva("21k")+'</div><div class="c6">'+projCurva("42k")+'</div></div></article>'
    +secao("03","O ciclo","realizado em relação ao percurso da La Misión")
    +'<article class="card c12"><div class="ch"><h2>Realizado em relação ao ciclo</h2><span class="m">a posição anda com o tempo · km, desnível e ritmo dizem se o corpo acompanha</span></div>'+cicloPercurso()+'</article>'
    +secao("04","Como o ciclo foi montado","blocos e vieses da preparação")
    +card("c12","Como o ciclo foi montado",comoMontado())
    +'</div>';
}
function vCorpo(){
  var lc=last(WC), fc=fcHoje(), k=kpi("pulse","VO₂max",FIT.vo2,"COROS · "+ddmm(D.coros.lido||last(SONO)[0]),'','var(--good-text)')+kpi("scale","Peso",D.atleta.peso,"kg")+kpi("incl","Limiar",FIT.limiar,"/km")+kpi("heart","FC de repouso",fc?fc.v:"—",fc?"bpm · "+(fresco(fc.d)?"hoje":ddmm(fc.d)):"");
  return hello("Corpo","Leitura do relógio · "+dm(HOJE),k)+'<div class="grid">'
    +card("c6","HRV noturno",hrvChart(),Math.min(30,WH.length)+" noites")+card("c6","FC de repouso",fcChart(),Math.min(30,W.filter(function(x){return x.rhr!=null;}).length)+" dias")
    +card("c7","Sono por fase",sonoChart(),"COROS · até "+ddmm(last(SONO)[0])+" · faixa verde é a meta de 7 a 8 h")+card("c5","Hora de deitar e levantar",janelaSono()+sonoMeta(),"COROS · até "+ddmm(last(SONO)[0]))
    +card("c7","Previsões e RPs",projNumeros(),"COROS · Strava")
    +card("c5","Pendências",'<div class="list">'+((PRIV&&PRIV.pendencias)||[]).map(function(x){return '<div class="li">'+sq(x[1],x[0])+'<div><p class="lt">'+x[2]+'</p><p class="ls">'+x[3]+'</p></div><span class="pill">pendente</span></div>';}).join("")+'</div>')+'</div>';
}
function vAgenda(){
  var k=kpi("flag","Próxima prova",diff(HOJE,NEXT.d),"dias",'<span class="pill">'+esc(NEXT.c)+'</span>','var(--accent)')+kpi("mtn","Provas A",AS.length,"no ano")+kpi("cal","Provas",D.provas.length,"no calendário");
  return hello("Agenda","Treino de cada dia e a temporada inteira",k)+'<div class="grid"><article class="card c8" id="mescard">'+mes()+'</article>'+card("c4","Próximas provas",proximas())+card("c12","Temporada 2026–27",temporada(),"outubro a setembro")+'</div>';
}
function vKit(){
  var L=tenisLista(), k=kpi("run","Em uso",L.ultimos.length,"pares")+kpi("mtn","Todos",L.todos.length,"pares no Strava")+kpi("watch","Relógio","PACE 3","COROS");
  return hello("Kit","Tênis, relógio e o que uso",k)+'<div class="grid"><article class="card c12" id="kitcard"><div class="ch"><h2>Rotação de tênis</h2><span class="m">Strava · histórico de todos os pares</span></div>'+tenis(false,KIT_TAB)+'</article>'+card("c12","O que uso",usoKit())+'</div>';
}
function nutriRows(){ return (PRIV&&PRIV.nutricao)||[]; }
function nutriHoje(){
  var rows=nutriRows(), r=rows[rows.length-1], lit=function(ml){return (ml/1000).toFixed(1).replace(".",",");}, n0=function(v){return Math.round(v).toLocaleString("pt-BR");};
  if(!r) return '<div class="stat3"><div><span class="k">Calorias</span><span class="v">—</span></div><div><span class="k">Água</span><span class="v">—</span></div></div><p class="note">Sem registro ainda. O caminho é MyFitnessPal → Apple Health → painel; o passo a passo está na aba Nutrição.</p>';
  return '<div class="stat3"><div><span class="k">Calorias</span><span class="v">'+(r.kcal==null?'—':n0(r.kcal)+'<small> kcal</small>')+'</span></div><div><span class="k">Carboidrato</span><span class="v">'+(r.carb==null?'—':n0(r.carb)+'<small> g</small>')+'</span></div><div><span class="k">Água</span><span class="v">'+(r.agua==null?'—':lit(r.agua)+'<small> L</small>')+'</span></div><div><span class="k">Peso</span><span class="v">'+(r.peso==null?'—':String(r.peso).replace(".",",")+'<small> kg</small>')+'</span></div></div><p class="note">'+(r.d===HOJE?'hoje':'último registro · '+ddmm(r.d))+' · MyFitnessPal via Apple Health</p>';
}
function supRows(){ return (PRIV&&PRIV.suplementacao)||[]; }
function PROD(){ var m={}; ((D.nutri&&D.nutri.produtos)||[]).forEach(function(p){ m[p.id]=p; }); return m; }
function suplementacao(){
  var rows=supRows(), PM=PROD();
  if(!rows.length) return '<p class="note">Depois de cada treino, me diz o que entrou: produto e quantidade (“2 Carbs Gel maracujá, 1 Mate Leão, 1 cápsula de sal”). Eu registro aqui com os dados do rótulo. O que você consumiu de verdade vira a média do ciclo, e não o que o plano impõe.</p>';
  var tot=function(e){ var c=0,s=0,k=0; e.itens.forEach(function(i){ var p=PM[i.p]||{}; c+=(p.carb||0)*i.q; s+=(p.sodio||0)*i.q; k+=(p.cafeina||0)*i.q; }); return {c:c,s:s,k:k}; };
  var lon=rows.filter(function(e){ var r=runs(e.d)[0]; return r&&r.min>=90; }), med=lon.length?mean(lon.map(function(e){ var r=runs(e.d)[0]; return tot(e).c/(r.min/60); })):0;
  return (med?'<p class="sub">Média nos treinos de 90 min ou mais: <b style="color:var(--ink)">'+Math.round(med)+' g de carboidrato por hora</b> · '+lon.length+' treinos</p>':'')+'<div class="list">'+rows.slice().reverse().slice(0,8).map(function(e){ var t=tot(e), run=runs(e.d)[0], ph=run?t.c/(run.min/60):0;
    return '<div class="li" style="grid-template-columns:auto 1fr auto">'+sq("var(--accent-fill)","drop")+'<div style="min-width:0"><p class="lt">'+esc(e.sessao||(run?TERRL[run.t]+" · "+k1(run.km)+" km":"Treino"))+' <span class="lbl">'+ddmm(e.d)+'</span></p><p class="ls">'+e.itens.map(function(i){ var p=PM[i.p]; return (i.q>1?i.q+"× ":"")+esc(p?p.nome:i.p); }).join(" · ")+(e.nota?' · '+esc(e.nota):'')+'</p></div><div style="text-align:right"><p class="num" style="font-size:16px;font-weight:600;line-height:1.1">'+Math.round(t.c)+'<span class="lbl"> g carbo</span></p><p class="lbl">'+(ph?Math.round(ph)+' g/h · ':'')+Math.round(t.s)+' mg sódio'+(t.k?' · '+Math.round(t.k)+' mg cafeína':'')+'</p></div></div>'; }).join("")+'</div>';
}
function produtos(){
  var ps=(D.nutri&&D.nutri.produtos)||[];
  if(!ps.length) return '<p class="note">Nenhum produto cadastrado ainda.</p>';
  return '<div class="list">'+ps.map(function(p){ return '<div class="li">'+(p.foto?'<img src="'+esc(p.foto)+'" alt="" style="width:34px;height:34px;border-radius:10px;object-fit:cover">':sq("var(--ink)","drop"))+'<div style="min-width:0"><p class="lt">'+esc(p.nome)+'</p><p class="ls">'+esc(p.marca||"")+(p.porcao?' · '+esc(p.porcao):'')+'</p></div><div style="text-align:right"><p class="num" style="font-size:14px;font-weight:600;line-height:1.1">'+(p.carb!=null?p.carb+' g carbo':'rótulo a confirmar')+'</p><p class="lbl">'+(p.sodio!=null?p.sodio+' mg sódio':'')+(p.cafeina?' · '+p.cafeina+' mg cafeína':'')+'</p></div></div>'; }).join("")+'</div>';
}
function nutriBloco(){
  var rows=nutriRows(), n0=function(v){return Math.round(v).toLocaleString("pt-BR");}, lit=function(ml){return (ml/1000).toFixed(1).replace(".",",");};
  var st=function(k,v,u){return '<div><span class="k">'+k+'</span><span class="v">'+(v==null?'—':n0(v)+'<small> '+u+'</small>')+'</span></div>';};
  if(!rows.length) return '<div class="stat3">'+st("Calorias",null)+st("Carboidrato",null)+st("Proteína",null)+st("Água",null)+'</div>'
    +'<div class="list" style="margin-top:12px"><div class="li">'+sq("var(--ink)","food")+'<div><p class="lt">1 · MyFitnessPal grava no Apple Health</p><p class="ls">MyFitnessPal › Mais › Apps e dispositivos › Apple Health: ligar nutrição, água e peso.</p></div></div>'
    +'<div class="li">'+sq("var(--ink)","drop")+'<div><p class="lt">2 · Health Auto Export manda para o painel</p><p class="ls">Automação REST API, todo dia, com dietary_energy, carbohydrates, protein, total_fat, dietary_water e weight_body_mass → POST /api/nutricao com a chave do modo privado.</p></div></div>'
    +'<div class="li">'+sq("var(--accent-fill)","scale")+'<div><p class="lt">3 · Esta aba mostra o dia</p><p class="ls">Calorias, macros, água e peso por dia. O longão passa a ler o carboidrato real.</p></div></div></div>';
  var r=rows[rows.length-1], hoje=r.d===HOJE;
  var o='<div class="stat3">'+st("Calorias",r.kcal,"kcal")+st("Carboidrato",r.carb,"g")+st("Proteína",r.prot,"g")+'<div><span class="k">Água</span><span class="v">'+(r.agua==null?'—':lit(r.agua)+'<small> L</small>')+'</span></div></div>';
  o+='<p class="note" style="margin-top:8px">'+(hoje?'hoje':'último registro · '+ddmm(r.d))+(r.gord!=null?' · gordura '+n0(r.gord)+' g':'')+(r.peso!=null?' · peso '+String(r.peso).replace(".",",")+' kg':'')+' · MyFitnessPal via Apple Health</p>';
  var last=rows.slice(-14), W=480,H=150,L=40,R=12,T=18,B=28, mx=Math.max.apply(null,last.map(function(x){return x.kcal||0;}).concat([2500]));
  var X=function(k){return L+(k+.5)/last.length*(W-L-R);}, Y=function(v){return T+(1-v/mx)*(H-T-B);}, bw=Math.max(6,(W-L-R)/last.length-6), g="";
  [1000,2000,3000,4000].filter(function(v){return v<=mx;}).forEach(function(v){ g+='<line class="gl" x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(v)+'" y2="'+Y(v)+'"/><text class="ax" x="'+(L-6)+'" y="'+(Y(v)+3.5)+'" text-anchor="end">'+(v/1000)+'k</text>'; });
  last.forEach(function(x,k){ var v=x.kcal||0; g+='<rect x="'+(X(k)-bw/2)+'" y="'+Y(v)+'" width="'+bw+'" height="'+(Y(0)-Y(v))+'" rx="2" fill="'+(x.d===HOJE?'var(--accent-fill)':'var(--ink)')+'"'+tip(n0(v)+' kcal'+(x.agua!=null?' · '+lit(x.agua)+' L':''),ddmm(x.d))+'/>'; if(k%2===last.length%2||last.length<8) g+='<text class="ax" x="'+X(k)+'" y="'+(H-8)+'" text-anchor="middle">'+ddmm(x.d).slice(0,5)+'</text>'; });
  return o+'<div style="margin-top:12px">'+vb(W,H,g,"Calorias por dia, últimos 14 dias")+'</div>';
}
function nutriAnalise(){
  var rows=nutriRows(); if(!rows.length) return '<p class="note">Quando o registro chegar, aqui entram: média de calorias por dia, dias dentro da meta, água por dia e calorias contra a carga de treino. Me passa a meta diária do MyFitnessPal para a régua.</p>';
  var n0=function(v){return Math.round(v).toLocaleString("pt-BR");}, kc=rows.filter(function(r){return r.kcal!=null;}), ag=rows.filter(function(r){return r.agua!=null;}), meta=D.nutri&&D.nutri.meta_kcal;
  var med=kc.length?mean(kc.map(function(r){return r.kcal;})):0, na=meta?kc.filter(function(r){return Math.abs(r.kcal-meta)<=meta*0.1;}).length:null;
  var last14=rows.slice(-14), W=480,H=160,L=40,R=12,T=18,B=28, mxL=Math.max.apply(null,last14.map(function(r){return loadDay(r.d);}).concat([100])), mx=Math.max.apply(null,kc.map(function(r){return r.kcal;}).concat([2500]));
  var X=function(i){return L+(i+.5)/last14.length*(W-L-R);}, Y=function(v){return T+(1-v/mx)*(H-T-B);}, Y2=function(v){return T+(1-v/mxL)*(H-T-B);}, bw=Math.max(6,(W-L-R)/last14.length-6), g="";
  last14.forEach(function(r,i){ if(r.kcal!=null) g+='<rect x="'+(X(i)-bw/2)+'" y="'+Y(r.kcal)+'" width="'+bw+'" height="'+(Y(0)-Y(r.kcal))+'" rx="2" fill="var(--ink)"'+tip(n0(r.kcal)+" kcal","carga "+Math.round(loadDay(r.d))+" · "+ddmm(r.d))+'/>'; g+='<circle cx="'+X(i)+'" cy="'+Y2(loadDay(r.d))+'" r="4" fill="var(--accent-fill)"/>'; });
  if(meta) g+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(meta)+'" y2="'+Y(meta)+'" stroke="var(--good)" stroke-dasharray="4 4"/>';
  return '<div class="stat3"><div><span class="k">Média · '+kc.length+' dias</span><span class="v">'+n0(med)+'<small> kcal</small></span><span class="d">'+(meta?'meta '+n0(meta):'sem meta definida')+'</span></div><div><span class="k">Dias na meta</span><span class="v">'+(na!=null?na+'<small> de '+kc.length+'</small>':'—')+'</span><span class="d">±10% da meta</span></div><div><span class="k">Água · média</span><span class="v">'+(ag.length?(mean(ag.map(function(r){return r.agua;}))/1000).toFixed(1).replace(".",",")+'<small> L</small>':'—')+'</span></div></div>'+vb(W,H,g,"Calorias e carga de treino por dia")+'<div class="legend"><span><i style="background:var(--ink)"></i>Calorias</span><span><i class="dot" style="background:var(--accent-fill)"></i>Carga de treino</span>'+(meta?'<span><i class="ln" style="background:var(--good)"></i>Meta</span>':'')+'</div>';
}
function vNutri(){
  var rows=nutriRows(), r=rows[rows.length-1];
  var k=kpi("food","Calorias",r&&r.kcal!=null?Math.round(r.kcal).toLocaleString("pt-BR"):"—",r?(r.d===HOJE?"kcal · hoje":"kcal · "+ddmm(r.d)):"sem registro")+kpi("drop","Água",r&&r.agua!=null?(r.agua/1000).toFixed(1).replace(".",",")+" L":"—",r?"MyFitnessPal":"sem registro")+kpi("scale","Peso",r&&r.peso!=null?String(r.peso).replace(".",","):D.atleta.peso,"kg");
  return hello("Nutrição","Registro do dia, análise e o que entra no treino",k)+'<div class="grid">'
    +card("c6","Registro do dia",nutriBloco(),rows.length?"MyFitnessPal · Apple Health":"como conectar")
    +card("c6","Análise",nutriAnalise(),"média, meta e carga")
    +card("c7","Suplementação por treino",suplementacao(),supRows().length?"o que entrou de verdade":"você me conta, eu anoto")
    +card("c5","Produtos",produtos(),"dados do rótulo · cresce com o que você usa")+'</div>';
}
function vPublico(){
  var pv=D.provas.filter(function(p){return p.c===PV;})[0]||NEXT, pd=plan(HOJE);
  return '<div class="grid">'
    +secao("01","Para que estou treinando","escolha a prova")
    +'<div class="c12">'+provaSeg(pv)+'</div>'
    +'<div class="c12">'+heroBlock(pv)+'</div>'
    +'<article class="card c12">'+provaCard(pv)+'</article>'
    +card("c12","Temporada 2026–27",temporada(),"todas as provas e participações")
    +secao("02","Como estou hoje","o que o relógio leu esta noite e o treino do dia")
    +'<div class="c12">'+destaques()+'</div>'
    +card("c6","Treino de hoje",sessoes(pd,true),pd?pd.bloco+" · "+blocoNome(pd.bloco):"")
    +'<article class="card c6">'+prontCard(true)+'</article>'
    +secao("03","O ciclo","realizado em relação ao ciclo, a semana, fitness e projeção")
    +'<article class="card c12"><div class="ch"><h2>Realizado em relação ao ciclo</h2><span class="m">a La Misión é o ciclo; a Indomit é um ponto no caminho</span></div>'+cicloPercurso()+'</article>'
    +'<article class="card c12">'+semana(WK,true)+'</article>'
    +'<article class="card c8"><div class="ch"><h2>Fitness e forma</h2><div class="r">'+fitnessPer()+'</div></div>'+fitness(240)+'</article>'
    +card("c4","Esforço por semana",reSemanal(),"Strava · 12 semanas")
    +'<article class="card c12"><div class="ch"><h2>Projeção</h2><span class="m">previsão do relógio · RPs · metas</span></div><div class="grid" style="gap:16px"><div class="c6">'+projNumeros()+'</div><div class="c6">'+projTrail()+'</div><div class="c6">'+projCurva("21k")+'</div><div class="c6">'+projCurva("42k")+'</div></div></article>'
    +secao("04","Histórico","treinos, carga por dia e o que calço")
    +card("c6","Treinos recentes",treinosPublicos(),"Strava")+card("c6","Carga por dia",heatCiclo(),"corrida + força + caminhada · prova em verde")
    +'<article class="card c12" id="kitcard"><div class="ch"><h2>Rotação de tênis</h2><span class="m">Strava</span></div>'+tenis(true,KIT_TAB)+'</article>'
    +secao("05","Por trás do painel","como o ciclo foi montado e como o número vira decisão")
    +card("c12","Como o ciclo foi montado",comoMontado())
    +card("c12","Como funciona",comoFunciona())
    +card("c12","No Instagram",instagram(),"@mendesgabriell")
    +'</div><div class="foot"><span>Dashboard de Gabriel Mendes · mede antes de opinar</span><span>dados: COROS · Strava · '+dm(HOJE)+'</span></div>';
}
/* =========================================================================
   SHELL E INTERAÇÃO
   ========================================================================= */
var VIEW={hoje:vHoje,treino:vTreino,ciclo:vCiclo,corpo:vCorpo,agenda:vAgenda,kit:vKit,nutri:vNutri};
var TABS=[["hoje","Hoje"],["treino","Treino"],["ciclo","Ciclo"],["corpo","Corpo"],["agenda","Agenda"],["kit","Kit"],["nutri","Nutrição"]];
var MODO=PRIV?(QS.get("modo")||store("modo")||"priv"):"pub", ATUAL="hoje", tabsEl=document.getElementById("tabs"), viewEl=document.getElementById("view");
function renderTabs(){ var mEl=document.getElementById("modo"); if(mEl) mEl.hidden=!PRIV; tabsEl.innerHTML=MODO==="pub"?'<button type="button" aria-current="page">Vitrine</button>':TABS.map(function(t){return '<button type="button" data-tab="'+t[0]+'" aria-current="'+(t[0]===ATUAL?"page":"false")+'">'+t[1]+'</button>';}).join(""); Array.prototype.forEach.call(document.querySelectorAll("#modo button"),function(b){ b.setAttribute("aria-pressed",String(b.dataset.m===MODO)); }); }
function render(keep){ var y=window.scrollY; viewEl.innerHTML=MODO==="pub"?vPublico():VIEW[ATUAL](); renderTabs(); window.scrollTo(0,keep?y:0); }
function go(t){ ATUAL=t; try{history.replaceState(null,"","#"+t);}catch(e){} render(); }
document.addEventListener("click",function(e){
  var t=e.target.closest("button"); if(!t) return;
  if(t.dataset.tab){ go(t.dataset.tab); return; }
  if(t.dataset.m){ MODO=t.dataset.m; store("modo",MODO); render(); return; }
  if(t.id==="tema"){ var cur=document.documentElement.getAttribute("data-theme"), dark=cur?cur==="dark":matchMedia("(prefers-color-scheme: dark)").matches; var nx=dark?"light":"dark"; document.documentElement.setAttribute("data-theme",nx); store("tema",nx); return; }
  if(t.dataset.feito){ FEITO[t.dataset.feito]=!FEITO[t.dataset.feito]; store("feito",FEITO); render(true); return; }
  if(t.dataset.abre){ ABERTO[t.dataset.abre]=!ABERTO[t.dataset.abre]; render(true); return; }
  if(t.dataset.wk!==undefined){ var w=+t.dataset.wk; if(w>=0&&w<P.semanas.length){ WK=w; var c=document.getElementById("semcard"); if(c) c.innerHTML=(c.dataset.forca?semanaForca(WK):semana(WK)); } return; }
  if(t.dataset.mes){ var y=+MES_VER.slice(0,4), m=+MES_VER.slice(5,7)-1+(+t.dataset.mes), s=iso(new Date(Date.UTC(y,m,1))).slice(0,7); if(s>="2026-09"&&s<="2027-09"){ MES_VER=s; store("mes",s); var mc=document.getElementById("mescard"); if(mc) mc.innerHTML=mes(); } return; }
  if(t.dataset.perfil){ PK=t.dataset.perfil; store("perfil",PK); render(true); return; }
  if(t.dataset.kit){ KIT_TAB=t.dataset.kit; store("kittab",KIT_TAB); render(true); return; }
  if(t.dataset.tr){ TR_TAB=t.dataset.tr; store("trtab",TR_TAB); render(); return; }
  if(t.dataset.fagg){ FAGG=t.dataset.fagg; store("fagg",FAGG); render(true); return; }
  if(t.dataset.fabre){ FABRE[t.dataset.fabre]=!FABRE[t.dataset.fabre]; render(true); return; }
  if(t.dataset.prova){ PV=t.dataset.prova; store("prova",PV); render(true); return; }
  if(t.dataset.fper){ FPER=t.dataset.fper; store("fper",FPER); render(true); return; }
});
document.addEventListener("change",function(e){
  var inp=e.target; if(!inp.dataset||!inp.dataset.foto||!inp.files||!inp.files[0]) return;
  var fr=new FileReader(); fr.onload=function(){ var img=new Image(); img.onload=function(){ var max=inp.dataset.foto==="hero"?1600:900, s=Math.min(1,max/Math.max(img.width,img.height)), cv=document.createElement("canvas"); cv.width=Math.round(img.width*s); cv.height=Math.round(img.height*s); cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height); FOTOS[inp.dataset.foto]=cv.toDataURL("image/jpeg",.84); store("fotos",FOTOS); render(true); }; img.src=fr.result; }; fr.readAsDataURL(inp.files[0]);
});
var tipEl=document.getElementById("tip");
function showTip(el,x,y){ tipEl.textContent=""; var b=document.createElement("b"); b.textContent=el.getAttribute("data-tip"); tipEl.appendChild(b); var l=el.getAttribute("data-tl"); if(l) tipEl.appendChild(document.createTextNode(l)); tipEl.hidden=false; var r=tipEl.getBoundingClientRect(), nx=x+14, ny=y-r.height-12; if(nx+r.width>innerWidth-8) nx=x-r.width-14; if(ny<8) ny=y+18; tipEl.style.left=nx+"px"; tipEl.style.top=ny+"px"; }
document.addEventListener("pointermove",function(e){ var el=e.target.closest&&e.target.closest("[data-tip]"); if(el) showTip(el,e.clientX,e.clientY); else tipEl.hidden=true; });
document.addEventListener("focusin",function(e){ var el=e.target.closest&&e.target.closest("[data-tip]"); if(el){ var r=el.getBoundingClientRect(); showTip(el,r.left+r.width/2,r.top); } });
document.addEventListener("focusout",function(){ tipEl.hidden=true; });
window.addEventListener("scroll",function(){ tipEl.hidden=true; },{passive:true});
var ALVOS={}; D.provas.forEach(function(p){ ALVOS[p.d]=alvoTs(p); });
function tick(){ Array.prototype.forEach.call(document.querySelectorAll("[data-cd]"),function(el){ var a=el.getAttribute("data-cd").split(":"), c=parts(ALVOS[a[1]]||0), v={d:c.d,h:c.h,m:c.m,s:c.s}[a[0]]; if(v===undefined) return; el.textContent=a[0]==="d"?String(v):String(v).padStart(2,"0"); }); }
setInterval(tick,1000);
var tema=QS.get("tema")||store("tema"); if(tema) document.documentElement.setAttribute("data-theme",tema);
var h0=(location.hash||"").replace("#",""); if(VIEW[h0]) ATUAL=h0;
render();
})();
