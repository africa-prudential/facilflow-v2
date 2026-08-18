import { useState } from "react";
import { Zap, PartyPopper } from "lucide-react";
import { C, btn, card } from "../theme.js";
import { EnvTag, RiskTag, PageTitle, TH, Empty } from "../components/ui.jsx";
import { humanize } from "../utils.js";
import CRDetail from "./forms/CRDetail.jsx";

export default function CRApprovals({ctx}){
  const {crs,advanceCR,users,myChangeRoles,approvalLevels,me}=ctx;
  const myRoles = myChangeRoles||[];
  const [detail,setDetail]=useState(null);

  const isLineMgr = me.role==="line_manager";
  const lineMgrQueue = crs.filter(c=>c.status==="pending_line_manager" && users[c.initiator]?.dept===me.dept);
  const isMgr = myRoles.includes("change_manager");
  const mgrQueue = crs.filter(c=>c.status==="pending_manager");
  const emrg = crs.filter(c=>c.is_emergency&&c.status==="pending_manager");

  // Distinct approval levels this user actually holds a role for, in order.
  const myLevels = [...new Map(
    (approvalLevels||[])
      .filter(l=>myRoles.includes(l.role_key))
      .map(l=>[`${l.level_order}:${l.role_key}`, l])
  ).values()].sort((a,b)=>a.level_order-b.level_order);

  const queues = [
    ...(isLineMgr ? [{title:"Line Manager Queue", queue:lineMgrQueue, onApprove:id=>advanceCR(id,"approve_line_manager")}] : []),
    ...(isMgr ? [{title:"Change Manager Queue", queue:mgrQueue, onApprove:id=>advanceCR(id,"approve_manager")}] : []),
    ...myLevels.map(l=>({
      title: `${l.name||`Level ${l.level_order}`} Queue`,
      queue: crs.filter(c=>c.current_stage===`pending_level_${l.level_order}`),
      onApprove: id=>advanceCR(id,"approve_level"),
    })),
  ];

  return (
    <div>
      <PageTitle title="CR Approvals" sub="Change manager and approval-level queues"/>
      {emrg.length>0&&(
        <div style={{...card(0),border:`1.5px solid ${C.red}`,marginBottom:16}}>
          <div style={{padding:"11px 16px",background:C.redBg,borderBottom:`1px solid ${C.red}30`,fontSize:13,fontWeight:700,color:C.red,display:"flex",alignItems:"center",gap:6}}><Zap size={14}/> Emergency Changes — Immediate Action Required</div>
          {emrg.map((c,i)=>(
            <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",borderBottom:i<emrg.length-1?`1px solid #FAFAFA`:"none"}}>
              <div><div style={{fontSize:13,fontWeight:700,color:C.ink}}>{c.title}</div><div style={{fontSize:11,color:C.muted}}>{c.id} · {users[c.initiator]?.name}</div></div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>setDetail(c)} style={{...btn("ghost"),fontSize:11,padding:"4px 9px"}}>Details</button>
                {isMgr&&<button onClick={()=>advanceCR(c.id,"approve_manager","Emergency approved")} style={{...btn("danger"),fontSize:11,padding:"4px 9px"}}><Zap size={14}/> Approve</button>}
              </div>
            </div>
          ))}
        </div>
      )}
      {queues.map(({title,queue,onApprove})=>(
        <div key={title} style={{...card(0),marginBottom:16}}>
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,fontSize:13,fontWeight:700,color:C.ink}}>{title} ({queue.length})</div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <TH cols={["CR ID","Title","Type","Risk","Environment","Requested By",""]}/>
            <tbody>
              {queue.length===0?<tr><td colSpan={7}><Empty icon={<PartyPopper size={32}/>} title="Queue is empty"/></td></tr>
              :queue.map((c,i)=>(
                <tr key={c.id} style={{borderBottom:i<queue.length-1?`1px solid #FAFAFA`:"none"}}>
                  <td style={{padding:"11px 14px",fontSize:11,fontWeight:700}}>{c.id}</td>
                  <td style={{padding:"11px 14px",fontSize:12,maxWidth:200,color:C.ink}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.title}</div></td>
                  <td style={{padding:"11px 14px",fontSize:11,color:C.muted}}>{humanize(c.change_type)}</td>
                  <td style={{padding:"11px 14px"}}><RiskTag r={c.risk_level}/></td>
                  <td style={{padding:"11px 14px"}}><EnvTag e={c.environment}/></td>
                  <td style={{padding:"11px 14px",fontSize:11,color:C.muted}}>{users[c.initiator]?.name}</td>
                  <td style={{padding:"11px 14px"}}>
                    <div style={{display:"flex",gap:5}}>
                      <button onClick={()=>setDetail(c)}       style={{...btn("ghost"),fontSize:11,padding:"4px 8px"}}>View</button>
                      <button onClick={()=>setDetail(c)}       style={{...btn("ghost"),fontSize:11,padding:"4px 8px",color:C.red,borderColor:C.red+"30"}}>Reject</button>
                      <button onClick={()=>onApprove(c.id)}    style={{...btn("success"),fontSize:11,padding:"4px 8px"}}>Approve</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {detail&&<CRDetail cr={detail} onClose={()=>setDetail(null)} ctx={ctx} onAction={advanceCR}/>}
    </div>
  );
}
