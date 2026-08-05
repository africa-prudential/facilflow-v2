import { useState, useEffect } from "react";
import { Laptop, Check, User, Wrench } from "lucide-react";
import { C, btn, card } from "../theme.js";
import { ASSET_STATUS, ASSET_CATS } from "../constants.js";
import { fmtSafe } from "../utils.js";
import { AChip, PageTitle, TH, Empty, Filters, StatCard } from "../components/ui.jsx";
import AssetModal from "./forms/AssetModal.jsx";

export default function AssetRegistry({ctx}){
  const {assets,setAssets,users,createAssetFn,updateAssetFn,flash,tid}=ctx;
  const [f,setF]=useState({});
  const [sel,setSel]=useState(null);
  const [showNew,setShowNew]=useState(false);
  const [csvError,setCsvError]=useState("");
  const [csvUploading,setCsvUploading]=useState(false);
  const [page,setPage]    = useState(1);
  const [pageSize,setPageSize] = useState(20);

  const shown=(assets||[]).filter(a=>{
    if(f.q && !`${a.name} ${a.serial_number} ${a.tag} ${a.brand}`.toLowerCase().includes(f.q.toLowerCase())) return false;
    if(f.status && a.status!==f.status) return false;
    if(f.category && a.category!==f.category) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(shown.length/pageSize));
  const paged = shown.slice((page-1)*pageSize, page*pageSize);
  useEffect(()=>{ setPage(1); },[f,pageSize]);

  const counts={
    total:(assets||[]).length,
    available:(assets||[]).filter(a=>a.status==="available").length,
    assigned:(assets||[]).filter(a=>a.status==="assigned").length,
    in_repair:(assets||[]).filter(a=>a.status==="in_repair").length,
  };

  const downloadTemplate=()=>{
    const headers=["name","brand","model","serial_number","tag","category","status","purchase_date","purchase_cost","warranty_expiry","location","notes"];
    const sample=["Dell Laptop","Dell","Latitude 5540","SN12345678","AP-LT-001","Laptop","available","2024-01-15","850000","2027-01-15","IT Store","Assigned to IT dept"];
    const csv=[headers.join(","),sample.join(",")].join("\n");
    const blob=new Blob([csv],{type:"text/csv"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="asset_registry_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload=async(e)=>{
    const file=e.target.files?.[0]; if(!file) return;
    setCsvError(""); setCsvUploading(true);
    try{
      const text=await file.text();
      const lines=text.trim().split("\n");
      const headers=lines[0].split(",").map(h=>h.trim().toLowerCase().replace(/\s+/g,"_"));
      const rows=lines.slice(1).filter(l=>l.trim());
      const created=[];
      for(const row of rows){
        const vals=row.split(",").map(v=>v.trim().replace(/^"|"$/g,""));
        const obj={tenant_id:tid};
        headers.forEach((h,i)=>{ if(vals[i]!==undefined) obj[h]=vals[i]; });
        if(!obj.name) continue;
        const saved=await createAssetFn(obj);
        created.push(saved);
      }
      flash(`Imported ${created.length} asset${created.length!==1?"s":""} successfully`);
    }catch(err){
      setCsvError(err.message||"CSV import failed");
    }finally{
      setCsvUploading(false);
      e.target.value="";
    }
  };

  return (
    <div>
      <PageTitle title="Asset Registry" sub="Manage IT and office assets"
        action={
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={downloadTemplate} style={{...btn("ghost"),fontSize:12}}>⬇ CSV Template</button>
            <label style={{...btn("ghost"),fontSize:12,cursor:"pointer"}}>
              {csvUploading?"Importing…":"⬆ Import CSV"}
              <input type="file" accept=".csv" onChange={handleCsvUpload} style={{display:"none"}} disabled={csvUploading}/>
            </label>
            <button onClick={()=>setShowNew(true)} style={{...btn("primary"),fontSize:12}}>+ New Asset</button>
          </div>
        }
      />
      {csvError&&<div style={{padding:"10px 14px",borderRadius:7,background:C.redBg,border:`1px solid ${C.red}30`,fontSize:13,color:C.red,marginBottom:12}}>{csvError}</div>}
      <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:20}}>
        <StatCard label="Total Assets" value={counts.total} color={C.blue} icon={<Laptop size={20}/>}/>
        <StatCard label="Available" value={counts.available} color={C.green} icon={<Check size={20}/>}/>
        <StatCard label="Assigned" value={counts.assigned} color={C.violet} icon={<User size={20}/>}/>
        <StatCard label="In Repair" value={counts.in_repair} color={C.amber} icon={<Wrench size={20}/>}/>
      </div>
      <Filters values={f} onChange={setF} fields={[
        {k:"q",label:"Search",w:260,ph:"Name, serial, tag…"},
        {k:"category",label:"Category",type:"select",opts:ASSET_CATS.map(c=>({v:c,l:c}))},
        {k:"status",label:"Status",type:"select",opts:Object.entries(ASSET_STATUS).map(([v,m])=>({v,l:m.label}))},
      ]}/>
      <div style={card(0)}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <TH cols={["Asset","Category","Serial / Tag","Status","Assigned To","Purchase Date","Actions"]}/>
          <tbody>
            {paged.length===0
              ?<tr><td colSpan={7}><Empty icon={<Laptop size={32}/>} title="No assets found" sub="Add assets individually or import via CSV"/></td></tr>
              :paged.map((a,i)=>(
                <tr key={a.id} style={{borderBottom:i<paged.length-1?`1px solid #FAFAFA`:"none"}}>
                  <td style={{padding:"10px 14px"}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.ink}}>{a.name}</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:1}}>{[a.brand,a.model].filter(Boolean).join(" · ")||"—"}</div>
                  </td>
                  <td style={{padding:"10px 14px",fontSize:12,color:C.muted}}>{a.category||"—"}</td>
                  <td style={{padding:"10px 14px"}}>
                    <div style={{fontSize:12,color:C.ink}}>{a.serial_number||"—"}</div>
                    {a.tag&&<div style={{fontSize:11,color:C.muted}}>{a.tag}</div>}
                  </td>
                  <td style={{padding:"10px 14px"}}><AChip s={a.status}/></td>
                  <td style={{padding:"10px 14px",fontSize:12,color:C.muted}}>
                    {a.assigned_to?users.find(u=>u.id===a.assigned_to)?.name||a.assigned_to:"—"}
                  </td>
                  <td style={{padding:"10px 14px",fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>{fmtSafe(a.purchase_date)}</td>
                  <td style={{padding:"10px 14px"}}>
                    <button onClick={()=>setSel(a)} style={{...btn("ghost"),padding:"4px 10px",fontSize:11}}>Manage</button>
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
      {sel&&<AssetModal asset={sel} users={users} onClose={()=>setSel(null)}
        onSave={async(id,upd)=>{ const n=await updateAssetFn(id,upd); setSel(n); flash("Asset updated"); }}/>}
      {showNew&&<AssetModal asset={null} users={users} onClose={()=>setShowNew(false)}
        onSave={async(_,data)=>{ await createAssetFn(data); setShowNew(false); flash("Asset created"); }}/>}
    </div>
  );
}

