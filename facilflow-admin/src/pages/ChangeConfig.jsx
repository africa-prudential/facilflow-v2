import { useState } from "react";
import { Trash2, Search, Check } from "lucide-react";
import { C, btn, inp, card } from "../theme.js";
import { Av, Chip, Modal, PageTitle } from "../components/ui.jsx";
import AddRoleControl from "../components/AddRoleControl.jsx";
import { assignChangeRole, removeChangeRole, deleteChangeRole } from "../lib/supabase.js";
import { isSuperAdmin } from "../utils.js";

export default function ChangeConfig({ctx}){
  const {me,users,changeRoles,setChangeRoles,userCRoles,setUserCRoles,approvalLevels,flash,tid}=ctx;
  const [search,setSearch]=useState("");
  const [saving,setSaving]=useState(null);
  const [managingUser,setManagingUser]=useState(null);
  const [confirmDelete,setConfirmDelete]=useState(null);
  const canDeleteRoles = isSuperAdmin(me);

  // Build a map: userId -> array of role keys
  const roleMap = {};
  (userCRoles||[]).forEach(r=>{ if(!roleMap[r.user_id]) roleMap[r.user_id]=[]; roleMap[r.user_id].push(r.role_key); });

  const shown = users.filter(u=>{
    if(!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const toggleRole = async (userId, roleKey) => {
    const hasRole = (roleMap[userId]||[]).includes(roleKey);
    setSaving(userId+roleKey);
    try {
      if(hasRole){
        await removeChangeRole(userId, roleKey);
        setUserCRoles(p=>p.filter(r=>!(r.user_id===userId&&r.role_key===roleKey)));
      } else {
        const saved = await assignChangeRole(userId, roleKey, tid);
        setUserCRoles(p=>[...p, {user_id:userId, role_key:roleKey, ...saved}]);
      }
      flash(`Change role ${hasRole?"removed":"assigned"}`);
    } catch(e){ flash(e.message,"error"); }
    finally { setSaving(null); }
  };

  const removeRole = async (role) => {
    const inUse = (approvalLevels||[]).some(l=>l.role_key===role.key);
    if(inUse){
      flash("Can't delete — still used by an approval level", "error");
      return;
    }
    try {
      await deleteChangeRole(role.key);
      setChangeRoles(p=>(p||[]).filter(r=>r.key!==role.key));
      flash("Role deleted");
    } catch(e){ flash(e.message,"error"); }
  };

  const CR_ROLES = (changeRoles||[]);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <PageTitle title="Change Roles" sub="Assign change management roles to users — users can hold multiple roles"
        action={<AddRoleControl changeRoles={changeRoles} setChangeRoles={setChangeRoles} flash={flash}/>}/>

      {/* Legend */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {CR_ROLES.map(r=>(
          <div key={r.key} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 4px 3px 10px",borderRadius:20,background:C.violetBg,color:C.violet,border:`1px solid ${C.violet}22`}}>
            <span style={{fontSize:11,fontWeight:600}}>{r.label}</span>
            <AddRoleControl role={r} changeRoles={changeRoles} setChangeRoles={setChangeRoles} flash={flash}/>
            {canDeleteRoles&&(
              <button type="button" onClick={()=>setConfirmDelete(r)} title="Delete role"
                style={{...btn("ghost"),padding:"3px 7px",fontSize:11,color:C.red}}>
                <Trash2 size={11}/>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{position:"relative"}}>
        <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.muted,display:"flex"}}><Search size={14}/></span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users…" style={{...inp(),paddingLeft:30}}/>
      </div>

      {/* User role list */}
      <div style={card(0)}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:"#FAFAFA"}}>
              <th style={{padding:"9px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",borderBottom:`1px solid ${C.border}`}}>User</th>
              <th style={{padding:"9px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",borderBottom:`1px solid ${C.border}`}}>Dept</th>
              <th style={{padding:"9px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",borderBottom:`1px solid ${C.border}`}}>Roles</th>
              <th style={{padding:"9px 14px",textAlign:"right",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",borderBottom:`1px solid ${C.border}`}}></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((u,i)=>{
              const myRoleKeys = roleMap[u.id]||[];
              const myRoles = CR_ROLES.filter(r=>myRoleKeys.includes(r.key));
              return (
                <tr key={u.id} style={{borderBottom:i<shown.length-1?`1px solid #F8FAFC`:"none"}}>
                  <td style={{padding:"11px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <Av i={u.initials||"?"} s={28}/>
                      <div>
                        <div style={{fontSize:12,fontWeight:600,color:C.ink}}>{u.name}</div>
                        <div style={{fontSize:10,color:C.muted}}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{padding:"11px 14px",fontSize:11,color:C.muted}}>{u.dept}</td>
                  <td style={{padding:"11px 14px"}}>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {myRoles.length===0
                        ?<span style={{fontSize:11,color:C.muted}}>—</span>
                        :myRoles.map(r=><Chip key={r.key} label={r.label} color={C.violet} bg={C.violetBg}/>)}
                    </div>
                  </td>
                  <td style={{padding:"11px 14px",textAlign:"right"}}>
                    <button onClick={()=>setManagingUser(u)} style={{...btn("ghost"),fontSize:11,padding:"4px 10px"}}>Manage Roles</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{padding:"9px 14px",borderTop:`1px solid #F8FAFC`,fontSize:11,color:C.muted}}>
          {shown.length} users
        </div>
      </div>

      {/* Manage Roles Modal */}
      {managingUser&&(
        <Modal title={`Roles — ${managingUser.name}`} onClose={()=>setManagingUser(null)} w={420}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {CR_ROLES.length===0&&<div style={{fontSize:12,color:C.muted}}>No roles configured yet.</div>}
            {CR_ROLES.map(r=>{
              const has = (roleMap[managingUser.id]||[]).includes(r.key);
              const isSaving = saving===managingUser.id+r.key;
              return (
                <div key={r.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",border:`1px solid ${C.border}`,borderRadius:8}}>
                  <span style={{fontSize:13,color:C.ink,fontWeight:500}}>{r.label}</span>
                  <button
                    onClick={()=>toggleRole(managingUser.id, r.key)}
                    disabled={!!isSaving}
                    style={{width:28,height:28,borderRadius:"50%",border:`2px solid ${has?C.green:C.border}`,
                      background:has?C.green:"#fff",cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:13,opacity:isSaving?.5:1}}>
                    {isSaving?"…":has?<Check size={13} color="#fff"/>:""}
                  </button>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:18,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
            <button onClick={()=>setManagingUser(null)} style={btn("primary")}>Done</button>
          </div>
        </Modal>
      )}

      {/* Confirm delete modal */}
      {confirmDelete&&(
        <Modal title="Delete Role" onClose={()=>setConfirmDelete(null)} w={420}>
          <div style={{marginBottom:20,fontSize:13,color:C.ink2,lineHeight:1.6}}>
            Are you sure you want to <strong style={{color:C.red}}>permanently delete</strong> <strong>{confirmDelete.label}</strong>? This cannot be undone.
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
            <button onClick={()=>setConfirmDelete(null)} style={btn("ghost")}>Cancel</button>
            <button onClick={()=>{removeRole(confirmDelete);setConfirmDelete(null);}} style={btn("danger")}>Delete Role</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
