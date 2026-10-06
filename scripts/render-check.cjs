// roda os scripts do dash contra um DOM mínimo e confere o que foi desenhado
const fs=require('fs');
const html=fs.readFileSync(process.argv[2],'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const store={};
function el(id){
  return store[id] || (store[id]={ id, innerHTML:'', textContent:'', children:[], hidden:false,
    dataset:{}, style:{}, setAttribute(k,v){this[k]=v;}, getAttribute(k){return this[k];},
    addEventListener(){}, appendChild(c){this.children.push(c);}, scrollIntoView(){},
    classList:{add(){},remove(){},toggle(){}}, getBoundingClientRect(){return{left:0,top:0,width:900};},
    get parentElement(){return el('__box');}, querySelectorAll(){return [];} });
}
global.window={ scrollTo(){}, claude:undefined, addEventListener(){} };
global.document={
  getElementById:el,
  querySelector:(s)=>el('q:'+s),
  querySelectorAll:(s)=>[],
  createElement:(t)=>({ tagName:t, dataset:{}, innerHTML:'', type:'', children:[],
    setAttribute(k,v){this[k]=v;}, addEventListener(){}, appendChild(c){this.children.push(c);} }),
};
global.location={hash:''};
global.history={replaceState(){}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
let erro=null;
scripts.forEach((src,i)=>{ try{ (0,eval)(src); }catch(e){ erro=erro||('script '+(i+1)+': '+e.message); } });
if(erro){ console.log('FALHOU —', erro); process.exit(1); }
const grade=store['sem7']?store['sem7'].innerHTML:'';
const dias=(grade.match(/class="dn"/g)||[]).length;
const checks=(grade.match(/class="chk"/g)||[]).length;
const sess=(grade.match(/class="ses/g)||[]).length;
console.log('grade da semana :', dias, 'dias ·', sess, 'sessões ·', checks, 'checks');
console.log('nomes           :', (grade.match(/>(Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo)</g)||[]).map(x=>x.slice(1,-1)).join(' '));
console.log('contador        :', store['dica']?store['dica'].innerHTML.replace(/<[^>]+>/g,''):'(vazio)');
console.log('exercícios força:', (store['fex']?store['fex'].innerHTML.match(/<li/g)||[]:[]).length);
console.log('passos corrida  :', (store['cpassos']?store['cpassos'].innerHTML.match(/<li/g)||[]:[]).length);
if(dias!==7||checks<10){ console.log('ERRO: grade incompleta'); process.exit(1); }
console.log('OK');
