import React,{useEffect,useState} from "react";
import {Search,ShieldAlert,Phone,WalletCards,MessageSquare,CheckCircle2,DatabaseZap} from "lucide-react";
import "./ScamIntelligence.css";

const API="/api/ai";
const token=()=>localStorage.getItem("token")||localStorage.getItem("fraudshield-token")||localStorage.getItem("authToken")||"";
async function req(path,options={}){const r=await fetch(`${API}${path}`,{...options,headers:{"Content-Type":"application/json",Authorization:`Bearer ${token()}`,...(options.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||`Request failed (${r.status})`);return d;}

export default function ScamIntelligence({onBack}){
 const [tab,setTab]=useState("message"); const [query,setQuery]=useState(""); const [result,setResult]=useState(null); const [stats,setStats]=useState(null); const [loading,setLoading]=useState(false); const [error,setError]=useState("");
 useEffect(()=>{req("/intelligence-stats").then(setStats).catch(()=>{});},[]);
 async function analyze(){if(!query.trim())return;setLoading(true);setError("");setResult(null);try{if(tab==="message"){setResult(await req("/message-analysis",{method:"POST",body:JSON.stringify({text:query})}));}else{setResult(await req("/intelligence-search",{method:"POST",body:JSON.stringify({query,kind:tab})}));}}catch(e){setError(e.message)}finally{setLoading(false)}}
 const score=result?.risk_score??null;
 return <div className="intel-page">
  <div className="intel-head"><div><div className="eyebrow">PROTECTION INTELLIGENCE</div><h1>Scam & Fraud Intelligence</h1><p>One place to analyze suspicious messages and verify phone numbers or UPI beneficiaries.</p></div><button className="ghost" onClick={onBack}>← Dashboard</button></div>
  <div className="intel-stats"><div><DatabaseZap/><b>{stats?.message_examples??1200}</b><span>message patterns</span></div><div><ShieldAlert/><b>{stats?.intelligence_records??1200}</b><span>demo intelligence records</span></div><div><CheckCircle2/><b>HF</b><span>semantic classifier</span></div></div>
  <div className="intel-tabs">{[["message",MessageSquare,"Message / SMS"],["phone",Phone,"Phone number"],["upi",WalletCards,"UPI ID"]].map(([k,I,l])=><button key={k} className={tab===k?"active":""} onClick={()=>{setTab(k);setResult(null);setError("")}}><I size={18}/>{l}</button>)}</div>
  <div className="intel-card"><label>{tab==="message"?"Paste the suspicious message":"Enter the beneficiary identifier"}</label><div className="searchbox"><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&analyze()} placeholder={tab==="message"?"e.g. Your KYC will expire today. Share OTP now…":tab==="upi"?"e.g. fraud-demo-0042@fraudshield.test":"e.g. +91-00000-0042"}/><button onClick={analyze} disabled={loading}><Search size={18}/>{loading?"Checking…":"Analyze"}</button></div>{error&&<div className="error">{error}</div>}
  {result&&tab==="message"&&<div className="result"><div className="score" data-level={result.risk_level}><strong>{result.risk_score}</strong><span>/100 · {result.risk_level}</span></div><div><h3>{result.recommended_action?.replaceAll("_"," ")}</h3><p>Score combines explicit social-engineering signals with the Hugging Face scam classifier; the model is treated as one signal, not the sole decision maker.</p>{(result.signals||[]).map((s,i)=><div className="signal" key={i}><b>{s.title}</b><span>{s.detail}</span></div>)}</div></div>}
  {result&&tab!=="message"&&<div className="result"><div className="match-icon"><ShieldAlert/></div><div><h2>{result.matched?"Suspicious intelligence match":"No demo intelligence match"}</h2><p>{result.matched?"This identifier appears in the FraudShield intelligence corpus and should be verified through an official channel.":"No matching record was found in the current corpus. A no-match is not proof that an identifier is safe."}</p>{(result.results||[]).slice(0,5).map((r,i)=><div className="signal" key={i}><b>{r.value}</b><span>{r.kind.toUpperCase()} · {r.label} · risk {r.risk_score}</span></div>)}</div></div>}
  </div>
  <div className="intel-note"><ShieldAlert size={20}/><span><b>Production intelligence:</b> demo identifiers are synthetic. For real-world verification, use an authorized intelligence feed or the <a href="https://www.cybercrime.gov.in/Webform/suspect_search_repository.aspx" target="_blank" rel="noreferrer">I4C Suspect Repository</a>. A match is a risk signal, not proof of guilt, and a no-match is not proof of safety.</span></div>
 </div>
}
