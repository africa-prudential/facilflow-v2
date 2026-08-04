import { useState, useEffect } from "react";
import { C, btn, card } from "../theme.js";
import { TICKET_STATUS, TICKET_PRIORITY } from "../constants.js";
import { fmtD } from "../utils.js";
import { TChip, PChip, PageTitle, TH, Empty, Filters, StatCard } from "../components/ui.jsx";
import TicketAdminModal from "./forms/TicketAdminModal.jsx";

export default function HelpdeskAdmin({ctx}){
  const {tickets,setTickets,users,updateTicketFn,addCommentFn,fetchCommentsFn,flash}=ctx;
  const [f,setF]=useState({});
  const [sel,setSel]=useState(null);
  const [page,setPage]    = useState(1);
  const [pageSize,setPageSize] = useState(20);

  const shown=(tickets||[]).filter(t=>{
    if(f.q && !`${t.title} ${t.description} ${t.ticketType}`.toLowerCase().includes(f.q.toLowerCase())) return false;
    if(f.status && t.status!==f.status) return false;
    if(f.type && t.ticketType!==f.type) return false;
    if(f.priority && t.priority!==f.priority) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(shown.length/pageSize));
  const paged = shown.slice((page-1)*pageSize, page*pageSize);
  useEffect(()=>{ setPage(1); },[f,pageSize]);

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
            {paged.length===0
              ?<tr><td colSpan={7}><Empty icon="🎫" title="No tickets found" sub="Tickets raised by staff will appear here"/></td></tr>
              :paged.map((t,i)=>(
                <tr key={t.id} style={{borderBottom:i<paged.length-1?`1px solid #FAFAFA`:"none"}}>
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
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 14px",borderTop:`1px solid #FAFAFA`}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:11,color:C.muted}}>Rows per page</span>
            <select value={pageSize} onChange={e=>setPageSize(Number(e.target.value))}
              style={{fontSize:12,padding:"4px 8px",borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",color:C.ink}}>
              {[10,20,50,100].map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          {totalPages>1&&(
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              <button onClick={()=>setPage(1)} disabled={page===1} style={{...btn("ghost"),padding:"4px 8px",fontSize:12,opacity:page===1?.4:1}}>«</button>
              <button onClick={()=>setPage(p=>p-1)} disabled={page===1} style={{...btn("ghost"),padding:"4px 8px",fontSize:12,opacity:page===1?.4:1}}>‹</button>
              {Array.from({length:Math.min(5,totalPages)},(_,i)=>{
                const pg=Math.max(1,Math.min(page-2,totalPages-4))+i;
                if(pg<1||pg>totalPages) return null;
                return <button key={pg} onClick={()=>setPage(pg)} style={{...btn(pg===page?"primary":"ghost"),padding:"4px 10px",fontSize:12,minWidth:32}}>{pg}</button>;
              })}
              <button onClick={()=>setPage(p=>p+1)} disabled={page===totalPages} style={{...btn("ghost"),padding:"4px 8px",fontSize:12,opacity:page===totalPages?.4:1}}>›</button>
              <button onClick={()=>setPage(totalPages)} disabled={page===totalPages} style={{...btn("ghost"),padding:"4px 8px",fontSize:12,opacity:page===totalPages?.4:1}}>»</button>
              <span style={{fontSize:11,color:C.muted,marginLeft:6}}>Page {page} of {totalPages}</span>
            </div>
          )}
        </div>
      </div>
      {sel&&<TicketAdminModal ticket={sel} users={users} onClose={()=>setSel(null)}
        onUpdate={async(id,upd)=>{ const n=await updateTicketFn(id,upd); setSel(n); flash("Ticket updated"); }}
        fetchComments={fetchCommentsFn} addComment={addCommentFn}/>}
    </div>
  );
}

