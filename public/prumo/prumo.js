(function(){
"use strict";
/* =========================================================================
   PRUMO · motor da página.
   Dados chegam prontos em `D` (embutidos no artefato, ou de /api/prumo na
   Vercel). Nada aqui decide treino: o que é cálculo é determinístico e está
   nomeado como tal (prontidão, forma, projeção).
   ========================================================================= */
var D = window.PRUMO_DATA || JSON.parse(document.getElementById("data").textContent);
var P = D.plano, HOJE = D.hoje, PRIV = D.privado || null;

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
function pace(s){ return Math.floor(s/60)+":"+String(Math.round(s%60)).padStart(2,"0"); }
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
var FSRC=store("fsrc")||"strava";
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
function prontidao(){
  var h=last(HRV7), s=last(SONO), w=last(WC), it=[], t=0;
  var hs=h[5]==="acima"?2:h[5]==="normal"?1:-2; it.push({k:"HRV",v:h[1]+" ms",s:hs,l:h[5]+" do normal"}); t+=hs;
  var ss=s[1]>=85?2:s[1]>=70?1:s[1]>=55?0:-2; if(s[2]<360) ss-=1; it.push({k:"Sono",v:s[1]+" · "+hm(s[2]),s:ss,l:"nota "+s[1]}); t+=ss;
  var rh=W.filter(function(x){return x.rhr!=null;}), cur=last(rh), prev=rh.slice(-8,-1).map(function(x){return x.rhr;}), mu=mean(prev);
  var rs=cur.rhr<=mu?1:cur.rhr>=mu+5?-2:0; it.push({k:"FC repouso",v:cur.rhr+" bpm",s:rs,l:"média 7d "+Math.round(mu)}); t+=rs;
  var fz=last(serieFit(FSRC)), tsb=fz.f-fz.a, fs=tsb>=-5?1:tsb>=-15?0:-1; it.push({k:"Forma",v:(tsb>=0?"+":"")+tsb.toFixed(0),s:fs,l:"fitness "+fz.f.toFixed(0)+" · fadiga "+fz.a.toFixed(0)}); t+=fs;
  var n=t>=5?5:t>=3?4:t>=1?3:t>=-1?2:1;
  return {n:n,total:t,itens:it};
}
var PRON=prontidao();

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
function sessoes(pd,publico){
  if(!pd) return '<p class="lbl">Fora do ciclo.</p>';
  if(pd.prova) return '<div class="ses">'+sq("var(--good)","flag")+'<div><p class="t">'+esc(pd.prova.n)+'</p><p class="s">'+pd.prova.km+' km'+(pd.prova.dplus?' · '+thou(pd.prova.dplus)+' m D+':'')+' · '+esc(pd.prova.meta)+'</p></div><p class="n">Prova</p></div>';
  var o="";
  if(pd.c){
    var kd=pd.date+":c", c=pd.c, tc=TERR[pd.t], op=ABERTO[kd];
    o+='<div class="ses'+(FEITO[kd]?' done':'')+(op?' open':'')+'">'+sq(tc,pd.t==="trilha"?"mtn":pd.t==="esteira"?"incl":"run")
      +'<div style="min-width:0"><p class="t">'+esc(c.n)+'</p><p class="s">'+TERRL[pd.t]+(c.loc?' · '+esc(c.loc):'')+'</p><p class="s" style="color:var(--ink);margin-top:2px">'+esc(c.presc[pd.bloco]||"")+'</p></div>'
      +'<p class="n">'+k1(pd.km)+'<small>km</small></p>'
      +'<div class="full"><p>'+esc(c.obj)+'</p><ol>'+c.passos.map(function(p){return '<li>'+esc(p)+'</li>';}).join("")+'</ol>'+(c.reg?'<div class="reg">'+esc(c.reg)+'</div>':'')+'</div>'
      +'<div class="acts2"><button class="btn mini" data-abre="'+kd+'">'+(op?'Fechar':'Treino completo')+'</button>'+(publico?'':'<button class="btn mini'+(FEITO[kd]?' dark':'')+'" data-feito="'+kd+'">'+(FEITO[kd]?'Realizado ✓':'Marcar realizado')+'</button>')+'</div></div>';
  }
  if(pd.fz){
    var f=P.forca[pd.fz], kf=pd.date+":f", sr=f.ex.reduce(function(s,e){ if(/^Abdominal/.test(e[0])) return s; var m=/^(\d+)/.exec(e[1]); return s+(m?+m[1]:3); },0), op2=ABERTO[kf];
    o+='<div class="ses'+(FEITO[kf]?' done':'')+(op2?' open':'')+'">'+sq("var(--ink)","iron")
      +'<div style="min-width:0"><p class="t">'+esc(f.nome)+'</p><p class="s">'+f.ex.length+' exercícios · ~'+Math.round(sr*2.6)+' min · mais abdominal e esteira inclinada</p></div>'
      +'<p class="n">'+sr+'<small>séries</small></p>'
      +'<div class="full"><p>'+esc(f.tip)+'</p><ol>'+f.ex.map(function(e){return '<li><b>'+esc(e[0])+'</b> — '+esc(e[1])+(e[3]?'<br><span style="color:var(--muted)">'+esc(e[3])+'</span>':'')+'</li>';}).join("")+'</ol></div>'
      +'<div class="acts2"><button class="btn mini" data-abre="'+kf+'">'+(op2?'Fechar':'Treino completo')+'</button>'+(publico?'':'<button class="btn mini'+(FEITO[kf]?' dark':'')+'" data-feito="'+kf+'">'+(FEITO[kf]?'Realizado ✓':'Marcar realizado')+'</button>')+'</div></div>';
  }
  return o||'<p class="lbl">Dia livre.</p>';
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
  var o='<div class="ch"><h2>Prontidão</h2><span class="pill" style="background:var(--card-2)"><i style="background:'+NIV[nv.n][1]+'"></i>'+nv.n+' · '+NIV[nv.n][0]+'</span></div>';
  o+='<div class="gauge-wrap">'+gauge(nv)+'</div><p style="text-align:center;font-size:13px;color:var(--ink-2);margin-top:-8px">'+NIV[nv.n][2]+'</p>';
  o+='<div class="fat">'+nv.itens.map(function(x){ var c=x.s>=1?"var(--good)":x.s===0?"var(--warn)":"var(--crit)"; return '<div><span class="k"><i style="background:'+c+'"></i>'+x.k+'</span><span class="v">'+x.v+' <small>'+esc(x.l)+'</small></span></div>'; }).join("")+'</div>';
  if(!publico) o+='<p class="note">Lido do relógio: HRV contra a faixa normal, nota de sono, FC de repouso contra a média de 7 dias e forma (fitness − fadiga). Sem pergunta.</p>';
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
  w=Math.max(0,Math.min(P.semanas.length-1,w)); var sem=P.semanas[w], days=[], mx=8, tp=0, td=0;
  for(var i=0;i<7;i++){ var d=add(P.inicio,w*7+i), pd=plan(d), done=d<=HOJE?runKm(d):0, st=setsOn(d); days.push({d:d,pd:pd,done:done,sets:st}); mx=Math.max(mx,pd.km,done); tp+=pd.km; td+=done; }
  var o='<div class="week">'+days.map(function(x){
    var pd=x.pd, st=estado(x.d,pd.km,x.done), ph=pd.km/mx*64, dh=x.done/mx*64, tc=TERR[runTerr(x.d)||pd.t]||"var(--rua)";
    var fz=pd.prova?'<span class="chip red">'+esc(pd.prova.c)+'</span>':pd.fz?'<span class="chip'+(x.sets?'':' ghost')+'"'+tip(P.forca[pd.fz].nome,x.sets?x.sets+" séries registradas":"")+'>'+pd.fz+(x.sets?' · '+x.sets:'')+'</span>':'<span class="chip ghost">—</span>';
    return '<div class="day'+(x.d===HOJE?' today':'')+(pd.prova?' race':'')+'"><div class="dn"><b>'+D7A[D7[x.pd.i]]+'</b><span>'+parse(x.d).getUTCDate()+'</span></div>'
      +'<div class="dbar"'+tip((x.done?k1(x.done)+" de ":"")+k1(pd.km)+" km",(pd.c?pd.c.n:pd.prova?pd.prova.n:"")+" · "+TERRL[pd.t])+'>'+(pd.km?'<span class="pl" style="height:'+ph+'px"></span>':'')+(x.done?'<span class="dn2" style="height:'+dh+'px;background:'+tc+'"></span>':'')+'</div>'
      +'<p class="km num">'+(x.done?k1(x.done):pd.km?k1(pd.km):"—")+'<small>'+(x.done?'de '+k1(pd.km):pd.c?TERRL[pd.t].toLowerCase():'')+'</small></p><div class="fz">'+fz+'</div>'
      +'<div class="st"><i style="background:'+EST[st][1]+'"></i>'+EST[st][0]+'</div></div>';
  }).join("")+'</div>';
  var head='<div class="ch"><h2>Semana '+(w+1)+' <span class="m">de 25</span></h2><div class="r"><span class="m num">'+k1(td)+' de '+k1(tp)+' km</span>'+(publico?'':'<button class="ico" data-wk="'+(w-1)+'" aria-label="Semana anterior" style="width:28px;height:28px">‹</button><button class="ico" data-wk="'+(w+1)+'" aria-label="Próxima semana" style="width:28px;height:28px">›</button>')+'</div></div>';
  return head+'<p class="sub">'+sem.dt+' · '+sem.b+' '+blocoNome(sem.b)+'</p>'+o+'<div class="legend"><span><i class="rg"></i>Previsto</span><span><i style="background:var(--rua)"></i>Rua</span><span><i style="background:var(--esteira)"></i>Esteira</span><span><i style="background:var(--trilha)"></i>Trilha</span><span><i style="background:var(--ink)"></i>Força · séries</span><span>Caminhada não conta</span></div>';
}

function atencao(){
  var it=(PRIV&&PRIV.atencao)||[];
  if(!it.length) return '<p class="lbl">Nada pendente.</p>';
  return '<div class="list">'+it.map(function(x){ var dd=x[4]?diff(HOJE,x[4]):null;
    var pill=x[4]===null?'<span class="pill warn"><i></i>Conferir</span>':dd<=0?'<span class="pill red">Hoje</span>':'<span class="pill">'+(dd===1?'Amanhã':'Em '+dd+' dias')+'</span>';
    return '<div class="li">'+sq(x[1],x[0])+'<div style="min-width:0"><p class="lt">'+x[2]+'</p><p class="ls">'+x[3]+'</p>'+(x[4]?'<div class="meter"><i style="width:'+Math.max(4,Math.min(100,(1-dd/x[5])*100))+'%;background:'+(dd<=7?'var(--accent-fill)':'var(--ink)')+'"></i></div>':'')+'</div>'+pill+'</div>'; }).join("")+'</div>';
}

/* fitness · fadiga · forma (intervals.icu, modelo de Banister como o Strava) */
function fitness(h,src){
  src=src||FSRC; var S=serieFit(src), n=S.length, Wd=1000, H=h||260, L=36, R=56, T=18, B=36;
  var top=Math.max.apply(null,S.map(function(x){return Math.max(x.f,x.a);})), ymax=Math.ceil((top*1.08)/10)*10;
  var ymin=Math.min(-10,Math.floor(Math.min.apply(null,S.map(function(x){return x.f-x.a;}))/10)*10);
  var X=function(i){return L+i/(n-1)*(Wd-L-R);}, Y=function(v){return T+(1-(v-ymin)/(ymax-ymin))*(H-T-B);}, o="";
  var step=10; while((ymax-ymin)/step*15>(H-T-B)) step*=2;
  for(var g=Math.ceil(ymin/step)*step; g<=ymax; g+=step) o+='<line class="gl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(g)+'" y2="'+Y(g)+'"/><text class="ax" x="'+(L-8)+'" y="'+(Y(g)+3.5)+'" text-anchor="end">'+g+'</text>';
  o+='<line x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(0)+'" y2="'+Y(0)+'" stroke="var(--axis)" stroke-width="1"/>';
  var tsb=S.map(function(x,i){return [X(i),Y(x.f-x.a)];});
  o+='<path d="'+smooth(tsb)+' L'+X(n-1).toFixed(1)+','+Y(0)+' L'+X(0).toFixed(1)+','+Y(0)+'Z" fill="var(--tsb)" opacity=".10"/><path d="'+smooth(tsb)+'" fill="none" stroke="var(--tsb)" stroke-width="1.5"/>';
  o+='<path d="'+smooth(S.map(function(x,i){return [X(i),Y(x.a)];}))+'" fill="none" stroke="var(--atl)" stroke-width="1.5" opacity=".9"/>';
  o+='<path d="'+smooth(S.map(function(x,i){return [X(i),Y(x.f)];}))+'" fill="none" stroke="var(--ctl)" stroke-width="2.5" stroke-linejoin="round"/>';
  var provas=(D.strava.provasFit||{});
  Object.keys(provas).forEach(function(d){ var i=S.findIndex(function(x){return x.d===d;}); if(i<0) return; o+='<line x1="'+X(i)+'" x2="'+X(i)+'" y1="'+(T+10)+'" y2="'+Y(ymin)+'" stroke="var(--axis)" stroke-dasharray="3 4"/><circle cx="'+X(i)+'" cy="'+Y(S[i].f)+'" r="4" fill="var(--card)" stroke="var(--ctl)" stroke-width="2"'+tip(provas[d],ddmm(d)+" · fitness "+S[i].f.toFixed(0))+'/>'; });
  var pk=0; S.forEach(function(x,i){ if(x.f>S[pk].f) pk=i; });
  o+='<text class="vl" x="'+X(pk)+'" y="'+(Y(S[pk].f)-10)+'" text-anchor="middle">pico '+S[pk].f.toFixed(0)+'</text>';
  var lx=X(n-1), lc=last(S), labs=[{v:lc.f,c:"var(--ctl)",t:lc.f.toFixed(0),cls:"vl"},{v:lc.a,c:"var(--atl)",t:lc.a.toFixed(0),cls:"ax",st:"fill:var(--accent);font-weight:600"},{v:lc.f-lc.a,c:"var(--tsb)",t:(lc.f-lc.a>=0?"+":"")+(lc.f-lc.a).toFixed(0),cls:"ax",st:"fill:var(--tsb);font-weight:600"}];
  labs.forEach(function(l){ l.y=Y(l.v); }); labs.sort(function(p,q){return p.y-q.y;});
  for(var i=1;i<labs.length;i++) if(labs[i].y-labs[i-1].y<13) labs[i].y=labs[i-1].y+13;
  labs.forEach(function(l){ o+='<circle cx="'+lx+'" cy="'+Y(l.v)+'" r="4.5" fill="'+l.c+'" stroke="var(--card)" stroke-width="2"/><text class="'+l.cls+'" x="'+(lx+9)+'" y="'+(l.y+4)+'"'+(l.st?' style="'+l.st+'"':'')+'>'+l.t+'</text>'; });
  S.forEach(function(x,i){ o+='<rect x="'+(X(i)-(Wd-L-R)/n/2)+'" y="'+T+'" width="'+((Wd-L-R)/n)+'" height="'+(H-T-B)+'" fill="transparent"'+tip("fitness "+x.f.toFixed(0)+" · fadiga "+x.a.toFixed(0)+" · forma "+(x.f-x.a>=0?"+":"")+(x.f-x.a).toFixed(0),ddmm(x.d))+'/>'; });
  var lm=-1; S.forEach(function(x,i){ var m=parse(x.d).getUTCMonth(); if(m!==lm){ if(i>0||true) o+='<text class="ax" x="'+X(i)+'" y="'+(H-14)+'">'+MES[m]+'</text>'; lm=m; } });
  var legSrc = src==="strava" ? "Modelo do Strava: esforço relativo, médias exponenciais de 42 e 7 dias" : "intervals.icu: carga por FC, 42 e 7 dias · alvo 75 na Indomit e 100 na La Misión";
  return vb(Wd,H,o,"Fitness, fadiga e forma")+'<div class="legend"><span><i class="ln" style="background:var(--ctl)"></i>Fitness</span><span><i class="ln" style="background:var(--atl)"></i>Fadiga</span><span><i style="background:var(--tsb);opacity:.5"></i>Forma</span><span><i class="dot rg"></i>Prova</span></div><p class="note">'+legSrc+'</p>';
}
function fitnessSeg(){ return '<div class="seg light" role="group" aria-label="Fonte"><button type="button" data-fsrc="strava" aria-pressed="'+(FSRC==="strava")+'">Strava</button><button type="button" data-fsrc="intervals" aria-pressed="'+(FSRC==="intervals")+'">intervals.icu</button></div>'; }

function fitnessStats(src){
  src=src||FSRC; var S=serieFit(src), lc=last(S), pk=S.reduce(function(m,x){return x.f>m.f?x:m;},S[0]), w7=S[S.length-8]||S[0], d=lc.f-w7.f;
  var alvo = src==="intervals" ? '<div><span class="k">Alvo</span><span class="v">75<small> · 100</small></span><span class="d">Indomit · La Misión</span></div>' : '<div><span class="k">Pico do registro</span><span class="v">'+pk.f.toFixed(0)+'</span><span class="d">'+ddmm(pk.d)+'</span></div>';
  return '<div class="stat3"><div><span class="k">Fitness</span><span class="v">'+lc.f.toFixed(0)+'</span><span class="d '+(d>=0?'up':'dn')+'">'+(d>=0?'+':'')+d.toFixed(1)+' em 7 dias</span></div><div><span class="k">Fadiga</span><span class="v">'+lc.a.toFixed(0)+'</span><span class="d">7 dias</span></div><div><span class="k">Forma</span><span class="v">'+(lc.f-lc.a>=0?'+':'')+(lc.f-lc.a).toFixed(0)+'</span><span class="d">'+(lc.f-lc.a>5?'descansado':lc.f-lc.a>-10?'equilibrado':'em fadiga')+'</span></div>'+alvo+'</div>';
}

/* carga por dia (vermelho = esforço; prova = verde) */
function heat(weeksBack,weeksAhead){
  var mon0=add(HOJE,-((parse(HOJE).getUTCDay()+6)%7)), start=add(mon0,-weeksBack*7), weeks=weeksBack+weeksAhead+1, cs=18, g=3, L=30, T=16, o="", lastM=-1;
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
  var mx=100, Y=function(v){return 128-v/mx*64;};
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
function percurso(key,h){
  var pf=D.perfis[key], Wd=1000, H=h||250, L=44, R=16, T=24, B=36, pts=pf.pts;
  var amin=Math.floor((pf.altmin-120)/250)*250, amax=Math.ceil((pf.altmax+120)/250)*250;
  var X=function(k){return L+k/pf.km*(Wd-L-R);}, Y=function(a){return T+(1-(a-amin)/(amax-amin))*(H-T-B);}, o="";
  for(var a=amin;a<=amax;a+=(amax-amin>1500?500:250)) o+='<line class="gl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(a)+'" y2="'+Y(a)+'"/><text class="ax" x="'+(L-8)+'" y="'+(Y(a)+3.5)+'" text-anchor="end">'+thou(a)+'</text>';
  var line=pts.map(function(p,i){return (i?"L":"M")+X(p[0]).toFixed(1)+","+Y(p[1]).toFixed(1);}).join(""), base=Y(amin);
  o+='<path d="'+line+'L'+X(pf.km)+','+base+'L'+X(0)+','+base+'Z" fill="var(--ink)" opacity=".07"/>';
  var frac=key==="indomit"?PCT:0, fk=Math.min(1,frac)*pf.km, done=pts.filter(function(p){return p[0]<=fk;});
  if(done.length>1){ o+='<path d="'+done.map(function(p,i){return (i?"L":"M")+X(p[0]).toFixed(1)+","+Y(p[1]).toFixed(1);}).join("")+'L'+X(fk)+','+base+'L'+X(0)+','+base+'Z" fill="var(--accent-fill)" opacity=".22"/>'; }
  o+='<path d="'+line+'" fill="none" stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round"/><line class="bl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+base+'" y2="'+base+'"/>';
  for(var k=0;k<=pf.km;k+=(pf.km>60?10:5)) o+='<text class="ax" x="'+X(k)+'" y="'+(H-14)+'" text-anchor="middle">'+k+'</text>';
  o+='<text class="ax" x="'+(Wd-R)+'" y="'+(H-1)+'" text-anchor="end">km</text>';
  var top=pts.reduce(function(m,p){return p[1]>m[1]?p:m;});
  o+='<circle cx="'+X(top[0])+'" cy="'+Y(top[1])+'" r="4" fill="var(--ink)" stroke="var(--card)" stroke-width="2"/><text class="vl" x="'+X(top[0])+'" y="'+(Y(top[1])-9)+'" text-anchor="middle">'+thou(top[1])+' m · km '+Math.round(top[0])+'</text>';
  var my=done.length?Y(last(done)[1]):Y(pts[0][1]);
  o+='<line x1="'+X(fk)+'" x2="'+X(fk)+'" y1="'+(T-10)+'" y2="'+base+'" stroke="var(--accent)" stroke-width="1.5"/><circle cx="'+X(fk)+'" cy="'+my+'" r="7" fill="var(--accent-fill)" stroke="var(--card)" stroke-width="3"'+tip("km "+k1(fk)+" de "+pf.km,"cada km do ciclo anda no percurso · "+k1(frac*100)+"%")+'/><text class="vlr" x="'+(X(fk)+10)+'" y="'+(T-2)+'">você · km '+k1(fk)+'</text>';
  pts.forEach(function(p,i){ if(i%4) return; o+='<rect x="'+(X(p[0])-4)+'" y="'+T+'" width="8" height="'+(H-T-B)+'" fill="transparent"'+tip(thou(p[1])+" m","km "+k1(p[0]))+'/>'; });
  return vb(Wd,H,o,"Perfil de "+pf.nome);
}
function percursoStats(key){
  var pf=D.perfis[key], pv=D.provas.filter(function(p){return key==="indomit"?p.c==="Indomit":p.c==="La Misión";})[0], kme=pf.km+pf.dplus/100;
  var meta=key==="indomit"?31800:72000;
  return '<div class="stat3"><div><span class="k">Distância</span><span class="v">'+k1(pf.km)+'<small> km</small></span></div><div><span class="k">Desnível positivo</span><span class="v">'+thou(pf.dplus)+'<small> m</small></span></div><div><span class="k">Teto</span><span class="v">'+thou(pf.altmax)+'<small> m</small></span></div><div><span class="k">Km-esforço</span><span class="v">'+Math.round(kme)+'</span><span class="d">km + D+/100 · ITRA</span></div><div><span class="k">Ritmo para '+hhmm(meta)+'</span><span class="v">'+pace(meta/pf.km)+'<small>/km</small></span><span class="d">'+pace(meta/kme)+' por km-esforço</span></div></div>'
    +'<p class="note">Traçado oficial da organização ('+esc(pf.fonte.split(" · ")[0])+'). Terreno: '+esc(pf.terreno)+'.'+(pv?' Largada '+ddmm(pv.d)+(pv.hora?' às '+pv.hora:'')+'.':'')+'</p>';
}

/* projeção: números (COROS + RP + meta) e curva até a meta */
function riegel(t,d1,d2){ return t*Math.pow(d2/d1,1.06); }
var DIST=[["5k",5,"5 km"],["10k",10,"10 km"],["21k",21.0975,"Meia"],["42k",42.195,"Maratona"],["50k",50,"50 km plano"]];
function projNumeros(){
  var prev=FIT.prev, prs=D.strava.prs, metas={"21k":6000,"42k":12600};
  var rows=DIST.map(function(x){ var k=x[0], pv=prev[k]!=null?prev[k]:riegel(prev["42k"],42.195,50), pr=prs[k], m=metas[k];
    return '<tr><td style="font-weight:500">'+x[2]+'</td><td class="n">'+clock(pv)+'<br><span class="lbl">'+pace(pv/x[1])+'/km</span></td><td class="n pr">'+(pr?clock(pr.t):'—')+(pr?'<br><span class="lbl" style="font-weight:400">'+esc(pr.onde.split(" ·")[0])+' · '+ddmm(pr.d)+'</span>':'')+'</td><td class="n">'+(m?clock(m):'—')+'</td><td class="n">'+(m?'<span style="color:'+(pv-m>0?'var(--accent)':'var(--good-text)')+';font-weight:600">'+(pv-m>0?'−':'+')+clock(Math.abs(pv-m))+'</span>':'<span class="lbl">sem meta</span>')+'</td></tr>'; }).join("");
  return '<div class="tbl"><table><thead><tr><th>Distância</th><th class="n"><span class="lg">Previsão COROS</span><span class="sm">COROS</span></th><th class="n"><span class="lg">Melhor no Strava · 2026</span><span class="sm">Strava 2026</span></th><th class="n">Meta</th><th class="n">Falta</th></tr></thead><tbody>'+rows+'</tbody></table></div><p class="note">Previsão do relógio (VO₂max '+FIT.vo2+', limiar '+FIT.limiar+'/km). 50 km plano por Riegel a partir da maratona. Melhores tempos registrados no Strava em 2026 — os RPs de antes entram quando você passar.</p>';
}
function projCurva(key){
  var x=DIST.filter(function(z){return z[0]===key;})[0], pv=D.provas.filter(function(p){return key==="21k"?p.c==="Rio 21K":p.c==="POA 42K";})[0];
  var t0=FIT.prev[key], meta=pv.meta_s, pr=D.strava.prs[key].t, Wd=480, H=230, L=56, R=20, T=22, B=34;
  var ymax=Math.max(t0,pr)*1.03, ymin=meta*0.96, Y=function(v){return T+(v-ymin)/(ymax-ymin)*(H-T-B);};
  var X=function(d){return L+diff(HOJE,d)/diff(HOJE,pv.d)*(Wd-L-R);}, o="";
  var step=key==="21k"?120:300; for(var g=Math.ceil(ymin/step)*step; g<=ymax; g+=step) o+='<line class="gl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(g)+'" y2="'+Y(g)+'"/><text class="ax" x="'+(L-8)+'" y="'+(Y(g)+3.5)+'" text-anchor="end">'+hhmm(g)+'</text>';
  var m0=parse(HOJE).getUTCMonth(), cur=HOJE; while(cur<pv.d){ var mm=parse(cur).getUTCMonth(); var nx=iso(new Date(Date.UTC(parse(cur).getUTCFullYear(),mm+1,1))); if(nx<=pv.d) o+='<text class="ax" x="'+X(nx)+'" y="'+(H-14)+'" text-anchor="middle">'+MES[(mm+1)%12]+'</text>'; cur=nx; }
  o+='<line x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(pr)+'" y2="'+Y(pr)+'" stroke="var(--axis)" stroke-dasharray="3 4"/><text class="ax" x="'+(Wd-R)+'" y="'+(Y(pr)-5)+'" text-anchor="end">RP '+clock(pr)+'</text>';
  o+='<line x1="'+X(HOJE)+'" x2="'+X(pv.d)+'" y1="'+Y(t0)+'" y2="'+Y(meta)+'" stroke="var(--accent)" stroke-width="2" stroke-dasharray="6 5"/>';
  o+='<circle cx="'+X(HOJE)+'" cy="'+Y(t0)+'" r="7" fill="var(--ink)" stroke="var(--card)" stroke-width="2"'+tip(clock(t0),"previsão hoje · COROS")+'/><text class="vl" x="'+(X(HOJE)+11)+'" y="'+(Y(t0)+4)+'">hoje '+clock(t0)+'</text>';
  o+='<circle cx="'+X(pv.d)+'" cy="'+Y(meta)+'" r="7" fill="var(--accent-fill)" stroke="var(--card)" stroke-width="2"'+tip(clock(meta),"meta · "+ddmm(pv.d))+'/><text class="vlr" x="'+(X(pv.d)-11)+'" y="'+(Y(meta)+4)+'" text-anchor="end">meta '+clock(meta)+'</text>';
  var gap=t0-meta, mesesR=diff(HOJE,pv.d)/30.44;
  o+='<text class="ax" x="'+L+'" y="'+(T-8)+'">↑ mais rápido · faltam '+clock(gap)+' em '+Math.round(mesesR)+' meses ≈ '+clock(gap/mesesR)+' por mês</text>';
  return '<div style="min-width:0"><p style="font-size:13px;font-weight:600;margin-bottom:4px">'+esc(pv.n)+' <span class="lbl">'+ddmm(pv.d)+'</span></p>'+vb(Wd,H,o,"Projeção para "+pv.n)+'</div>';
}
function projTrail(){
  var pa=D.paraty, kme=pa.km+pa.dplus/100, rate=pa.t/kme;
  var it=[{n:"Paraty 58K",s:"referência · 19/09/2026",kme:kme,t:pa.t,rate:rate,ref:true},
    {n:"Indomit 8h50",s:"20/03/2027 · projeta 20h",kme:D.perfis.indomit.km+D.perfis.indomit.dplus/100,t:31800},
    {n:"La Misión 20h",s:"13/08/2027 · o alvo do ano",kme:D.perfis.mision.km+D.perfis.mision.dplus/100,t:72000}];
  it.forEach(function(x){ x.rate=x.t/x.kme; });
  var Wd=480, H=26+it.length*34, L=150, R=70, mn=360, mx=540, X=function(v){return L+(v-mn)/(mx-mn)*(Wd-L-R);}, o="";
  [360,420,480,540].forEach(function(v){ o+='<line class="gl" x1="'+X(v)+'" x2="'+X(v)+'" y1="14" y2="'+(H-16)+'"/><text class="ax" x="'+X(v)+'" y="'+(H-4)+'" text-anchor="middle">'+pace(v)+'</text>'; });
  o+='<line x1="'+X(rate)+'" x2="'+X(rate)+'" y1="10" y2="'+(H-16)+'" stroke="var(--axis)" stroke-dasharray="3 4"/>';
  it.forEach(function(x,i){ var y=28+i*34, w=X(x.rate)-L;
    o+='<text class="lb" x="0" y="'+(y+4)+'" style="font-weight:600;fill:var(--ink)">'+x.n+'</text><text class="ax" x="0" y="'+(y+17)+'">'+x.s+'</text>';
    o+='<path d="'+rowPath(L,y-7,Math.max(2,w),14,5)+'" fill="'+(x.ref?'var(--axis)':x.rate<rate?'var(--accent-fill)':'var(--ink)')+'"'+tip(pace(x.rate)+" por km-esforço",Math.round(x.kme)+" km-esforço · "+hhmm(x.t))+'/>';
    o+='<text class="vl" x="'+(X(x.rate)+8)+'" y="'+(y+4)+'">'+pace(x.rate)+(x.ref?'':' · '+(x.rate<rate?'−':'+')+Math.round(Math.abs(1-x.rate/rate)*100)+'%')+'</text>'; });
  return '<div style="min-width:0"><p style="font-size:13px;font-weight:600;margin-bottom:4px">Trilha · ritmo por km-esforço <span class="lbl">min por (km + D+/100)</span></p>'+vb(Wd,H,o,"Ritmo por km-esforço em trilha")+'<p class="note">Paraty 58K com 3.320 m D+ em 12h30 dá '+pace(rate)+' por km-esforço. As duas metas pedem a mesma coisa: ficar '+Math.round((1-it[2].rate/rate)*100)+'% mais rápido por km-esforço, e na La Misión sustentar isso pelo dobro da distância.</p></div>';
}

/* corpo */
function hrvChart(){
  var S=WH, n=S.length, Wd=1000, H=250, L=34, R=40, T=18, B=34, mn=35, mx=100, X=function(i){return L+i/(n-1)*(Wd-L-R);}, Y=function(v){return T+(1-(v-mn)/(mx-mn))*(H-T-B);}, o="";
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
  var S=W.filter(function(x){return x.rhr!=null;}), n=S.length, Wd=1000, H=250, L=34, R=40, T=18, B=34, mn=38, mx=58, X=function(i){return L+i/(n-1)*(Wd-L-R);}, Y=function(v){return T+(1-(v-mn)/(mx-mn))*(H-T-B);}, o="";
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
function sonoChart(){
  var Wd=1000, H=260, L=30, R=8, T=26, B=36, mx=9*60, n=SONO.length, bw=(Wd-L-R)/n, Y=function(m){return T+(1-m/mx)*(H-T-B);}, o="";
  [0,3,6,9].forEach(function(h){ o+='<line class="gl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(h*60)+'" y2="'+Y(h*60)+'"/><text class="ax" x="'+(L-6)+'" y="'+(Y(h*60)+3.5)+'" text-anchor="end">'+h+'h</text>'; });
  var ST=[["Profundo",4,"var(--s-deep)"],["REM",6,"var(--s-rem)"],["Leve",5,"var(--s-light)"],["Acordado",7,"var(--s-awake)"]];
  SONO.forEach(function(s,i){ var w=Math.min(26,bw*.6), x=L+i*bw+(bw-w)/2, yb=Y(0);
    ST.forEach(function(st,k){ var m=s[3]*s[st[1]]/100, h=Y(0)-Y(m); if(h<.5) return; var y=yb-h; o+='<path d="'+(k===ST.length-1?colPath(x,y,w,h-2,4):'M'+x+','+y+'h'+w+'v'+(h-2)+'h-'+w+'z')+'" fill="'+st[2]+'"'+tip(hm(m),st[0]+" · "+ddmm(s[0]))+'/>'; yb=y; });
    o+='<text class="'+(s[1]<65?'vlr':'vl')+'" x="'+(x+w/2)+'" y="'+(yb-6)+'" text-anchor="middle">'+s[1]+'</text><text class="ax" x="'+(x+w/2)+'" y="'+(Y(0)+14)+'" text-anchor="middle">'+parse(s[0]).getUTCDate()+'</text>'; });
  o+='<line class="bl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(0)+'" y2="'+Y(0)+'"/><text class="ax" x="'+L+'" y="'+(T-12)+'">Nota do sono sobre cada noite · dia de acordar</text>';
  return vb(Wd,H,o,"Sono por fase")+'<div class="legend">'+ST.map(function(s){return '<span><i style="background:'+s[2]+'"></i>'+s[0]+'</span>';}).join("")+'</div>';
}
function janelaSono(){
  /* dias no X; relógio no Y, 20h embaixo e 10h em cima. Barra = deitou → levantou. */
  var Wd=480, H=270, L=40, R=8, T=16, B=30, t0=20*60, t1=34*60, n=SONO.length, bw=(Wd-L-R)/n, Y=function(m){return T+(1-(m-t0)/(t1-t0))*(H-T-B);}, o="";
  function mc(h){ var a=h.split(":").map(Number), m=a[0]*60+a[1]; return m<12*60?m+24*60:m; }
  [20,22,24,2,4,6,8,10].forEach(function(h){ var m=(h<12?h+24:h)*60; o+='<line class="gl" x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(m)+'" y2="'+Y(m)+'"/><text class="ax" x="'+(L-6)+'" y="'+(Y(m)+3.5)+'" text-anchor="end">'+String(h%24).padStart(2,"0")+'h</text>'; });
  /* faixa de acordar 5h–6h e de deitar 21h–22h (8 h de sono) */
  o+='<rect x="'+L+'" y="'+Y(30*60)+'" width="'+(Wd-L-R)+'" height="'+(Y(29*60)-Y(30*60))+'" fill="var(--good)" opacity=".10"/><text class="ax" x="'+(Wd-R)+'" y="'+(Y(30*60)-3)+'" text-anchor="end" style="fill:var(--good-text)">acordar 5h–6h</text>';
  o+='<rect x="'+L+'" y="'+Y(22*60)+'" width="'+(Wd-L-R)+'" height="'+(Y(21*60)-Y(22*60))+'" fill="var(--good)" opacity=".10"/><text class="ax" x="'+(Wd-R)+'" y="'+(Y(21*60)+11)+'" text-anchor="end" style="fill:var(--good-text)">deitar 21h–22h · 8 h</text>';
  o+='<line x1="'+L+'" x2="'+(Wd-R)+'" y1="'+Y(23*60)+'" y2="'+Y(23*60)+'" stroke="var(--accent)" stroke-width="1.2" stroke-dasharray="4 3"/><text class="ax" x="'+(L+4)+'" y="'+(Y(23*60)-4)+'" style="fill:var(--accent)">23h · limite para 7 h</text>';
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
  var it=[["watch","var(--ink)","COROS PACE 3","Relógio · sono, HRV, FC, treinos"],["pulse","var(--accent-fill)","intervals.icu","Fitness, fadiga, forma · recebe o plano para o relógio"],["arrow","var(--rua)","Strava","Treinos públicos, tênis e RPs"],["iron","var(--trilha)","Academia Ultra · Vila Mariana","Wellhub Silver"],["drop","var(--esteira)","Mochila de hidratação","a definir · entra no Bloco 2"]];
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
function heroBlock(){
  var ind=AS[0], c=parts(alvoTs(ind)), foto=FOTOS.hero;
  return '<section class="hero"><div class="bg">'+(foto?'<img alt="Gabriel treinando" src="'+foto+'">':topo())+'</div><div class="shade"></div><div class="swap"><label class="btn mini">'+ic("cam")+(foto?'Trocar foto':'Colocar foto')+'<input class="up" type="file" accept="image/*" data-foto="hero"></label></div>'
    +'<div class="tx"><div><p class="eb">Gabriel Mendes · trail e ultra · São Paulo</p><h1>Rumo à <em>Indomit</em></h1><div class="chips"><span>INDOMIT Pedra do Baú 50K</span><span>20.03.27 · 05h</span><span>Meta 8h50</span><span>Rumo às 20h na La Misión</span></div></div>'
    +'<div class="cds num">'+[["d",c.d,"dias"],["h",c.h,"horas"],["m",c.m,"min"],["s",c.s,"seg"]].map(function(x){return '<div class="cd"><b data-cd="'+x[0]+':'+ind.d+'">'+(x[0]==="d"?x[1]:String(x[1]).padStart(2,"0"))+'</b><span>'+x[2]+'</span></div>';}).join("")+'</div></div></section>';
}
function destaques(){
  var s=last(SONO), h=last(HRV7), fz=last(serieFit(FSRC));
  var it=[["Fitness",fz.f.toFixed(0),'forma '+(fz.f-fz.a>=0?'+':'')+(fz.f-fz.a).toFixed(0)+' · fadiga '+fz.a.toFixed(0),spark(serieFit(FSRC).slice(-30).map(function(x){return x.f;}),200,30,"var(--ink)","var(--accent-fill)")],
    ["Rodado no ciclo",k1(KM_CICLO)+'<small style="font-size:14px;color:var(--muted)"> km</small>',k1(PCT*100)+'% de '+thou(PLAN_KM)+' km','<div class="meter"><i style="width:'+Math.max(2,PCT*100)+'%;background:var(--accent-fill)"></i></div>'],
    ["HRV da noite",h[1]+'<small style="font-size:14px;color:var(--muted)"> ms</small>',h[5]+' do normal',spark(WH.slice(-14).map(function(x){return x.hrv;}),200,30,"var(--good)")],
    ["Sono",String(s[1]),hm(s[2])+' dormindo',spark(SONO.map(function(x){return x[1];}),200,30,"var(--s-rem)")],
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
var WK=Math.max(0,Math.min(24,semIdx(HOJE))), TR_TAB=store("trtab")||"corrida";
function vHoje(){
  var pd=plan(HOJE), w=WK, sem=P.semanas[w], s=last(SONO), fz=last(serieFit(FSRC));
  var k=kpi("flag","Próxima prova",'<span data-cd="d:'+NEXT.d+'">'+parts(alvoTs(NEXT)).d+'</span>',"dias",'<span class="pill red">'+esc(NEXT.c)+'</span>','var(--accent)')
    +kpi("bolt","Prontidão",PRON.n,NIV[PRON.n][0],'','var(--good-text)')
    +kpi("pulse","Forma",(fz.f-fz.a>=0?"+":"")+(fz.f-fz.a).toFixed(0),"fitness "+fz.f.toFixed(0))
    +kpi("moon","Sono",s[1],hm(s[2]),'','var(--s-rem)');
  return hello(saudacao()+", Gabriel",dataLonga(HOJE)+" · Semana "+(w+1)+" de 25 · "+sem.b+" "+blocoNome(sem.b),k)
    +'<div class="grid">'
    +card("c5","Treino de hoje",sessoes(pd),pd?pd.bloco+" · "+blocoNome(pd.bloco):"")
    +'<article class="card c3" id="pront">'+prontCard()+'</article>'
    +'<article class="card c4">'+proxCard()+'</article>'
    +'<article class="card c8" id="semcard">'+semana(WK)+'</article>'
    +card("c4","Precisa de você",atencao())
    +'<article class="card c8"><div class="ch"><h2>Fitness e forma</h2><div class="r">'+fitnessSeg()+'</div></div>'+fitness(240)+'</article>'
    +card("c4","Registro",feed(8),"relógio")
    +card("c12","Carga por dia",heat(10,10),"carga de treino · vermelho é esforço")
    +'</div>';
}

function vTreino(){
  var w=WK, wd=semanaDone(w), seg='<div class="seg" role="group" aria-label="Corrida ou força"><button type="button" data-tr="corrida" aria-pressed="'+(TR_TAB==="corrida")+'">Corrida</button><button type="button" data-tr="forca" aria-pressed="'+(TR_TAB==="forca")+'">Força</button></div>';
  if(TR_TAB==="corrida"){
    var k=kpi("run","Semana",k1(wd),"de "+P.semanas[w].km+" km",'','var(--rua)')+kpi("mtn","Ciclo",k1(KM_CICLO),"de "+thou(PLAN_KM)+" km")+kpi("incl","Limiar · relógio",FIT.limiar,"/km",'<span class="pill">espirométrico a marcar</span>')+kpi("flag","Próxima prova",diff(HOJE,NEXT.d),"dias · "+NEXT.c,'','var(--accent)');
    return hello("Treino · corrida","Semana "+(w+1)+" de 25 · "+P.semanas[w].b+" "+blocoNome(P.semanas[w].b),k)+'<div style="margin-bottom:14px">'+seg+'</div><div class="grid">'
      +card("c12","Calendário do bloco",periodizacao(200,true),"25 semanas · marcos e provas")
      +card("c8","Volume semanal",volume(230),"km")+card("c4","Terreno",terreno())
      +card("c12","Previsto × realizado",auditoria(10,"c"),"últimos 10 dias")+'</div>';
  }
  var F=D.strava.forca.filter(function(f){return f.d>=P.inicio;}), feitas=Object.keys(FZ).filter(function(d){return d>=P.inicio&&d<=HOJE;}).length, plan10=0; for(var d=P.inicio;d<=HOJE;d=add(d,1)){ var pd=plan(d); if(pd&&pd.fz) plan10++; }
  var tot=F.reduce(function(s,f){return s+tonelagem(f);},0), sets=F.reduce(function(s,f){return s+f.sets.length;},0), planTot=0; P.semanas.forEach(function(s,i){ s.d.forEach(function(x,j){ var fz=x[5]!==null?(x[5]||null):P.forcaDia[D7[j]]; if(fz&&P.forca[fz]&&!provaEm(add(P.inicio,i*7+j))) planTot++; }); });
  var k2=kpi("iron","Sessões no ciclo",feitas,"de "+plan10+" previstas até hoje",'<span class="pill">'+planTot+' no ciclo</span>')+kpi("bolt","Séries no ciclo",sets,"")+kpi("scale","Carga deslocada",(tot/1000).toFixed(1),"t no ciclo")+kpi("mtn","Maior sessão",F.length?(Math.max.apply(null,F.map(tonelagem))/1000).toFixed(1):"—","t");
  return hello("Treino · força","Rodízio de seis, abdominal todo dia",k2)+'<div style="margin-bottom:14px">'+seg+'</div><div class="grid">'
    +card("c8","Carga deslocada por sessão",volForca(),"Strava · kg × repetições")+card("c4","Por grupo muscular",volGrupo(),"no ciclo")
    +card("c7","Séries por sessão",seriesForca(),"prescrição 17")+card("c5","Previsto × realizado",auditoria(10,"f"),"últimos 10 dias")+'</div>';
}
function vCiclo(){
  var w=WK, seg='<div class="seg light" role="group" aria-label="Prova"><button type="button" data-perfil="indomit" aria-pressed="'+(PK==="indomit")+'">Indomit 50K</button><button type="button" data-perfil="mision" aria-pressed="'+(PK==="mision")+'">La Misión 110K</button></div>';
  var k=kpi("cal","Semana",w+1,"de 25")+kpi("mtn","Planejado",thou(PLAN_KM),"km")+kpi("run","Rodado",k1(KM_CICLO),"km",'','var(--rua)')+kpi("flag","Do caminho",k1(PCT*100),"%",'','var(--accent)');
  return hello("O ciclo","28/09/2026 → 20/03/2027 · cada km do ciclo anda no percurso",k)+'<div class="grid">'
    +'<article class="card c12"><div class="ch"><h2>Percurso</h2><div class="r">'+seg+'</div></div>'+percursoStats(PK)+percurso(PK,260)+'</article>'
    +card("c8","Periodização",periodizacao(200,true),"blocos, volume, marcos e provas")+card("c4","Marcos",marcos())
    +'<article class="card c12"><div class="ch"><h2>Projeção</h2><span class="m">atualiza a cada sincronia</span></div>'+projNumeros()+'<div class="grid" style="gap:16px"><div class="c4">'+projCurva("21k")+'</div><div class="c4">'+projCurva("42k")+'</div><div class="c4">'+projTrail()+'</div></div></article>'
    +'</div>';
}
function vCorpo(){
  var lc=last(WC), k=kpi("pulse","VO₂max",FIT.vo2,"",'','var(--good-text)')+kpi("scale","Peso",D.atleta.peso,"kg")+kpi("incl","Limiar",FIT.limiar,"/km")+kpi("heart","FC de repouso",last(W.filter(function(x){return x.rhr!=null;})).rhr,"bpm");
  return hello("Corpo","Leitura do relógio · "+dm(HOJE),k)+'<div class="grid">'
    +card("c6","HRV noturno",hrvChart(),WH.length+" noites")+card("c6","FC de repouso",fcChart(),W.filter(function(x){return x.rhr!=null;}).length+" dias")
    +card("c7","Sono por fase",sonoChart(),"14 noites")+card("c5","Hora de deitar e levantar",janelaSono()+sonoMeta(),"7 h mínimo · 8 h ideal · 9 h sonho")
    +card("c7","Previsões e RPs",projNumeros(),"COROS · Strava")
    +card("c5","Pendências",'<div class="list">'+((PRIV&&PRIV.pendencias)||[]).map(function(x){return '<div class="li">'+sq(x[1],x[0])+'<div><p class="lt">'+x[2]+'</p><p class="ls">'+x[3]+'</p></div><span class="pill">pendente</span></div>';}).join("")+'</div>')+'</div>';
}
function vAgenda(){
  var k=kpi("flag","Próxima prova",diff(HOJE,NEXT.d),"dias",'<span class="pill">'+esc(NEXT.c)+'</span>','var(--accent)')+kpi("mtn","Provas A",AS.length,"no ano")+kpi("cal","Provas",D.provas.length,"no calendário");
  return hello("Agenda","Treino de cada dia e a temporada inteira",k)+'<div class="grid"><article class="card c8" id="mescard">'+mes()+'</article>'+card("c4","Próximas provas",proximas())+card("c12","Temporada 2026–27",temporada(),"outubro a setembro")+'</div>';
}
function vKit(){
  var L=tenisLista(), k=kpi("run","Em uso",L.ultimos.length,"pares")+kpi("mtn","Todos",L.todos.length,"pares no Strava")+kpi("watch","Relógio","PACE 3","COROS");
  return hello("Kit","Tênis, relógio e suplemento",k)+'<div class="grid"><article class="card c12" id="kitcard"><div class="ch"><h2>Rotação de tênis</h2><span class="m">Strava</span></div>'+tenis(false,KIT_TAB)+'</article>'+card("c5","O que uso",usoKit())+card("c7","Suplemento por sessão",suplementos(),"com o nutricionista · visível no público")+'</div>';
}
function nutriRows(){ return (PRIV&&PRIV.nutricao)||[]; }
function nutriBloco(){
  var rows=nutriRows(), n0=function(v){return Math.round(v).toLocaleString("pt-BR");}, lit=function(ml){return (ml/1000).toFixed(1).replace(".",",");};
  var st=function(k,v,u){return '<div><span class="k">'+k+'</span><span class="v">'+(v==null?'—':n0(v)+'<small> '+u+'</small>')+'</span></div>';};
  if(!rows.length) return '<div class="stat3">'+st("Calorias",null)+st("Carboidrato",null)+st("Proteína",null)+st("Água",null)+'</div>'
    +'<div class="list" style="margin-top:12px"><div class="li">'+sq("var(--ink)","food")+'<div><p class="lt">1 · MyFitnessPal grava no Apple Health</p><p class="ls">MyFitnessPal › Mais › Apps e dispositivos › Apple Health: ligar nutrição, água e peso.</p></div></div>'
    +'<div class="li">'+sq("var(--ink)","drop")+'<div><p class="lt">2 · Health Auto Export manda para o Prumo</p><p class="ls">Automação REST API, todo dia, com dietary_energy, carbohydrates, protein, total_fat, dietary_water e weight_body_mass → POST /api/nutricao com a chave do modo privado.</p></div></div>'
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
function vNutri(){
  var rows=nutriRows(), r=rows[rows.length-1];
  var k=kpi("food","Calorias",r&&r.kcal!=null?Math.round(r.kcal).toLocaleString("pt-BR"):"—",r?(r.d===HOJE?"kcal · hoje":"kcal · "+ddmm(r.d)):"sem registro")+kpi("drop","Água",r&&r.agua!=null?(r.agua/1000).toFixed(1).replace(".",",")+" L":"—",r?"MyFitnessPal":"sem registro")+kpi("scale","Peso",r&&r.peso!=null?String(r.peso).replace(".",","):D.atleta.peso,"kg");
  return hello("Nutrição","O que o treino precisa saber da cozinha",k)+'<div class="grid">'
    +card("c6","Registro do dia",nutriBloco(),rows.length?"MyFitnessPal · Apple Health":"como conectar")
    +card("c6","Regras decididas",'<div class="list"><div class="li">'+sq("var(--accent-fill)","drop")+'<div><p class="lt">Comer a cada 40 min no longão</p><p class="ls">A partir do Bloco 2, mesmo sem fome. É ensaio de prova.</p></div></div><div class="li">'+sq("var(--rua)","drop")+'<div><p class="lt">Beber pelo relógio, não pela sede</p><p class="ls">A quebra de 2025 foi desidratação e cãibra no km 23.</p></div></div><div class="li">'+sq("var(--ink)","food")+'<div><p class="lt">Carboidrato de treino fica fora do déficit</p><p class="ls">O que entra no longão e no limiar não conta contra o dia.</p></div></div></div>')
    +card("c7","Ensaio do longão",fuelLine(),"3 horas")+card("c5","Suplemento por sessão",suplementos(),"a definir")+'</div>';
}
function vPublico(){
  return heroBlock()+'<div style="margin:16px 0">'+destaques()+'</div><div class="grid">'
    +card("c4","Treino de hoje",sessoes(plan(HOJE),true),(plan(HOJE)||{}).bloco)
    +'<article class="card c4">'+prontCard(true)+'</article>'
    +'<article class="card c4">'+proxCard()+'</article>'
    +'<article class="card c12"><div class="ch"><h2>Percurso</h2><span class="m">'+k1(PCT*100)+'% do caminho · traçado oficial</span></div>'+percurso("indomit",240)+'</article>'
    +'<article class="card c12"><div class="ch"><h2>Fitness e forma</h2><div class="r">'+fitnessSeg()+'</div></div>'+fitness(240)+'</article>'
    +'<article class="card c12">'+semana(WK,true)+'</article>'
    +'<article class="card c12"><div class="ch"><h2>Projeção</h2><span class="m">previsão do relógio · RPs · metas</span></div>'+projNumeros()+'<div class="grid" style="gap:16px"><div class="c4">'+projCurva("21k")+'</div><div class="c4">'+projCurva("42k")+'</div><div class="c4">'+projTrail()+'</div></div></article>'
    +card("c6","Treinos recentes",treinosPublicos(),"Strava")+card("c6","No Instagram",instagram(),"@mendesgabriell")
    +'<article class="card c12" id="kitcard"><div class="ch"><h2>Rotação de tênis</h2><span class="m">Strava</span></div>'+tenis(true,KIT_TAB)+'</article>'
    +card("c12","Carga por dia",heat(12,14))
    +card("c12","Temporada 2026–27",temporada())
    +card("c12","Como funciona",comoFunciona())
    +'</div><div class="foot"><span>Prumo · mede antes de opinar</span><span>dados: COROS · intervals.icu · Strava · '+dm(HOJE)+'</span></div>';
}

/* =========================================================================
   SHELL E INTERAÇÃO
   ========================================================================= */
var VIEW={hoje:vHoje,treino:vTreino,ciclo:vCiclo,corpo:vCorpo,agenda:vAgenda,kit:vKit,nutri:vNutri};
var TABS=[["hoje","Hoje"],["treino","Treino"],["ciclo","Ciclo"],["corpo","Corpo"],["agenda","Agenda"],["kit","Kit"],["nutri","Nutrição"]];
var MODO=PRIV?(store("modo")||"priv"):"pub", ATUAL="hoje", tabsEl=document.getElementById("tabs"), viewEl=document.getElementById("view");
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
  if(t.dataset.wk!==undefined){ var w=+t.dataset.wk; if(w>=0&&w<P.semanas.length){ WK=w; var c=document.getElementById("semcard"); if(c) c.innerHTML=semana(WK); } return; }
  if(t.dataset.mes){ var y=+MES_VER.slice(0,4), m=+MES_VER.slice(5,7)-1+(+t.dataset.mes), s=iso(new Date(Date.UTC(y,m,1))).slice(0,7); if(s>="2026-09"&&s<="2027-09"){ MES_VER=s; store("mes",s); var mc=document.getElementById("mescard"); if(mc) mc.innerHTML=mes(); } return; }
  if(t.dataset.perfil){ PK=t.dataset.perfil; store("perfil",PK); render(true); return; }
  if(t.dataset.kit){ KIT_TAB=t.dataset.kit; store("kittab",KIT_TAB); render(true); return; }
  if(t.dataset.tr){ TR_TAB=t.dataset.tr; store("trtab",TR_TAB); render(); return; }
  if(t.dataset.fsrc){ FSRC=t.dataset.fsrc; store("fsrc",FSRC); PRON=prontidao(); render(true); return; }
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
var tema=store("tema"); if(tema) document.documentElement.setAttribute("data-theme",tema);
var h0=(location.hash||"").replace("#",""); if(VIEW[h0]) ATUAL=h0;
render();
})();
