import { useState } from "react";
import { C, btn, card } from "../theme.js";
import { TICKET_STATUS, TICKET_PRIORITY } from "../constants.js";
import { fmtD } from "../utils.js";
import { TChip, PChip, PageTitle, TH, Empty, Filters, StatCard } from "../components/ui.jsx";
import TicketAdminModal from "./forms/TicketAdminModal.jsx";

export default function HelpdeskAdmin({ctx}){
  const {tickets,setTickets,users,updateTicketFn,addCommentFn,fetchCommentsFn,flash}=ctx;
  const [f,setF]=useState({});
  const [sel,setSel]=useState(null);

  const shown=(tickets||[]).filter(t=>{
    if(f.q && !`${t.title} ${t.description} ${t.ticketType}`.toLowerCase().includes(f.q.toLowerCase())) return false;
    if(f.status && t.status!==f.status) return false;
    if(f.type && t.ticketType!==f.type) return false;
    if(f.priority && t.priority!==f.priority) return false;
    return true;
  });

  const counts={
    open:(tickets||[]).filter(t=>t.status==="open").length,
    in_progress:(tickets||[]).filter(t=>t.status==="in_progress").length,
    resolved:(tickets||[]).filter(t=>["resolved","fulfilled","closed"].includes(t.status)).length,
    total:(tickets||[]).length,
  };

  return (
    <div>
      <PageTitle title="Helpdesk" sub="Service requests and incidents"/>
      <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:20}}>
        <StatCard label="Total Tickets" value={counts.total} color={C.blue} icon="🎫"/>
        <StatCard label="Open" value={counts.open} color={C.amber} icon="🔓"/>
        <StatCard label="In Progress" value={counts.in_progress} color={C.blue} icon="⚙"/>
        <StatCard label="Resolved / Closed" value={counts.resolved} color={C.green} icon="✓"/>
      </div>
      <Filters values={f} onChange={setF} fields={[
        {k:"q",label:"Search",w:260,ph:"Title, description…"},
        {k:"type",label:"Type",type:"select",opts:[{v:"service_request",l:"Service Request"},{v:"incident",l:"Incident"}]},
        {k:"status",label:"Status",type:"select",opts:Object.entries(TICKET_STATUS).map(([v,m])=>({v,l:m.label}))},
        {k:"priority",label:"Priority",type:"select",opts:Object.entries(TICKET_PRIORITY).map(([v,m])=>({v,l:m.label}))},
      ]}/>
      <div style={card(0)}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <TH cols={["Ticket","Type","Priority","Status","Requester","Created","Actions"]}/>
          <tbody>
            {shown.length===0
              ?<tr><td colSpan={7}><Empty icon="🎫" title="No tickets found" sub="Tickets raised by staff will appear here"/></td></tr>
              :shown.map((t,i)=>(
                <tr key={t.id} style={{borderBottom:i<shown.length-1?`1px solid #FAFAFA`:"none"}}>
                  <td style={{padding:"10px 14px",maxWidth:260}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.ink}}>{t.title}</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:2}}>#{t.id?.slice(-6)}</div>
                  </td>
                  <td style={{padding:"10px 14px"}}>
                    <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:4,
                      background:t.ticketType==="incident"?C.redBg:C.blueBg,
                      color:t.ticketType==="incident"?C.red:C.blue}}>
                      {t.ticketType==="incident"?"Incident":"Service Req"}
                    </span>
                  </td>
                  <td style={{padding:"10px 14px"}}><PChip p={t.priority}/></td>
                  <td style={{padding:"10px 14px"}}><TChip s={t.status}/></td>
                  <td style={{padding:"10px 14px",fontSize:12,color:C.muted}}>
                    {users.find(u=>u.id===t.requesterId)?.name||t.requesterId||"—"}
                  </td>
                  <td style={{padding:"10px 14px",fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>{fmtD(t.createdAt)}</td>
                  <td style={{padding:"10px 14px"}}>
                    <button onClick={()=>setSel(t)} style={{...btn("ghost"),padding:"4px 10px",fontSize:11}}>View</button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        <div style={{padding:"9px 14px",borderTop:`1px solid #FAFAFA`,fontSize:11,color:C.muted}}>{shown.length} tickets</div>
      </div>
      {sel&&<TicketAdminModal ticket={sel} users={users} onClose={()=>setSel(null)}
        onUpdate={async(id,upd)=>{ const n=await updateTicketFn(id,upd); setSel(n); flash("Ticket updated"); }}
        fetchComments={fetchCommentsFn} addComment={addCommentFn}/>}
    </div>
  );
}

