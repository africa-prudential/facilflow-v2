import { useState, useEffect } from "react";
import { C, btn, inp, sel, card } from "../../theme.js";
import { TICKET_STATUS } from "../../constants.js";
import { fmtDT, fmtD, sentenceCase } from "../../utils.js";
import { TChip, PChip, Modal } from "../../components/ui.jsx";
import { emailTicketStatusUpdate, emailTicketComment, emailTicketAssigned } from "../../lib/email.js";

export default function TicketAdminModal({ticket,users,me,onClose,onUpdate,fetchComments,addComment}){
  const [t,setT]=useState(ticket);
  const [comments,setComments]=useState([]);
  const [commentText,setCommentText]=useState("");
  const [saving,setSaving]=useState(false);

  useEffect(()=>{
    fetchComments(ticket.id).then(c=>setComments(c||[])).catch(()=>{});
  },[ticket.id]);

  const requester=users.find(u=>u.id===t.requesterId);

  const save=async(upd)=>{
    setSaving(true);
    try{
      const n=await onUpdate(t.id,upd);
      setT(n);
      // Notify requester when status changes
      if(upd.status && requester?.email){
        emailTicketStatusUpdate(requester.email, n, upd.status, "Support Team").catch(()=>{});
      }
      // Notify the newly assigned staff member
      if(upd.assignee_id){
        const assignee=users.find(u=>u.id===upd.assignee_id);
        if(assignee?.email) emailTicketAssigned(assignee.email, n, me?.name||"An admin").catch(()=>{});
      }
    }finally{ setSaving(false); }
  };

  const postComment=async()=>{
    if(!commentText.trim()) return;
    const body=commentText.trim();
    try{
      const c=await addComment({ticket_id:t.id,body,author_type:"admin"});
      setComments(p=>[...p,c]);
      setCommentText("");
      // Notify requester of admin reply
      if(requester?.email){
        emailTicketComment(requester.email, t, "Support Team", body).catch(()=>{});
      }
    }catch(e){console.error(e);}
  };

  return (
    <Modal title={`Ticket: ${sentenceCase(t.title)}`} sub={`#${t.id?.slice(-6)} · ${t.ticketType==="incident"?"Incident":"Service Request"}`} onClose={onClose} w={720}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:20}}>
        <div>
          <div style={{...card(14),marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>DESCRIPTION</div>
            <p style={{fontSize:13,color:C.ink,lineHeight:1.6}}>{t.description||"—"}</p>
            {t.impactDetails&&<><div style={{fontSize:12,fontWeight:700,color:C.muted,marginTop:12,marginBottom:6}}>IMPACT</div><p style={{fontSize:13,color:C.ink,lineHeight:1.6}}>{t.impactDetails}</p></>}
          </div>
          <div style={{...card(14)}}>
            <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:10}}>COMMENTS</div>
            <div style={{display:"flex",flexDirection:"column",gap:10,maxHeight:220,overflowY:"auto",marginBottom:12}}>
              {comments.length===0&&<div style={{fontSize:12,color:C.muted}}>No comments yet.</div>}
              {comments.map(c=>(
                <div key={c.id} style={{background:"#F8FAFC",borderRadius:7,padding:"9px 12px"}}>
                  <div style={{fontSize:11,fontWeight:600,color:C.ink,marginBottom:3}}>{c.author_type==="admin"?"Admin":users.find(u=>u.id===c.author_id)?.name||"Staff"} · {fmtDT(c.created_at)}</div>
                  <div style={{fontSize:12,color:C.ink,lineHeight:1.5}}>{c.body}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8}}>
              <textarea value={commentText} onChange={e=>setCommentText(e.target.value)}
                placeholder="Add an admin comment…"
                style={{...inp(),resize:"none",minHeight:60,flex:1}}/>
              <button onClick={postComment} style={{...btn("primary"),alignSelf:"flex-end",padding:"8px 14px"}}>Send</button>
            </div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={card(14)}>
            <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:10}}>TICKET DETAILS</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:11,color:C.muted}}>Status</span>
                <TChip s={t.status}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:11,color:C.muted}}>Priority</span>
                <PChip p={t.priority}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:11,color:C.muted}}>Requester</span>
                <span style={{fontSize:12,fontWeight:600,color:C.ink}}>{users.find(u=>u.id===t.requesterId)?.name||"—"}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:11,color:C.muted}}>Created</span>
                <span style={{fontSize:11,color:C.muted}}>{fmtD(t.createdAt)}</span>
              </div>
            </div>
          </div>
          <div style={card(14)}>
            <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:10}}>UPDATE STATUS</div>
            <select value={t.status} onChange={e=>save({status:e.target.value})} style={{...sel(),marginBottom:10,fontSize:12}} disabled={saving}>
              {Object.entries(TICKET_STATUS).map(([v,m])=><option key={v} value={v}>{m.label}</option>)}
            </select>
            <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:6}}>ASSIGN TO</div>
            <select value={t.assigneeId||""} onChange={e=>save({assignee_id:e.target.value||null})} style={{...sel(),fontSize:12}} disabled={saving}>
              <option value="">Unassigned</option>
              {users.filter(u=>["it_admin","super_admin"].includes(u.role)).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          {(t.status==="resolved"||t.status==="closed")&&(
            <div style={card(14)}>
              <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>RESOLUTION NOTES</div>
              <textarea value={t.resolutionNotes||""} onChange={e=>setT(v=>({...v,resolutionNotes:e.target.value}))}
                onBlur={e=>save({resolution_notes:e.target.value})}
                placeholder="Describe how this was resolved…"
                style={{...inp(),resize:"none",minHeight:80,fontSize:12}}/>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

