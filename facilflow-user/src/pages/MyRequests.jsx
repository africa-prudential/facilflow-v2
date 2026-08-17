import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Car, Pencil, Search, X, Inbox } from "lucide-react";
import { C, btn, inp, sel, card, LBL } from "../theme.js";
import { fmtD } from "../utils.js";
import { RQChip, PageTitle, TH, Empty } from "../components/ui.jsx";
import PoolCarForm from "./forms/PoolCarForm.jsx";
import StatForm from "./forms/StatForm.jsx";
import ReqDetail from "./forms/ReqDetail.jsx";

export default function MyRequests({ctx}){
  const {uid,reqs,submitReq,transReq,users,invItems}=ctx;
  const vehicles = Array.isArray(ctx.vehicles) ? ctx.vehicles : (ctx.vehicles?.data || []);
  const drivers  = Array.isArray(ctx.drivers)  ? ctx.drivers  : (ctx.drivers?.data  || []);
  const [searchParams, setSearchParams] = useSearchParams();
  const [modal,    setModal]   = useState(null);

  useEffect(() => {
    const open = searchParams.get("open");
    if(open==="car" || open==="stat"){
      setModal(open);
      setSearchParams(p=>{ p.delete("open"); return p; }, {replace:true});
    }
  }, []);
  const [detail,   setDetail]  = useState(null);
  const [search,   setSearch]  = useState("");
  const [fStatus,  setFStatus] = useState("");
  const [fType,    setFType]   = useState("");
  const [fFrom,    setFFrom]   = useState("");
  const [fTo,      setFTo]     = useState("");

  const mine = reqs.filter(r=>r.submitted_by===uid);

  // summary counts
  const counts = {
    all:      mine.length,
    pending:  mine.filter(r=>r.status==="pending_approval").length,
    approved: mine.filter(r=>r.status==="approved").length,
    done:     mine.filter(r=>["completed","delivered"].includes(r.status)).length,
    rejected: mine.filter(r=>r.status==="rejected").length,
  };

  const shown = useMemo(()=>{
    const q = search.toLowerCase();
    return mine.filter(r=>{
      if(fStatus && r.status!==fStatus) return false;
      if(fType   && r.type!==fType)     return false;
      if(fFrom   && new Date(r.created_at) < new Date(fFrom)) return false;
      if(fTo     && new Date(r.created_at) > new Date(fTo+"T23:59:59")) return false;
      if(q){
        const veh = r.assigned_vehicle ? (vehicles||[]).find(v=>v.id===r.assigned_vehicle) : null;
        const items = (r.details?.items||[]).map(it=>invItems.find(x=>x.id===it.id)?.name||"").join(" ");
        const hay = [r.id, r.title, r.details?.destination||"", r.details?.pickup||"", veh?.plate||"", veh?.model||"", items].join(" ").toLowerCase();
        if(!hay.includes(q)) return false;
      }
      return true;
    });
  },[mine,search,fStatus,fType,fFrom,fTo,vehicles,invItems]);

  const hasFilters = search||fStatus||fType||fFrom||fTo;
  const clearAll   = ()=>{ setSearch(""); setFStatus(""); setFType(""); setFFrom(""); setFTo(""); };

  const STATUS_QUICK = [
    {v:"",              l:"All",      count:counts.all},
    {v:"pending_approval",l:"Pending", count:counts.pending},
    {v:"approved",      l:"Approved", count:counts.approved},
    {v:"completed",     l:"Completed",count:counts.done},
    {v:"rejected",      l:"Rejected", count:counts.rejected},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <PageTitle title="My Requests" sub="Your pool car and stationery requests"
        action={<div style={{display:"flex",gap:8}}>
          <button onClick={()=>setModal("car")}  style={btn("primary")}><Car size={14}/> Pool Car</button>
          <button onClick={()=>setModal("stat")} style={btn("outline")}><Pencil size={14}/> Stationery</button>
        </div>}/>

      {/* ── QUICK STATUS TABS ── */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {STATUS_QUICK.map(s=>{
          const active = fStatus===s.v;
          return (
            <button key={s.v} onClick={()=>setFStatus(s.v)} style={{
              padding:"6px 14px", borderRadius:20,
              border:`1.5px solid ${active?C.brand:C.border}`,
              background:active?C.brandLt:"#fff",
              color:active?C.brand:C.muted,
              fontSize:12, fontWeight:active?700:500,
              cursor:"pointer", fontFamily:"inherit",
              display:"flex", alignItems:"center", gap:6,
            }}>
              {s.l}
              <span style={{
                background:active?C.brand:C.surface,
                color:active?"#fff":C.muted,
                fontSize:10, fontWeight:700,
                padding:"1px 6px", borderRadius:10,
              }}>{s.count}</span>
            </button>
          );
        })}
      </div>

      {/* ── SEARCH + FILTERS ── */}
      <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px"}}>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
          {/* Search */}
          <div style={{flex:2,minWidth:200,position:"relative"}}>
            <label style={LBL}>Search</label>
            <span style={{position:"absolute",left:9,top:28,color:C.muted,display:"flex"}}><Search size={13}/></span>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Request ID, title, destination, vehicle plate…"
              style={{...inp(),paddingLeft:28}}/>
          </div>
          {/* Type */}
          <div style={{minWidth:130}}>
            <label style={LBL}>Type</label>
            <select value={fType} onChange={e=>setFType(e.target.value)} style={sel()}>
              <option value="">All Types</option>
              <option value="pool_car">🚗 Pool Car</option>
              <option value="stationary">✏️ Stationery</option>
            </select>
          </div>
          {/* Date from */}
          <div style={{minWidth:130}}>
            <label style={LBL}>From Date</label>
            <input type="date" value={fFrom} onChange={e=>setFFrom(e.target.value)} style={inp()}/>
          </div>
          {/* Date to */}
          <div style={{minWidth:130}}>
            <label style={LBL}>To Date</label>
            <input type="date" value={fTo} onChange={e=>setFTo(e.target.value)} style={inp()}/>
          </div>
          {hasFilters&&(
            <div style={{alignSelf:"flex-end"}}>
              <button onClick={clearAll} style={{...btn("ghost"),color:C.red,borderColor:C.red+"30",fontSize:11,padding:"7px 12px"}}><X size={12}/> Clear</button>
            </div>
          )}
        </div>
        {hasFilters&&<div style={{fontSize:11,color:C.muted,marginTop:8}}>{shown.length} result{shown.length!==1?"s":""} found</div>}
      </div>

      {/* ── TABLE ── */}
      <div style={card(0)}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <TH cols={["Request ID","Type","Title / Details","Date Requested","Approved On","Resource","Status",""]}/>
          <tbody>
            {shown.length===0
              ?<tr><td colSpan={8}><Empty icon={<Inbox size={32}/>} title={hasFilters?"No requests match your search":"No requests yet"} sub={hasFilters?"Try adjusting your filters":"Use the buttons above to raise a request"}/></td></tr>
              :shown.map((r,i)=>{
                const approvedAt = r.approved_at ? fmtD(r.approved_at) : (r.history||[]).find(h=>h.s==="approved")?.at ? fmtD((r.history||[]).find(h=>h.s==="approved").at) : "—";
                const veh = r.assigned_vehicle ? (vehicles||[]).find(v=>v.id===r.assigned_vehicle) : null;
                const itemsSummary = r.type!=="pool_car" && r.details?.items
                  ? (r.details.items||[]).map(it=>{ const inv=invItems.find(x=>x.id===it.id); return `${inv?.name||it.id} ×${it.qty}`; }).join(", ")
                  : r.details?.destination ? `→ ${r.details.destination}` : "";
                const resource = veh
                  ? `🚗 ${veh.plate}`
                  : r.type!=="pool_car" && (r.details?.items||[]).length>0
                    ? `📦 ${(r.details.items||[]).length} item${(r.details.items||[]).length>1?"s":""}`
                    : "—";
                return (
                <tr key={r.id} style={{borderBottom:i<shown.length-1?`1px solid #F8FAFC`:"none",cursor:"pointer"}}
                  onClick={()=>setDetail(r)}>
                  <td style={{padding:"11px 14px",fontSize:11,fontWeight:700,color:C.ink}}>{r.id}</td>
                  <td style={{padding:"11px 14px"}}>
                    <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:4,
                      background:r.type==="pool_car"?C.brandLt:C.blueBg,
                      color:r.type==="pool_car"?C.brand:C.blue,
                      display:"inline-flex",alignItems:"center",gap:4}}>
                      {r.type==="pool_car"?<><Car size={12}/> Pool Car</>:<><Pencil size={12}/> Stationery</>}
                    </span>
                  </td>
                  <td style={{padding:"11px 14px",maxWidth:220}}>
                    <div style={{fontSize:13,color:C.ink,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.title}</div>
                    {itemsSummary&&<div style={{fontSize:10,color:C.muted,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{itemsSummary}</div>}
                  </td>
                  <td style={{padding:"11px 14px",fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>{fmtD(r.created_at)}</td>
                  <td style={{padding:"11px 14px",fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>{approvedAt}</td>
                  <td style={{padding:"11px 14px",fontSize:11,color:veh?C.green:C.muted,fontWeight:veh?600:400}}>{resource}</td>
                  <td style={{padding:"11px 14px"}}><RQChip s={r.status}/></td>
                  <td style={{padding:"11px 14px",color:C.muted,fontSize:16}}>›</td>
                </tr>
              )})}
          </tbody>
        </table>
        <div style={{padding:"8px 14px",borderTop:`1px solid #F8FAFC`,fontSize:11,color:C.muted}}>
          {shown.length} of {mine.length} requests
        </div>
      </div>

      {modal==="car"  &&<PoolCarForm  onClose={()=>setModal(null)} onSubmit={submitReq}/>}
      {modal==="stat" &&<StatForm     onClose={()=>setModal(null)} onSubmit={submitReq} invItems={invItems}/>}
      {detail&&<ReqDetail req={detail} onClose={()=>setDetail(null)} ctx={ctx}/>}
    </div>
  );
}

