"use client";
import { useEffect, useMemo, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import Status from '@/components/Status';

export default function AtendimentoHistorico(){
  const [token,setToken]=useState('');
  const [items,setItems]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState('');
  const [status,setStatus]=useState('');

  async function load(t:string){
    setLoading(true);
    const r=await fetch('/api/attendance-history',{headers:{'x-attendance-token':t}});
    const j=await r.json();
    setLoading(false);
    if(!r.ok){alert(j.error);return}
    setItems(j.briefings||[]);
  }

  useEffect(()=>{
    const q=new URLSearchParams(window.location.search);
    const t=q.get('access')||'';
    setToken(t);
    if(t) load(t); else setLoading(false);
  },[]);

  const filtered=useMemo(()=>items.filter(x=>{
    const text=[x.protocol,x.client_name,x.address,x.attendant_name,x.profiles?.display_name].join(' ').toLowerCase();
    return (!search||text.includes(search.toLowerCase()))&&(!status||x.status===status);
  }),[items,search,status]);

  if(!token&&!loading)return <main className="shell"><AppHeader title="Acesso restrito" subtitle="Use o link exclusivo da equipe de atendimento." hideHome/><div className="card"><p>Este histórico não é público.</p></div></main>;

  return <main className="shell">
    <AppHeader title="Histórico de ordens de serviço" subtitle="Acompanhe o que foi aberto, atribuído, executado e concluído." hideHome actions={<a className="btn secondary" href={`/atendimento?access=${encodeURIComponent(token)}`}>Novo briefing</a>}/>
    <div className="card" style={{marginTop:18}}>
      <div className="formgrid">
        <div className="field"><label>Pesquisar</label><input className="input" placeholder="Cliente, protocolo, endereço ou técnico" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <div className="field"><label>Status</label><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">Todos</option><option value="pending">Aguardando técnico</option><option value="assigned">Atribuída</option><option value="in_progress">Em execução</option><option value="completed">Concluída</option></select></div>
      </div>
      {loading?<p>Carregando...</p>:<div className="tablewrap" style={{marginTop:16}}><table className="table"><thead><tr><th>Data</th><th>Protocolo</th><th>Cliente</th><th>Atendente</th><th>Técnico</th><th>Status</th><th>Conclusão</th></tr></thead><tbody>{filtered.map(x=><tr key={x.id}><td>{new Date(x.created_at).toLocaleDateString('pt-BR')}</td><td className="mono">{x.protocol}</td><td><b>{x.client_name}</b><br/><span className="muted small">{x.address}</span></td><td>{x.attendant_name||'—'}</td><td>{x.profiles?.display_name||'Não atribuído'}</td><td><Status value={x.status}/></td><td>{x.installations?.completed_at?new Date(x.installations.completed_at).toLocaleString('pt-BR'):'—'}</td></tr>)}</tbody></table>{filtered.length===0&&<p className="muted">Nenhuma ordem encontrada.</p>}</div>}
    </div>
  </main>
}
