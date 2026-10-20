import Link from 'next/link';
export default function AppHeader({title,subtitle,actions}:{title:string,subtitle?:string,actions?:React.ReactNode}){return <header className="topbar"><div><div className="tag">IGRI TELECOM • OPERAÇÃO TÉCNICA</div><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div><div className="nav">{actions}<Link className="btn secondary" href="/">Início</Link></div></header>}
