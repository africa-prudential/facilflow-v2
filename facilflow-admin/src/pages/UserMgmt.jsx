import { useState, useEffect } from "react";
import { User, Pencil, Ban, UserCheck, Trash2 } from "lucide-react";
import { C, btn, card } from "../theme.js";
import { STAFF_ROLES, ADMIN_ROLE_TYPES, ADMIN_ROLE_META } from "../constants.js";
import { getAdminRoles, fmtSafe, exportCSV } from "../utils.js";
import { Av, Chip, UChip, Modal, PageTitle, TH, Empty, Filters } from "../components/ui.jsx";
import { supabase, updateUser, deleteUser, APP_URL, USER_APP_URL } from "../lib/supabase.js";
import InviteModal from "./forms/InviteModal.jsx";
import EditUserModal from "./forms/EditUserModal.jsx";

export default function UserMgmt({ctx}){
  const {users,setUsers,addAudit,flash,tid}=ctx;
  const [f,setF]       = useState({});
  const [modal,setModal]= useState(null);
  const [confirm,setConfirm]=useState(null);
  const [page,setPage]    = useState(1);
  const [pageSize,setPageSize] = useState(20);

  const shown=users.filter(u=>{
    if(f.role){
      const isAdm=ADMIN_ROLE_TYPES.includes(u.role)||u.role==="admin";
      const allRoles=isAdm?getAdminRoles(u):[u.role];
      if(!allRoles.includes(f.role))return false;
    }
    if(f.status&&u.status!==f.status)return false;
    if(f.q){const q=f.q.toLowerCase();if(!u.name.toLowerCase().includes(q)&&!u.email.toLowerCase().includes(q))return false;}
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(shown.length/pageSize));
  const paged = shown.slice((page-1)*pageSize, page*pageSize);

  useEffect(()=>{ setPage(1); },[f,pageSize]);

  const suspend = async id=>{
    try{
      await updateUser(id,{status:"suspended"});
      setUsers(p=>p.map(u=>u.id!==id?u:{...u,status:"suspended"}));
      addAudit("USER_SUSPENDED",id,"User suspended");flash("User suspended");setConfirm(null);
    }catch(e){flash(e.message,"error");}
  };
  const reinstate = async id=>{
    try{
      await updateUser(id,{status:"active"});
      setUsers(p=>p.map(u=>u.id!==id?u:{...u,status:"active"}));
      addAudit("USER_REINSTATED",id,"User reinstated");flash("User reinstated");
    }catch(e){flash(e.message,"error");}
  };
  const removeUser = async id=>{
    try{
      await deleteUser(id);
      setUsers(p=>p.filter(u=>u.id!==id));
      addAudit("USER_DELETED",id,"User deleted");flash("User deleted");setConfirm(null);
    }catch(e){flash(e.message,"error");}
  };
  const invite=async(email,name,role,dept,tempPassword,adminRoles=[],firstName="",lastName="")=>{
    try{
      const isAdminRole = ADMIN_ROLE_TYPES.includes(role);
      const redirectTo  = isAdminRole ? APP_URL : USER_APP_URL;

      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: { email, name, role, dept, tenant_id:tid, temp_password:tempPassword, redirect_to:redirectTo }
      });
      if(error){
        const detail = error.context ? await error.context.json().catch(()=>null) : null;
        throw new Error(detail?.error || error.message);
      }
      if(data.error) throw new Error(data.error);

      // Persist split names + any extra admin roles
      const nameUpdates = {};
      if(firstName) nameUpdates.first_name = firstName;
      if(lastName)  nameUpdates.last_name  = lastName;
      if(isAdminRole && adminRoles.length > 1) nameUpdates.admin_roles = adminRoles;
      if(Object.keys(nameUpdates).length){
        try{ await updateUser(data.user.id, nameUpdates); } catch(_){}
      }

      setUsers(p=>[...p, {...data.user, admin_roles:adminRoles, first_name:firstName, last_name:lastName}]);
      const roleLabel = adminRoles.length>1 ? adminRoles.map(r=>ADMIN_ROLE_META[r]?.label||r).join(", ") : role;
      addAudit("USER_INVITED", email, `${name} invited as ${roleLabel}`);
      flash(`Invitation sent to ${email}`);
    }catch(e){ flash(e.message,"error"); }
  };
  const updateUserLocal=async(id,data)=>{
    try{
      await updateUser(id,data);
      setUsers(p=>p.map(u=>u.id!==id?u:{...u,...data}));
      addAudit("USER_UPDATED",id,"User details updated");flash("User updated");
    }catch(e){flash(e.message,"error");throw e;}
  };

  const exportUsers = () => {
    if(shown.length===0){ flash("No users to export","error"); return; }
    exportCSV(`users-${new Date().toISOString().slice(0,10)}.csv`, [
      {key:"name",       label:"Name"},
      {key:"email",      label:"Email"},
      {key:"roles",      label:"Roles"},
      {key:"dept",       label:"Department"},
      {key:"status",     label:"Status"},
      {key:"created_at", label:"Date Created"},
    ], shown.map(u=>{
      const isAdmin = ADMIN_ROLE_TYPES.includes(u.role) || u.role==="admin";
      const displayRoles = isAdmin ? getAdminRoles(u) : [u.role];
      return {...u, roles: displayRoles.map(r=>ADMIN_ROLE_META[r]?.label||r.replace(/_/g," ")).join("; ")};
    }));
    flash(`Exported ${shown.length} user(s)`);
  };

  return (
    <div>
      <PageTitle title="User Management" sub="Manage users, roles and access permissions"
        action={<div style={{display:"flex",gap:8}}>
          <button onClick={exportUsers} style={btn("ghost")}>Export CSV</button>
          <button onClick={()=>setModal("add")} style={btn("primary")}>+ Invite User</button>
        </div>}/>
      <Filters values={f} onChange={setF} fields={[
        {k:"q",     label:"Search", type:"text",   w:200,ph:"Name or email…"},
        {k:"role",  label:"Role",   type:"select", w:170,opts:[
          ...STAFF_ROLES.map(v=>({v,l:v.replace(/_/g," ")})),
          {v:"super_admin",l:"Super Admin"},
          {v:"facility_admin",l:"Facility Admin"},
          {v:"it_admin",l:"IT Admin"},
        ]},
        {k:"status",label:"Status", type:"select", w:130,opts:[{v:"active",l:"Active"},{v:"suspended",l:"Suspended"}]},
      ]}/>
      <div style={card(0)}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <TH cols={["Name","Email","Roles","Department","Status","Date Created",""]}/>
          <tbody>
            {paged.length===0?<tr><td colSpan={7}><Empty icon={<User size={32}/>} title="No users found"/></td></tr>
            :paged.map((u,i)=>{
              // Build the full role list for display
              const isAdmin = ADMIN_ROLE_TYPES.includes(u.role) || u.role==="admin";
              const displayRoles = isAdmin ? getAdminRoles(u) : [u.role];
              return (
                <tr key={u.id} style={{borderBottom:i<paged.length-1?`1px solid #FAFAFA`:"none"}}>
                  <td style={{padding:"11px 14px"}}>
                    <div style={{display:"flex",gap:9,alignItems:"center"}}>
                      <Av i={u.initials} s={28} bg={u.status==="suspended"?C.muted:C.brand}/>
                      <span style={{fontSize:13,fontWeight:600,color:u.status==="suspended"?C.muted:C.ink}}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{padding:"11px 14px",fontSize:12,color:C.muted}}>{u.email}</td>
                  <td style={{padding:"11px 14px"}}>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      {displayRoles.map(r=>{
                        const m = ADMIN_ROLE_META[r];
                        return m
                          ? <Chip key={r} label={m.label} color={m.color} bg={m.bg}/>
                          : <span key={r} style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:4,background:C.surface,color:C.ink2,textTransform:"capitalize"}}>{r.replace(/_/g," ")}</span>;
                      })}
                    </div>
                  </td>
                  <td style={{padding:"11px 14px",fontSize:12,color:C.muted}}>{u.dept}</td>
                  <td style={{padding:"11px 14px"}}><UChip s={u.status}/></td>
                  <td style={{padding:"11px 14px",fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>{fmtSafe(u.created_at)}</td>
                  <td style={{padding:"11px 14px"}}>
                    <div style={{display:"flex",gap:5}}>
                      <button onClick={()=>setModal({edit:u})} title="Edit user" style={{...btn("ghost"),padding:"5px 7px"}}><Pencil size={13}/></button>
                      {u.status==="active"
                        ?<button onClick={()=>setConfirm({type:"suspend",user:u})} title="Suspend user" style={{...btn("ghost"),padding:"5px 7px",color:C.amber,borderColor:C.amber+"30"}}><Ban size={13}/></button>
                        :<button onClick={()=>reinstate(u.id)} title="Reinstate user" style={{...btn("ghost"),padding:"5px 7px",color:C.green,borderColor:C.green+"30"}}><UserCheck size={13}/></button>}
                      <button onClick={()=>setConfirm({type:"delete",user:u})} title="Delete user" style={{...btn("ghost"),padding:"5px 7px",color:C.red,borderColor:C.red+"30"}}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 14px",borderTop:`1px solid #FAFAFA`}}>
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

      {/* Invite / Add modal */}
      {modal==="add"&&<InviteModal departments={ctx.departments} onClose={()=>setModal(null)} onInvite={(email,name,role,dept,pw,adminRoles,fn,ln)=>invite(email,name,role,dept,pw,adminRoles,fn,ln)}/>}
      {modal?.edit&&<EditUserModal departments={ctx.departments} user={modal.edit} onClose={()=>setModal(null)} onSave={updateUserLocal}/>}

      {/* Confirm modal */}
      {confirm&&(
        <Modal title={confirm.type==="delete"?"Delete User":"Suspend User"} onClose={()=>setConfirm(null)} w={420}>
          <div style={{marginBottom:20,fontSize:13,color:C.ink2,lineHeight:1.6}}>
            {confirm.type==="delete"
              ?<>Are you sure you want to <strong style={{color:C.red}}>permanently delete</strong> <strong>{confirm.user.name}</strong>? This cannot be undone.</>
              :<>Are you sure you want to <strong style={{color:C.amber}}>suspend</strong> <strong>{confirm.user.name}</strong>? They will not be able to log in.</>}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
            <button onClick={()=>setConfirm(null)} style={btn("ghost")}>Cancel</button>
            <button onClick={()=>confirm.type==="delete"?removeUser(confirm.user.id):suspend(confirm.user.id)}
              style={btn(confirm.type==="delete"?"danger":"amber")}>
              {confirm.type==="delete"?"Delete User":"Suspend User"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

