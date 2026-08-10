import { useState } from "react";
import { PartyPopper } from "lucide-react";
import { C, btn, card } from "../theme.js";
import { fmtD } from "../utils.js";
import { RQChip, PageTitle, TH, Empty } from "../components/ui.jsx";
import ReqDetail from "./forms/ReqDetail.jsx";

export default function Approvals({ctx}){
  const {uid,reqs,transReq,users}=ctx;
  const [detail,setDetail]=useState(null);
  const queue = reqs.filter(r=>r.status==="pending_approval"&&r.approver_id===uid);
  const done  = reqs.filter(r=>["approved","rejected"].includes(r.status)&&r.approver_id===uid);
  return (
    <div>
      <PageTitle title="Facility Approvals" sub="Review and action pending requests"/>
      {[{title:`Pending Approval (${queue.length})`,rows:queue,pending:true},
        {title:`Actioned (${done.length})`,rows:done,pending:false}].map(({title,rows,pending})=>(
        <div key={title} style={{...card(0),marginBottom:16}}>
          <div style={{padding:"13px 16px",borderBottom:`1px solid ${C.border}`,fontSize:13,fontWeight:700,color:C.ink}}>{title}</div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <TH cols={["ID","Type","Title","Requested By","Date","Status",""]}/>
            <tbody>
              {rows.length===0?<tr><td colSpan={7}><Empty icon={<PartyPopper size={32}/>} title={pending?"No pending approvals!":"No actioned requests yet!"}/></td></tr>
              :rows.map((r,i)=>(
                <tr key={r.id} style={{borderBottom:i<rows.length-1?`1px solid #FAFAFA`:"none"}}>
                  <td style={{padding:"11px 14px",fontSize:11,fontWeight:700}}>{r.id}</td>
                  <td style={{padding:"11px 14px"}}><span style={{fontSize:11,fontWeight:600,padding:"2px 7px",borderRadius:4,background:r.type==="pool_car"?C.brandLt:C.blueBg,color:r.type==="pool_car"?C.brand:C.blue}}>{r.type==="pool_car"?"Pool Car":"Stationery"}</span></td>
                  <td style={{padding:"11px 14px",fontSize:12,color:C.ink}}>{r.title}</td>
                  <td style={{padding:"11px 14px",fontSize:12,color:C.muted}}>{users[r.submitted_by]?.name}</td>
                  <td style={{padding:"11px 14px",fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>{fmtD(r.created_at)}</td>
                  <td style={{padding:"11px 14px"}}><RQChip s={r.status}/></td>
                  <td style={{padding:"11px 14px"}}>
                    {pending
                      ?<div style={{display:"flex",gap:5}}>
                        <button onClick={()=>setDetail(r)} style={{...btn("ghost"),fontSize:11,padding:"4px 9px"}}>View</button>
                        <button onClick={()=>transReq(r.id,"rejected")} style={{...btn("ghost"),fontSize:11,padding:"4px 9px",color:C.red,borderColor:C.red+"30"}}>Reject</button>
                        <button onClick={()=>transReq(r.id,"approved")} style={{...btn("success"),fontSize:11,padding:"4px 9px"}}>Approve</button>
                       </div>
                      :<button onClick={()=>setDetail(r)} style={{...btn("ghost"),fontSize:11,padding:"4px 9px"}}>View</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {detail&&<ReqDetail req={detail} onClose={()=>setDetail(null)} ctx={ctx}/>}
    </div>
  );
}

