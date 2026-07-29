import { useState, useEffect, useRef } from "react";
import { C, btn, inp, card } from "../../theme.js";
import { TICKET_STATUS_USER } from "../../constants.js";
import { fmtDT } from "../../utils.js";
import { Chip, PChipU } from "../../components/ui.jsx";
import { emailTicketComment } from "../../lib/email.js";

export default function ViewTicketModal({ticket,me,adminEmails,onClose,fetchComments,addComment}){
  const [comments,setComments]=useState([]);
  const [commentText,setCommentText]=useState("");
  const [commentsLoading,setCommentsLoading]=useState(true);
  const [posting,setPosting]=useState(false);
  const bottomRef=useRef(null);

  useEffect(()=>{
    fetchComments(ticket.id)
      .then(c=>{ setComments(c||[]); setCommentsLoading(false); })
      .catch(()=>setCommentsLoading(false));
  },[ticket.id]);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[comments.length]);

  const postComment=async()=>{
    if(!commentText.trim()||posting) return;
    setPosting(true);
    try{
      const body=commentText.trim();
      const c=await addComment({ticket_id:ticket.id,body,author_type:"user"});
      setComments(p=>[...p,c]);
      setCommentText("");
      if(adminEmails?.length) emailTicketComment(adminEmails,ticket,me?.name||"Staff",body).catch(()=>{});
    }catch(e){ alert(e.message); }
    finally{ setPosting(false); }
  };

  const st=TICKET_STATUS_USER[ticket.status]||{label:ticket.status,color:C.muted,bg:"#EEF0F4"};
  const isInc=ticket.type==="incident";
  const isOpen=!["closed","resolved","fulfilled"].includes(ticket.status);
  const attachments=Array.isArray(ticket.attachments)?ticket.attachments:[];
  const catPath=[ticket.category,ticket.subcategory,ticket.item].filter(Boolean).join(" › ");
  const fmtBytes=b=>!b?"":b<1024?`${b}B`:b<1048576?`${(b/1024).toFixed(1)}KB`:`${(b/1048576).toFixed(1)}MB`;
  const PCOL={low:C.green,medium:C.blue,high:C.amber,critical:C.red};

  // Sidebar detail row
  const DR=({label,val,node})=>{
    if(!val&&!node) return null;
    return (
      <div style={{paddingBottom:10,borderBottom:`1px solid ${C.border}`}}>
        <div style={{fontSize:10,fontWeight:700,color:C.faint,textTransform:"uppercase",letterSpacing:".07em",marginBottom:4}}>{label}</div>
        <div style={{fontSize:13,color:C.ink,fontWeight:500,lineHeight:1.4}}>{node||val}</div>
      </div>
    );
  };

  useEffect(()=>{
    const handler=(e)=>{ if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",handler);
    return ()=>window.removeEventListener("keydown",handler);
  },[onClose]);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",zIndex:800,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(3px)"}}>
      <div style={{background:"#fff",borderRadius:12,width:"100%",maxWidth:860,maxHeight:"96vh",display:"flex",flexDirection:"column"}}>

        {/* ── Header ── */}
        <div style={{padding:"16px 22px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:11,color:C.muted,fontFamily:"monospace",fontWeight:600}}>{ticket.id}</span>
                <span style={{fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:4,
                  background:isInc?C.redBg:C.blueBg,color:isInc?C.red:C.blue}}>
                  {isInc?"Incident":"Service Request"}
                </span>
                {ticket.ticket_type&&<span style={{fontSize:11,fontWeight:600,padding:"2px 9px",borderRadius:4,background:C.surface,color:C.ink2}}>{ticket.ticket_type}</span>}
                <Chip label={st.label} color={st.color} bg={st.bg}/>
                {ticket.priority&&<span style={{fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:4,
                  background:(PCOL[ticket.priority]||C.muted)+"1A",color:PCOL[ticket.priority]||C.muted}}>
                  {ticket.priority.charAt(0).toUpperCase()+ticket.priority.slice(1)} Priority
                </span>}
              </div>
              <h2 style={{margin:0,fontSize:17,fontWeight:800,color:C.ink,letterSpacing:"-.02em",lineHeight:1.25}}>{ticket.subject}</h2>
              <div style={{fontSize:11,color:C.muted,marginTop:5,display:"flex",gap:14,flexWrap:"wrap"}}>
                <span>Raised {fmtDT(ticket.created_at)}</span>
                {ticket.updated_at&&<span>· Updated {fmtDT(ticket.updated_at)}</span>}
              </div>
            </div>
            <button onClick={onClose} style={{...btn("ghost"),padding:"4px 9px",borderRadius:5,flexShrink:0}}>✕</button>
          </div>
        </div>

        {/* ── Body (left content + right sidebar) ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 260px",flex:1,overflow:"hidden",minHeight:0}}>

          {/* LEFT — main content */}
          <div style={{padding:"18px 20px",overflowY:"auto",display:"flex",flexDirection:"column",gap:14}}>

            {/* Description */}
            <div style={card(14)}>
              <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Description</div>
              <p style={{fontSize:13,color:C.ink,lineHeight:1.7,margin:0,whiteSpace:"pre-wrap"}}>{ticket.description||"No description provided."}</p>
            </div>

            {/* Impact Details */}
            {ticket.impact_details&&(
              <div style={{...card(14),borderLeft:`3px solid ${C.red}`}}>
                <div style={{fontSize:10,fontWeight:700,color:C.red,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Impact Details</div>
                <p style={{fontSize:13,color:C.ink,lineHeight:1.65,margin:0,whiteSpace:"pre-wrap"}}>{ticket.impact_details}</p>
              </div>
            )}

            {/* Resolution & Root Cause */}
            {ticket.resolution_notes&&(
              <div style={{...card(14),borderLeft:`3px solid ${C.green}`}}>
                <div style={{fontSize:10,fontWeight:700,color:C.green,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Resolution</div>
                <p style={{fontSize:13,color:C.ink,lineHeight:1.65,margin:0,whiteSpace:"pre-wrap"}}>{ticket.resolution_notes}</p>
                {ticket.root_cause&&(
                  <>
                    <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",marginTop:12,marginBottom:6}}>Root Cause</div>
                    <p style={{fontSize:13,color:C.ink,lineHeight:1.65,margin:0,whiteSpace:"pre-wrap"}}>{ticket.root_cause}</p>
                  </>
                )}
              </div>
            )}

            {/* Attachments */}
            {attachments.length>0&&(
              <div style={card(14)}>
                <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>
                  Attachments ({attachments.length})
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {attachments.map((a,i)=>(
                    a.type?.startsWith("image/")
                    ?<a key={i} href={a.url} target="_blank" rel="noreferrer"
                       style={{borderRadius:7,overflow:"hidden",border:`1px solid ${C.border}`,display:"block",flexShrink:0}}>
                       <img src={a.url} alt={a.name} style={{width:84,height:84,objectFit:"cover",display:"block"}}/>
                       <div style={{padding:"4px 6px",fontSize:9,color:C.muted,maxWidth:84,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</div>
                     </a>
                    :<a key={i} href={a.url} target="_blank" rel="noreferrer"
                       style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:7,
                         border:`1px solid ${C.border}`,background:"#F8FAFC",textDecoration:"none",color:C.ink,maxWidth:220,minWidth:0}}>
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={C.muted} strokeWidth="1.4"/><polyline points="14,2 14,8 20,8" stroke={C.muted} strokeWidth="1.4"/></svg>
                       <div style={{minWidth:0}}>
                         <div style={{fontSize:12,fontWeight:600,color:C.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</div>
                         {a.size&&<div style={{fontSize:10,color:C.muted}}>{fmtBytes(a.size)}</div>}
                       </div>
                     </a>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-up & Comments */}
            <div style={card(14)}>
              <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:12}}>
                Follow-up & Comments {!commentsLoading&&comments.length>0&&`(${comments.length})`}
              </div>

              {commentsLoading
                ?<div style={{fontSize:12,color:C.muted,padding:"8px 0"}}>Loading comments…</div>
                :<div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
                   {comments.length===0&&<div style={{fontSize:12,color:C.muted,fontStyle:"italic"}}>No follow-ups yet.</div>}
                   {comments.map((c,i)=>{
                     const fromIt=c.author_type==="admin"||c.is_internal;
                     return (
                       <div key={c.id||i} style={{
                         padding:"10px 14px",borderRadius:8,
                         background:fromIt?"#EFF6FF":"#F8FAFC",
                         borderLeft:`3px solid ${fromIt?C.blue:C.borderDk||"#CBD5E1"}`,
                       }}>
                         <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                           <div style={{display:"flex",alignItems:"center",gap:7}}>
                             <div style={{width:22,height:22,borderRadius:"50%",background:fromIt?C.blue:C.muted,
                               color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                               {fromIt?"IT":"U"}
                             </div>
                             <span style={{fontSize:12,fontWeight:700,color:fromIt?C.blue:C.ink2}}>{fromIt?"IT Support":"You"}</span>
                           </div>
                           <span style={{fontSize:10,color:C.muted}}>{fmtDT(c.created_at)}</span>
                         </div>
                         <div style={{fontSize:13,color:C.ink,lineHeight:1.65,whiteSpace:"pre-wrap",paddingLeft:29}}>{c.body}</div>
                       </div>
                     );
                   })}
                   <div ref={bottomRef}/>
                 </div>
              }

              {isOpen
                ?<div style={{borderTop:`1px solid ${C.border}`,paddingTop:14}}>
                   <div style={{fontSize:12,fontWeight:700,color:C.ink,marginBottom:8}}>Add a Follow-up</div>
                   <textarea value={commentText} onChange={e=>setCommentText(e.target.value)}
                     placeholder="Provide more details, ask a question, attach new information, or let the team know about any changes since you raised this ticket…"
                     style={{...inp(),resize:"vertical",minHeight:88,fontSize:13,lineHeight:1.65,width:"100%"}}
                     onKeyDown={e=>{ if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){ e.preventDefault(); postComment(); } }}/>
                   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
                     <span style={{fontSize:11,color:C.muted}}>Ctrl + Enter to send · IT team will be notified</span>
                     <button onClick={postComment} disabled={posting||!commentText.trim()} style={{...btn("primary"),padding:"7px 18px",opacity:(!commentText.trim())?0.5:1}}>
                       {posting?"Sending…":"Send Follow-up →"}
                     </button>
                   </div>
                 </div>
                :<div style={{padding:"10px 14px",borderRadius:8,background:C.greenBg,border:`1px solid ${C.green}30`,fontSize:12,color:C.green,fontWeight:600,marginTop:4}}>
                   Ticket is {ticket.status} — no further follow-ups can be added.
                 </div>
              }
            </div>
          </div>

          {/* RIGHT — metadata sidebar */}
          <div style={{borderLeft:`1px solid ${C.border}`,padding:"18px 16px",overflowY:"auto",background:"#FAFBFC",display:"flex",flexDirection:"column",gap:10}}>
            <div style={{fontSize:10,fontWeight:800,color:C.muted,textTransform:"uppercase",letterSpacing:".1em",marginBottom:2}}>Ticket Details</div>

            <DR label="Status"   node={<Chip label={st.label} color={st.color} bg={st.bg}/>}/>
            <DR label="Priority" node={ticket.priority&&<PChipU p={ticket.priority}/>}/>
            <DR label="Urgency"  val={ticket.urgency&&ticket.urgency.charAt(0).toUpperCase()+ticket.urgency.slice(1)}/>
            <DR label="Impact Level" val={ticket.impact&&ticket.impact.charAt(0).toUpperCase()+ticket.impact.slice(1)}/>
            {isInc&&<DR label="Severity" val={ticket.severity&&ticket.severity.charAt(0).toUpperCase()+ticket.severity.slice(1)}/>}
            {catPath&&<DR label="Category" val={catPath}/>}
            {ticket.ticket_type&&<DR label="Ticket Area" val={ticket.ticket_type}/>}
            {ticket.department&&<DR label="Department" val={ticket.department}/>}
            {ticket.site&&<DR label="Site / Location" val={ticket.site}/>}
            {ticket.product_service&&<DR label="Product / Service" val={ticket.product_service}/>}
            {ticket.asset_free_text&&<DR label="Asset / Device" val={ticket.asset_free_text}/>}
            {ticket.linked_cr_id&&<DR label="Linked CR" val={ticket.linked_cr_id}/>}
            {ticket.mode&&<DR label="Reported Via" val={ticket.mode.replace(/-/g," ").replace(/\b\w/g,l=>l.toUpperCase())}/>}
            {ticket.support_level&&<DR label="Support Level" val={ticket.support_level}/>}
            {ticket.resolved_at&&<DR label="Resolved" val={fmtDT(ticket.resolved_at)}/>}
            {ticket.closed_at&&<DR label="Closed" val={fmtDT(ticket.closed_at)}/>}
            <DR label="Raised" val={fmtDT(ticket.created_at)}/>
            {ticket.updated_at&&<DR label="Last Updated" val={fmtDT(ticket.updated_at)}/>}
            {attachments.length>0&&<DR label="Attachments" val={`${attachments.length} file${attachments.length!==1?"s":""} attached`}/>}
          </div>
        </div>
      </div>
    </div>
  );
}
