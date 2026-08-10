import { Users, Car, ClipboardList, Zap, AlertTriangle, Info, RefreshCw } from "lucide-react";
import { C, btn, card } from "../theme.js";
import { TENANTS, VEHICLE_STATUSES, ADMIN_ROLE_META } from "../constants.js";
import { hasAdminAccess, isSuperAdmin } from "../utils.js";
import { Chip, CRChip, EnvTag, PageTitle, TH, StatCard } from "../components/ui.jsx";

export default function AdminDash({ctx,setPage}){
  const {me,users,vehicles,drivers,inventory,crs,requests,adminRoles}=ctx;
  const activeUsers   = users.filter(u=>u.status==="active").length;
  const availVeh      = vehicles.filter(v=>v.status==="available").length;
  const lowStock      = inventory.filter(i=>i.stock<5).length;
  const pendingCRs    = crs.filter(c=>["pending_line_manager","pending_manager","pending_approval"].includes(c.status)).length;
  const pendingReqs   = (requests||[]).filter(r=>r.status==="pending_approval").length;

  const showFacility = hasAdminAccess(me,["facility_admin","super_admin"]);
  const showIT       = hasAdminAccess(me,["it_admin","super_admin"]);

  const roleLabel = isSuperAdmin(me) ? "Super Admin · Full Platform Access"
    : adminRoles.map(r=>ADMIN_ROLE_META[r]?.label||r).join(" · ") + " · Tenant Overview";

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <PageTitle title="Admin Dashboard" sub={`Africa Prudential Plc · ${roleLabel}`}/>

      {/* Role-scoped access notice for non-super admins */}
      {!isSuperAdmin(me)&&(
        <div style={{padding:"10px 16px",borderRadius:8,background:C.blueBg,border:`1px solid ${C.blue}30`,fontSize:13,color:C.blue,fontWeight:500,display:"flex",alignItems:"center",gap:10}}>
          <Info size={16}/>
          <span>You have access to: <strong>{adminRoles.map(r=>ADMIN_ROLE_META[r]?.label||r).join(" and ")}</strong> modules only.</span>
        </div>
      )}

      {/* Stats — show only what the role can access */}
      <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
        {isSuperAdmin(me)&&<StatCard label="Active Users" value={activeUsers} sub={`${users.length} total`} color={C.blue} icon={<Users size={20}/>}/>}
        {showFacility&&<StatCard label="Fleet Available" value={availVeh} sub={`${vehicles.length} vehicles`} color={C.green} icon={<Car size={20}/>}/>}
        {showFacility&&<StatCard label="Pending Requests" value={pendingReqs} sub="Awaiting approval" color={C.brand} icon={<ClipboardList size={20}/>}/>}
        {showIT&&<StatCard label="Pending CRs" value={pendingCRs} sub="Awaiting action" color={C.violet} icon={<RefreshCw size={20}/>}/>}
      </div>

      <div style={{display:"grid",gridTemplateColumns:showFacility&&showIT?"1.4fr 1fr":"1fr",gap:16}}>
        {/* Recent CRs — IT Admin / Super Admin only */}
        {showIT&&(
          <div style={card(0)}>
            <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:14,fontWeight:700,color:C.ink}}>Recent Change Requests</span>
              <button onClick={()=>setPage("change_requests")} style={{...btn("ghost"),fontSize:11,padding:"4px 10px"}}>View all →</button>
            </div>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <TH cols={["ID","Title","Type","Env","Status"]}/>
              <tbody>
                {crs.slice(0,5).map((c,i)=>(
                  <tr key={c.id} style={{borderBottom:i<4?`1px solid #FAFAFA`:"none"}}>
                    <td style={{padding:"10px 14px",fontSize:11,fontWeight:700,color:C.ink}}>{c.id}</td>
                    <td style={{padding:"10px 14px",fontSize:12,color:C.ink,maxWidth:180}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4}}>{c.isEmergency&&<Zap size={12}/>}{c.title}</div></td>
                    <td style={{padding:"10px 14px",fontSize:11,color:C.muted}}>{c.changeType}</td>
                    <td style={{padding:"10px 14px"}}><EnvTag e={c.environment}/></td>
                    <td style={{padding:"10px 14px"}}><CRChip s={c.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Facility panel — Facility Admin / Super Admin only */}
        {showFacility&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={card(16)}>
              <div style={{fontSize:13,fontWeight:700,color:C.ink,marginBottom:12,display:"flex",alignItems:"center",gap:6}}><Car size={14}/> Fleet Status</div>
              {VEHICLE_STATUSES.map(s=>{
                const count=vehicles.filter(v=>v.status===s.v).length;
                return count>0?(
                  <div key={s.v} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <Chip label={s.l} color={s.color} bg={s.bg}/>
                    <span style={{fontSize:13,fontWeight:700,color:C.ink}}>{count}</span>
                  </div>
                ):null;
              })}
            </div>
            {lowStock>0&&(
              <div style={{...card(14),border:`1px solid ${C.amber}40`,background:C.amberBg}}>
                <div style={{fontSize:13,fontWeight:700,color:C.amber,marginBottom:10,display:"flex",alignItems:"center",gap:6}}><AlertTriangle size={14}/> Low Stock Alerts</div>
                {inventory.filter(i=>i.stock<5).map(i=>(
                  <div key={i.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.amber,marginBottom:4}}>
                    <span>{i.name}</span><span style={{fontWeight:700}}>{i.stock} {i.unit}s</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tenant info — Super Admin only */}
      {isSuperAdmin(me)&&(
        <div style={card(0)}>
          <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,fontSize:14,fontWeight:700,color:C.ink}}>Tenant Overview</div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <TH cols={["Tenant","Domain","Plan","Users","Status"]}/>
            <tbody>
              {TENANTS.map((t,i)=>(
                <tr key={t.id} style={{borderBottom:i<TENANTS.length-1?`1px solid #FAFAFA`:"none"}}>
                  <td style={{padding:"11px 14px",fontSize:13,fontWeight:700,color:C.ink}}>{t.name}</td>
                  <td style={{padding:"11px 14px",fontSize:12,color:C.muted}}>{t.domain}</td>
                  <td style={{padding:"11px 14px"}}><Chip label={t.plan} color={C.blue} bg={C.blueBg}/></td>
                  <td style={{padding:"11px 14px",fontSize:13,color:C.ink}}>{t.users}</td>
                  <td style={{padding:"11px 14px"}}><Chip label={t.status==="active"?"Active":"Inactive"} color={t.status==="active"?C.green:C.muted} bg={t.status==="active"?C.greenBg:"#F8FAFC"}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

