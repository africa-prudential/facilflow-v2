import { useState } from "react";
import { Paperclip, AlertTriangle } from "lucide-react";
import { C, btn, inp, LBL } from "../../theme.js";
import { DOC_TYPES } from "../../constants.js";
import { docStatus, fmtSafe } from "../../utils.js";
import { Chip, Modal } from "../../components/ui.jsx";

export default function VehicleDocsModal({vehicle,docs,onClose,onSaveDoc,onUploadDoc}){
  const owner = vehicle.ownershipType==="Joint"&&vehicle.coOwnerName
    ?`${vehicle.companyName||"—"} / ${vehicle.coOwnerName}`
    :(vehicle.companyName||"—");

  return (
    <Modal title={`${vehicle.plate} — ${vehicle.model}`} sub={`Compliance Documents · Owner: ${owner}`} onClose={onClose} w={740}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {DOC_TYPES.map(docType=>(
          <VehicleDocRow key={docType} docType={docType} vehicle={vehicle} doc={docs.find(d=>d.document_type===docType)||null} onSave={onSaveDoc} onUpload={onUploadDoc}/>
        ))}
      </div>
    </Modal>
  );
}

function VehicleDocRow({docType,vehicle,doc,onSave,onUpload}){
  const [editing,setEditing] = useState(false);
  const [expiry,setExpiry]   = useState(doc?.expiry_date||"");
  const [file,setFile]       = useState(null);
  const [saving,setSaving]   = useState(false);
  const [err,setErr]         = useState("");
  const st = docStatus(doc?.expiry_date);

  const submit = async () => {
    if(!expiry){ setErr("Expiry date is required."); return; }
    setErr(""); setSaving(true);
    try{
      if(file) await onUpload(vehicle.id,docType,file,expiry);
      else     await onSave(vehicle.id,docType,expiry,doc?.attachment_url||null);
      setEditing(false); setFile(null);
    }catch(e){ setErr(e.message||"Upload failed. Please try again."); }
    finally{setSaving(false);}
  };

  return (
    <div style={{border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden"}}>
      <div style={{display:"grid",gridTemplateColumns:"180px 140px 110px 100px 1fr auto",gap:0,alignItems:"center",padding:"10px 14px",background:st.l==="Expired"?C.redBg:st.l==="Expiring Soon"?C.amberBg:"#FAFAFA"}}>
        <div style={{fontSize:13,fontWeight:700,color:C.ink}}>{docType}</div>
        <div style={{fontSize:12,color:C.muted}}>{doc?.expiry_date?fmtSafe(doc.expiry_date+"T12:00:00"):"—"}</div>
        <div style={{fontSize:12,color:C.muted}}>
          {doc?.expiry_date?(st.days!==undefined?(st.days<0?`${Math.abs(st.days)}d overdue`:`${st.days}d left`):"—"):"—"}
        </div>
        <Chip label={st.l} color={st.color} bg={st.bg}/>
        <div style={{fontSize:11,color:C.muted}}>
          {doc?.attachment_url
            ?<a href={doc.attachment_url} target="_blank" rel="noreferrer" style={{color:C.blue,textDecoration:"none",fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}><Paperclip size={12}/> View</a>
            :"No attachment"}
        </div>
        <button onClick={()=>setEditing(e=>!e)} style={{...btn("ghost"),fontSize:11,padding:"4px 8px"}}>{editing?"Cancel":"Edit"}</button>
      </div>
      {editing&&(
        <div style={{padding:"14px",borderTop:`1px solid ${C.border}`,background:"#fff"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:12,alignItems:"flex-end"}}>
            <div>
              <label style={LBL}>Expiry Date <span style={{color:C.red}}>*</span></label>
              <input type="date" value={expiry} onChange={e=>{setExpiry(e.target.value);setErr("");}} style={inp(!expiry&&!!err)}/>
            </div>
            <div>
              <label style={LBL}>Attachment (optional)</label>
              <input type="file" onChange={e=>setFile(e.target.files[0]||null)} style={{...inp(),padding:"5px 8px",fontSize:11,cursor:"pointer"}}/>
            </div>
            <button onClick={submit} disabled={saving} style={{...btn("primary"),alignSelf:"flex-end"}}>
              {saving?"Saving…":"Save"}
            </button>
          </div>
          {err&&<div style={{fontSize:11,color:C.red,fontWeight:600,marginTop:8,display:"flex",alignItems:"center",gap:4}}><AlertTriangle size={12}/> {err}</div>}
        </div>
      )}
    </div>
  );
}

