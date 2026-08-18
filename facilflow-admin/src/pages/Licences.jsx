import { useState } from "react";
import { AlertTriangle, ScrollText, Paperclip } from "lucide-react";
import { C, btn, inp, sel, card, LBL } from "../theme.js";
import { genId, docStatus, fmtSafe, normLicence } from "../utils.js";
import { createLicence, updateLicence, uploadLicenceDoc } from "../lib/supabase.js";
import { Chip, PageTitle, TH, Empty, StatCard } from "../components/ui.jsx";
import LicenceModal from "./forms/LicenceModal.jsx";

export default function Licences({ctx}){
  const {licences,setLicences,addAudit,flash,tid}=ctx;
  const [f,setF]         = useState({});
  const [modal,setModal] = useState(null);
  const [page,setPage]   = useState(1);
  const [pageSize,setPageSize] = useState(20);

  const types = [...new Set((licences||[]).map(l=>l.type).filter(Boolean))].sort();

  const shown = (licences||[]).filter(l=>{
    if(f.type && l.type!==f.type) return false;
    if(f.status && docStatus(l.expiryDate).l!==f.status) return false;
    if(f.q){
      const q=f.q.toLowerCase();
      if(!l.name.toLowerCase().includes(q)
        &&!(l.issuingAuthority||"").toLowerCase().includes(q)
        &&!(l.licenceNumber||"").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(shown.length/pageSize));
  const paged = shown.slice((page-1)*pageSize, page*pageSize);

  const counts = {
    total:(licences||[]).length,
    expiringSoon:(licences||[]).filter(l=>docStatus(l.expiryDate).l==="Expiring Soon").length,
    expired:(licences||[]).filter(l=>docStatus(l.expiryDate).l==="Expired").length,
  };

  const saveLicence = async(data,existing) => {
    try{
      let attachmentUrl = existing?.attachmentUrl||null;
      if(data.attachmentFile){
        flash("Uploading attachment…");
        const up = await uploadLicenceDoc(existing?.id||genId("LIC"),data.attachmentFile);
        attachmentUrl = up.publicUrl;
      }
      const rec = {
        name:data.name, type:data.type||null,
        issuing_authority:data.issuingAuthority||null,
        licence_number:data.licenceNumber||null,
        expiry_date:data.expiryDate,
        attachment_url:attachmentUrl,
        notes:data.notes||"",
        tenant_id:tid,
      };
      if(existing){
        const saved = await updateLicence(existing.id,rec);
        setLicences(p=>p.map(l=>l.id!==existing.id?l:normLicence(saved)));
        addAudit("LICENCE_UPDATED",existing.id,`${data.name} licence updated`);
        flash("Licence updated");
      } else {
        const saved = await createLicence({...rec,id:genId("LIC")});
        setLicences(p=>[normLicence(saved),...p]);
        addAudit("LICENCE_ADDED",saved.id,`${data.name} licence added`);
        flash("Licence added");
      }
    }catch(e){flash(e.message,"error"); throw e;}
  };

  return (
    <div>
      <PageTitle title="Licences" sub="Track business licences, permits and certifications"
        action={<button onClick={()=>setModal("add")} style={btn("primary")}>+ Add Licence</button>}/>

      {counts.expired+counts.expiringSoon>0&&(
        <div style={{padding:"10px 16px",borderRadius:8,background:C.amberBg,border:`1px solid ${C.amber}40`,marginBottom:14,fontSize:12,color:C.amber,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
          <AlertTriangle size={14}/> {counts.expired+counts.expiringSoon} licence(s) expired or expiring soon — review below.
        </div>
      )}

      <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:20}}>
        <StatCard label="Total Licences" value={counts.total} color={C.blue} icon={<ScrollText size={20}/>}/>
        <StatCard label="Expiring Soon" value={counts.expiringSoon} color={C.amber} icon={<AlertTriangle size={20}/>}/>
        <StatCard label="Expired" value={counts.expired} color={C.red} icon={<AlertTriangle size={20}/>}/>
      </div>

      <div style={{display:"flex",gap:10,flexWrap:"wrap",padding:"12px 14px",background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,marginBottom:16,alignItems:"flex-end"}}>
        <div style={{minWidth:220}}>
          <label style={LBL}>Search</label>
          <input value={f.q||""} placeholder="Name, authority or number…" onChange={e=>setF(p=>({...p,q:e.target.value}))} style={{...inp(),padding:"6px 9px",fontSize:12}}/>
        </div>
        <div style={{minWidth:140}}>
          <label style={LBL}>Type</label>
          <select value={f.type||""} onChange={e=>setF(p=>({...p,type:e.target.value}))} style={{...sel(),padding:"6px 9px",fontSize:12}}>
            <option value="">All</option>
            {types.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{minWidth:140}}>
          <label style={LBL}>Status</label>
          <select value={f.status||""} onChange={e=>setF(p=>({...p,status:e.target.value}))} style={{...sel(),padding:"6px 9px",fontSize:12}}>
            <option value="">All</option>
            {["Valid","Expiring Soon","Expired","No Record"].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={()=>setF({})} style={{...btn("ghost"),padding:"6px 12px",fontSize:11,alignSelf:"flex-end"}}>Clear</button>
      </div>

      <div style={card(0)}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <TH cols={["Licence","Type","Issuing Authority","Licence Number","Expiry",""]}/>
          <tbody>
            {paged.length===0
              ?<tr><td colSpan={6}><Empty icon={<ScrollText size={32}/>} title="No licences found" sub="Add a licence to start tracking its expiry"/></td></tr>
              :paged.map((l,i)=>{
                const st = docStatus(l.expiryDate);
                const rowBg = st.l==="Expired"?`${C.red}06`:st.l==="Expiring Soon"?`${C.amber}06`:"transparent";
                return (
                  <tr key={l.id} style={{borderBottom:i<paged.length-1?`1px solid #FAFAFA`:"none",background:rowBg}}>
                    <td style={{padding:"11px 14px",fontSize:13,fontWeight:600,color:C.ink}}>{l.name}</td>
                    <td style={{padding:"11px 14px",fontSize:12,color:C.muted}}>{l.type||"—"}</td>
                    <td style={{padding:"11px 14px",fontSize:12,color:C.muted}}>{l.issuingAuthority||"—"}</td>
                    <td style={{padding:"11px 14px",fontSize:12,color:C.muted}}>{l.licenceNumber||"—"}</td>
                    <td style={{padding:"11px 14px"}}>
                      <div style={{fontSize:12,color:C.ink}}>{fmtSafe(l.expiryDate)}</div>
                      <Chip label={st.l} color={st.color} bg={st.bg}/>
                    </td>
                    <td style={{padding:"11px 14px"}}>
                      <div style={{display:"flex",gap:5,alignItems:"center"}}>
                        {l.attachmentUrl&&<a href={l.attachmentUrl} target="_blank" rel="noreferrer" style={{...btn("ghost"),fontSize:11,padding:"4px 8px",textDecoration:"none",color:C.blue,display:"inline-flex",alignItems:"center"}}><Paperclip size={14}/></a>}
                        <button onClick={()=>setModal({edit:l})} style={{...btn("ghost"),fontSize:11,padding:"4px 8px"}}>Edit</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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

      {modal==="add"&&<LicenceModal onClose={()=>setModal(null)} onSave={d=>saveLicence(d,null)}/>}
      {modal?.edit&&<LicenceModal licence={modal.edit} onClose={()=>setModal(null)} onSave={d=>saveLicence(d,modal.edit)}/>}
    </div>
  );
}
