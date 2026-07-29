import { C, btn, card } from "../theme.js";
import { fmtD } from "../utils.js";
import { CRChip, EnvTag, TH } from "../components/ui.jsx";

export default function Dashboard({ctx,setPage}){
  const {me,uid,reqs,crs,users}=ctx;
  const mine     = reqs.filter(r=>r.submitted_by===uid);
  const myCRs    = crs.filter(c=>c.initiator===uid);
  const pending  = crs.filter(c=>["pending_line_manager","pending_secondary"].includes(c.status));
  const scheduled= crs.filter(c=>c.status==="scheduled");

  const StatBox=({v,label,color})=>(
    <div style={{background:"rgba(255,255,255,.18)",borderRadius:8,padding:"10px 16px",minWidth:90}}>
      <div style={{fontSize:24,fontWeight:900,color:"#fff"}}>{v}</div>
      <div style={{fontSize:11,color:"rgba(255,255,255,.75)",marginTop:1}}>{label}</div>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* Hero */}
      <div style={{background:`linear-gradient(135deg,${C.brand} 0%,${C.brandDk} 100%)`,
        borderRadius:12,padding:"24px 28px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:21,fontWeight:800,color:"#fff",letterSpacing:"-.025em"}}>
              Good morning, {me.name.split(" ")[0]} 👋
            </div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.65)",marginTop:4}}>
              {new Date().toLocaleDateString("en-GB",{weekday:"long",year:"numeric",month:"long",day:"numeric"})} · Africa Prudential Plc
            </div>
          </div>
          {crs.filter(c=>c.is_emergency&&c.status==="in_progress").length>0&&(
            <div style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",
              borderRadius:8,padding:"8px 14px"}}>
              <div style={{color:"#fff",fontWeight:700,fontSize:12}}>⚡ Emergency CR Active</div>
            </div>
          )}
        </div>
        <div style={{display:"flex",gap:12,marginTop:18,flexWrap:"wrap"}}>
          <StatBox v={mine.length}      label="My Requests"/>
          <StatBox v={myCRs.length}     label="My Change Reqs"/>
          <StatBox v={scheduled.length} label="Scheduled Deploys"/>
          {(me.role==="manager")&&<StatBox v={pending.length} label="Awaiting My Approval"/>}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:16}}>
        {/* Recent CRs */}
        <div style={card(0)}>
          <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,
            display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:14,fontWeight:700,color:C.ink}}>Recent Change Requests</span>
            <button onClick={()=>setPage("change_requests")} style={{...btn("ghost"),fontSize:11,padding:"4px 10px"}}>View all →</button>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <TH cols={["CR ID","Title","Type","Environment","Status"]}/>
            <tbody>
              {crs.slice(0,5).map((c,i)=>(
                <tr key={c.id} style={{borderBottom:i<4?`1px solid #FAFAFA`:"none"}}>
                  <td style={{padding:"10px 14px",fontSize:11,fontWeight:700,color:C.ink,whiteSpace:"nowrap"}}>{c.id}</td>
                  <td style={{padding:"10px 14px",fontSize:12,color:C.ink,maxWidth:180}}>
                    <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {c.is_emergency&&<span style={{color:C.red,marginRight:4}}>⚡</span>}{c.title}
                    </div>
                  </td>
                  <td style={{padding:"10px 14px",fontSize:11,color:C.muted}}>{c.change_type}</td>
                  <td style={{padding:"10px 14px"}}><EnvTag e={c.environment}/></td>
                  <td style={{padding:"10px 14px"}}><CRChip s={c.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right panel */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* Quick actions */}
          <div style={{...card(16)}}>
            <div style={{fontSize:13,fontWeight:700,color:C.ink,marginBottom:12}}>Quick Actions</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <button onClick={()=>setPage("change_requests")} style={{...btn("primary"),justifyContent:"flex-start",fontSize:12,width:"100%"}}>⟳ Raise Change Request</button>
              {(me.role==="employee"||me.role==="manager")&&<>
                <button onClick={()=>setPage("my_requests")} style={{...btn("flat"),justifyContent:"flex-start",fontSize:12,width:"100%",border:`1px solid ${C.border}`}}>🚗 Pool Car Request</button>
                <button onClick={()=>setPage("my_requests")} style={{...btn("flat"),justifyContent:"flex-start",fontSize:12,width:"100%",border:`1px solid ${C.border}`}}>✏️ Stationery Request</button>
              </>}
              {me.role==="manager"&&pending.length>0&&(
                <button onClick={()=>setPage("cr_approvals")} style={{...btn("flat"),justifyContent:"flex-start",fontSize:12,width:"100%",background:C.amberBg,color:C.amber,border:`1px solid ${C.amber}30`}}>
                  ⏳ {pending.length} CR approval{pending.length>1?"s":""} pending
                </button>
              )}
            </div>
          </div>
          {/* Upcoming */}
          <div style={{...card(16)}}>
            <div style={{fontSize:13,fontWeight:700,color:C.ink,marginBottom:10}}>📅 Upcoming Deployments</div>
            {scheduled.slice(0,3).map((c,i)=>(
              <div key={c.id} style={{padding:"8px 0",borderBottom:i<2?`1px solid ${C.border}`:"none"}}>
                <div style={{fontSize:12,fontWeight:600,color:C.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.title}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>{fmtD(c.deploy_date+"T12:00:00")} · {c.deploy_start}–{c.deploy_end}</div>
              </div>
            ))}
            {scheduled.length===0&&<div style={{fontSize:12,color:C.muted}}>No deployments scheduled</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

