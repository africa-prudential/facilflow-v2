import { useState } from "react";
import { Wrench, Check, CheckCircle2, Lock } from "lucide-react";
import { C, btn, card } from "../theme.js";
import { fmtD } from "../utils.js";
import { EnvTag, RiskTag, PageTitle, TH, Empty } from "../components/ui.jsx";
import CRDetail from "./forms/CRDetail.jsx";

export default function CRReview({ctx}){
  const {crs,advanceCR,users,myChangeRoles}=ctx;
  const isImpl = (myChangeRoles||[]).includes("change_implementer");
  const [detail,setDetail]=useState(null);
  const sections=[
    {title:"Pending Implementation", s:"pending_implementation",
      action:c=>isImpl?<button onClick={()=>advanceCR(c.id,"start_implementation","Implementation started")} style={{...btn("primary"),fontSize:11,padding:"4px 8px"}}><Wrench size={14}/> Start</button>:null},
    {title:"In Progress", s:"in_progress",
      action:c=>isImpl?<button onClick={()=>setDetail(c)} style={{...btn("success"),fontSize:11,padding:"4px 8px"}}><Check size={14}/> Complete</button>:null},
    {title:"Completed — Ready to Close", s:"completed",
      action:c=>isImpl?<button onClick={()=>advanceCR(c.id,"close","Change closed")} style={{...btn("ghost"),fontSize:11,padding:"4px 8px",color:C.muted}}><Lock size={14}/> Close</button>:null},
  ];
  return (
    <div>
      <PageTitle title="Change Review Board" sub="Technical scheduling and implementation management"/>
      {sections.map(({title,s,action})=>{
        const q=crs.filter(c=>c.status===s);
        return (
          <div key={s} style={{...card(0),marginBottom:14}}>
            <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,fontSize:13,fontWeight:700,color:C.ink}}>{title} ({q.length})</div>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <TH cols={["CR ID","Title","Deploy Date","Env","Risk",""]}/>
              <tbody>
                {q.length===0?<tr><td colSpan={6}><Empty icon={<CheckCircle2 size={32}/>} title="Nothing here"/></td></tr>
                :q.map((c,i)=>(
                  <tr key={c.id} style={{borderBottom:i<q.length-1?`1px solid #FAFAFA`:"none"}}>
                    <td style={{padding:"11px 14px",fontSize:11,fontWeight:700}}>{c.id}</td>
                    <td style={{padding:"11px 14px",fontSize:12,color:C.ink,maxWidth:200}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.title}</div></td>
                    <td style={{padding:"11px 14px",fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>{fmtD(c.deploy_date+"T12:00:00")}</td>
                    <td style={{padding:"11px 14px"}}><EnvTag e={c.environment}/></td>
                    <td style={{padding:"11px 14px"}}><RiskTag r={c.risk_level}/></td>
                    <td style={{padding:"11px 14px"}}>
                      <div style={{display:"flex",gap:5}}>
                        <button onClick={()=>setDetail(c)} style={{...btn("ghost"),fontSize:11,padding:"4px 8px"}}>View</button>
                        {action(c)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
      {detail&&<CRDetail cr={detail} onClose={()=>setDetail(null)} ctx={ctx} onAction={advanceCR}/>}
    </div>
  );
}
