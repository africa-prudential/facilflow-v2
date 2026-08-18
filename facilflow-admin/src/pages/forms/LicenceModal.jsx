import { useState } from "react";
import { C, btn, inp, sel, LBL } from "../../theme.js";
import { Modal } from "../../components/ui.jsx";
import { isDirty } from "../../utils.js";

export default function LicenceModal({licence,onClose,onSave}){
  const [d,setD]=useState(licence
    ?{name:licence.name,type:licence.type||"",issuingAuthority:licence.issuingAuthority||"",licenceNumber:licence.licenceNumber||"",expiryDate:licence.expiryDate||"",notes:licence.notes||"",attachmentFile:null}
    :{name:"",type:"",issuingAuthority:"",licenceNumber:"",expiryDate:"",notes:"",attachmentFile:null});
  const [initial]=useState(d);
  const [saving,setSaving]=useState(false);
  const dirty = !licence || !!d.attachmentFile || isDirty(d,initial,["attachmentFile"]);

  const submit = async () => {
    if(!d.name||!d.expiryDate) return;
    setSaving(true);
    try {
      await onSave(d);
      onClose();
    } catch(_){ /* error already flashed by page-level save */ }
    finally { setSaving(false); }
  };

  return (
    <Modal title={licence?"Edit Licence":"Add Licence"} onClose={onClose} w={560}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div style={{gridColumn:"1/-1"}}><label style={LBL}>Licence Name</label><input value={d.name} onChange={e=>setD(p=>({...p,name:e.target.value}))} style={inp()} placeholder="e.g. Fire Safety Certificate"/></div>
        <div><label style={LBL}>Type</label><input value={d.type} onChange={e=>setD(p=>({...p,type:e.target.value}))} style={inp()} placeholder="e.g. Safety, Environmental, Business…"/></div>
        <div><label style={LBL}>Issuing Authority</label><input value={d.issuingAuthority} onChange={e=>setD(p=>({...p,issuingAuthority:e.target.value}))} style={inp()} placeholder="e.g. Lagos State Fire Service"/></div>
        <div><label style={LBL}>Licence Number</label><input value={d.licenceNumber} onChange={e=>setD(p=>({...p,licenceNumber:e.target.value}))} style={inp()} placeholder="e.g. LSFS-2026-0042"/></div>
        <div><label style={LBL}>Expiry Date</label><input type="date" value={d.expiryDate} onChange={e=>setD(p=>({...p,expiryDate:e.target.value}))} style={inp()}/></div>

        <div style={{gridColumn:"1/-1"}}><label style={LBL}>Notes</label><textarea value={d.notes} onChange={e=>setD(p=>({...p,notes:e.target.value}))} style={{...inp(),minHeight:56,resize:"vertical"}} placeholder="Additional notes…"/></div>
        <div style={{gridColumn:"1/-1"}}>
          <label style={LBL}>Attachment {licence?.attachmentUrl&&<span style={{color:C.blue,fontWeight:500,textTransform:"none"}}>— <a href={licence.attachmentUrl} target="_blank" rel="noreferrer" style={{color:C.blue}}>view current</a></span>}</label>
          <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e=>setD(p=>({...p,attachmentFile:e.target.files[0]||null}))} style={{...inp(),padding:"5px 8px",fontSize:11,cursor:"pointer"}}/>
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
        <button onClick={onClose} disabled={saving} style={btn("ghost")}>Cancel</button>
        <button onClick={submit} disabled={saving||!d.name||!d.expiryDate||!dirty}
          style={{...btn("primary"),minWidth:150,justifyContent:"center",opacity:saving||!d.name||!d.expiryDate||!dirty?0.6:1}}>
          {saving?"Saving…":(licence?"Save Changes":"Add Licence")}
        </button>
      </div>
    </Modal>
  );
}
