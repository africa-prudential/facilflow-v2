import { useState } from "react";
import { Ticket } from "lucide-react";
import { C, btn, inp, card } from "../theme.js";
import { TICKET_STATUS_USER } from "../constants.js";
import { TChipU, PChipU } from "../components/ui.jsx";
import RaiseTicketModal from "./forms/RaiseTicketModal.jsx";
import ViewTicketModal from "./forms/ViewTicketModal.jsx";

export default function HelpdeskUser({ctx}){
  const {tickets,setTickets,ticketCats,createTicketFn,uploadAttachmentFn,fetchCommentsFn,addCommentFn,flash,me,crs,users}=ctx;
  const adminEmails=Object.values(users||{}).filter(u=>['admin','it_admin','super_admin'].includes(u.role)).map(u=>u.email).filter(Boolean);
  const [showRaise,setShowRaise]=useState(false);
  const [sel,setSel]=useState(null);
  const [f,setF]=useState({});

  const cats=[...new Set((ticketCats||[]).map(c=>c.category))];

  const shown=(tickets||[]).filter(t=>{
    if(f.status && t.status!==f.status) return false;
    if(f.type && t.type!==f.type) return false;
    return true;
  });

  const open=(tickets||[]).filter(t=>["open","assigned","in_progress","pending"].includes(t.status)).length;
  const resolved=(tickets||[]).filter(t=>["resolved","fulfilled","closed"].includes(t.status)).length;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
        <div>
          <h1 style={{margin:0,fontSize:20,fontWeight:800,color:C.ink,letterSpacing:"-.025em"}}>My Tickets</h1>
          <p style={{margin:"3px 0 0",fontSize:13,color:C.muted}}>Raise and track your IT service requests and incidents</p>
        </div>
        <button onClick={()=>setShowRaise(true)} style={{...btn("primary"),fontSize:12,padding:"8px 16px"}}>
          + Raise Ticket
        </button>
      </div>

      <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:20}}>
        <div style={{...card(16),flex:1,minWidth:130}}>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".07em"}}>Total</div>
          <div style={{fontSize:28,fontWeight:900,color:C.ink,marginTop:4}}>{tickets.length}</div>
        </div>
        <div style={{...card(16),flex:1,minWidth:130}}>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".07em"}}>Active</div>
          <div style={{fontSize:28,fontWeight:900,color:C.amber,marginTop:4}}>{open}</div>
        </div>
        <div style={{...card(16),flex:1,minWidth:130}}>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".07em"}}>Resolved</div>
          <div style={{fontSize:28,fontWeight:900,color:C.green,marginTop:4}}>{resolved}</div>
        </div>
      </div>

      <div style={{display:"flex",gap:10,flexWrap:"wrap",padding:"12px 14px",background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,marginBottom:16,alignItems:"flex-end"}}>
        <div style={{display:"flex",flexDirection:"column",minWidth:140}}>
          <label style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5}}>Type</label>
          <select value={f.type||""} onChange={e=>setF(v=>({...v,type:e.target.value}))} style={{...inp(),padding:"6px 9px",fontSize:12}}>
            <option value="">All Types</option>
            <option value="service_request">Service Request</option>
            <option value="incident">Incident</option>
          </select>
        </div>
        <div style={{display:"flex",flexDirection:"column",minWidth:140}}>
          <label style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5}}>Status</label>
          <select value={f.status||""} onChange={e=>setF(v=>({...v,status:e.target.value}))} style={{...inp(),padding:"6px 9px",fontSize:12}}>
            <option value="">All Statuses</option>
            {Object.entries(TICKET_STATUS_USER).map(([v,m])=><option key={v} value={v}>{m.label}</option>)}
          </select>
        </div>
        <button onClick={()=>setF({})} style={{...btn("ghost"),padding:"6px 12px",fontSize:11,alignSelf:"flex-end"}}>Clear</button>
      </div>

      {shown.length===0
        ? <div style={{...card(40),textAlign:"center"}}>
            <div style={{marginBottom:12,display:"flex",justifyContent:"center"}}><Ticket size={36}/></div>
            <div style={{fontSize:15,fontWeight:700,color:C.ink,marginBottom:6}}>No tickets yet</div>
            <div style={{fontSize:13,color:C.muted,marginBottom:20}}>Raise a ticket to get help from the IT team</div>
            <button onClick={()=>setShowRaise(true)} style={{...btn("primary")}}>Raise your first ticket</button>
          </div>
        : <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {shown.map(t=>(
              <div key={t.id} style={{...card(16),cursor:"pointer",transition:"box-shadow .15s"}}
                onClick={()=>setSel(t)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:11,fontWeight:600,padding:"1px 8px",borderRadius:4,
                        background:t.type==="incident"?C.redBg:C.blueBg,
                        color:t.type==="incident"?C.red:C.blue}}>
                        {t.type==="incident"?"Incident":"Service Request"}
                      </span>
                      <span style={{fontSize:11,color:C.muted}}>#{t.id}</span>
                    </div>
                    <div style={{fontSize:14,fontWeight:700,color:C.ink,marginBottom:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.subject}</div>
                    {t.category&&<div style={{fontSize:12,color:C.muted}}>{[t.category,t.subcategory].filter(Boolean).join(" › ")}</div>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}>
                    <TChipU s={t.status}/>
                    <PChipU p={t.priority}/>
                    <div style={{fontSize:10,color:C.muted}}>{t.created_at?new Date(t.created_at).toLocaleDateString("en-GB",{day:"2-digit",month:"short"}):"—"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
      }

      {showRaise&&<RaiseTicketModal cats={cats} ticketCats={ticketCats} me={me} crs={crs||[]} onClose={()=>setShowRaise(false)}
        uploadAttachment={uploadAttachmentFn}
        onCreate={async(data)=>{ await createTicketFn(data); setShowRaise(false); flash("Ticket raised successfully"); }}/>}
      {sel&&<ViewTicketModal ticket={sel} me={me} adminEmails={adminEmails} onClose={()=>setSel(null)}
        fetchComments={fetchCommentsFn} addComment={addCommentFn}/>}
    </div>
  );
}

