import { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { C, btn, card } from "../theme.js";
import { PageTitle, Modal } from "../components/ui.jsx";
import AddDepartmentControl from "../components/AddDepartmentControl.jsx";
import { deleteDepartment, setDepartmentModule } from "../lib/supabase.js";
import { isSuperAdmin } from "../utils.js";

const MODULES = [
  { key: "change_management", label: "Change Management" },
];

export default function Departments({ctx}){
  const {me,users,departments,setDepartments,departmentModules,setDepartmentModules,flash,tid}=ctx;
  const [saving,setSaving]=useState(null);
  const [confirmDelete,setConfirmDelete]=useState(null);
  const canDelete = isSuperAdmin(me);

  const moduleMap = {};
  (departmentModules||[]).forEach(m=>{
    if(!moduleMap[m.department_id]) moduleMap[m.department_id]=[];
    moduleMap[m.department_id].push(m.module_key);
  });

  const toggleModule = async (deptId, moduleKey) => {
    const enabled = (moduleMap[deptId]||[]).includes(moduleKey);
    setSaving(deptId+moduleKey);
    try {
      await setDepartmentModule(deptId, moduleKey, !enabled, tid);
      setDepartmentModules(p => enabled
        ? p.filter(m=>!(m.department_id===deptId && m.module_key===moduleKey))
        : [...p, {department_id:deptId, module_key:moduleKey, tenant_id:tid}]);
      flash(`Module ${enabled?"disabled":"enabled"}`);
    } catch(e){ flash(e.message,"error"); }
    finally { setSaving(null); }
  };

  const removeDept = async (dept) => {
    const inUse = (users||[]).some(u=>u.dept===dept.name);
    if(inUse){
      flash("Can't delete — still assigned to one or more users", "error");
      return;
    }
    try {
      await deleteDepartment(dept.id);
      setDepartments(p=>(p||[]).filter(d=>d.id!==dept.id));
      setDepartmentModules(p=>(p||[]).filter(m=>m.department_id!==dept.id));
      flash("Department deleted");
    } catch(e){ flash(e.message,"error"); }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <PageTitle title="Departments" sub="Manage organization's departments and which modules each can access"
        action={<AddDepartmentControl departments={departments} setDepartments={setDepartments} flash={flash} tid={tid}/>}/>

      <div style={card(0)}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:"#FAFAFA"}}>
              <th style={{padding:"9px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",borderBottom:`1px solid ${C.border}`}}>Department</th>
              {MODULES.map(m=>(
                <th key={m.key} style={{padding:"9px 14px",textAlign:"center",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",borderBottom:`1px solid ${C.border}`}}>{m.label}</th>
              ))}
              <th style={{padding:"9px 14px",textAlign:"right",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",borderBottom:`1px solid ${C.border}`}}></th>
            </tr>
          </thead>
          <tbody>
            {(departments||[]).map((d,i)=>(
              <tr key={d.id} style={{borderBottom:i<departments.length-1?`1px solid #F8FAFC`:"none"}}>
                <td style={{padding:"11px 14px"}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.ink}}>{d.name}</div>
                  {d.description&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{d.description}</div>}
                </td>
                {MODULES.map(m=>{
                  const has = (moduleMap[d.id]||[]).includes(m.key);
                  const isSaving = saving===d.id+m.key;
                  return (
                    <td key={m.key} style={{padding:"11px 14px",textAlign:"center"}}>
                      <button
                        onClick={()=>toggleModule(d.id, m.key)}
                        disabled={!!isSaving}
                        style={{width:26,height:26,borderRadius:"50%",border:`2px solid ${has?C.green:C.border}`,
                          background:has?C.green:"#fff",cursor:"pointer",
                          display:"inline-flex",alignItems:"center",justifyContent:"center",
                          opacity:isSaving?.5:1}}>
                        {isSaving?"…":has?<Check size={12} color="#fff"/>:""}
                      </button>
                    </td>
                  );
                })}
                <td style={{padding:"11px 14px",textAlign:"right"}}>
                  <div style={{display:"flex",gap:5,justifyContent:"flex-end"}}>
                    <AddDepartmentControl department={d} departments={departments} setDepartments={setDepartments} flash={flash} tid={tid}/>
                    {canDelete&&(
                      <button type="button" onClick={()=>setConfirmDelete(d)} title="Delete department"
                        style={{...btn("ghost"),padding:"3px 7px",fontSize:11,color:C.red}}>
                        <Trash2 size={11}/>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{padding:"9px 14px",borderTop:`1px solid #F8FAFC`,fontSize:11,color:C.muted}}>
          {(departments||[]).length} departments
        </div>
      </div>

      {confirmDelete&&(
        <Modal title="Delete Department" onClose={()=>setConfirmDelete(null)} w={420}>
          <div style={{marginBottom:20,fontSize:13,color:C.ink2,lineHeight:1.6}}>
            Are you sure you want to <strong style={{color:C.red}}>permanently delete</strong> <strong>{confirmDelete.name}</strong>? This cannot be undone.
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
            <button onClick={()=>setConfirmDelete(null)} style={btn("ghost")}>Cancel</button>
            <button onClick={()=>{removeDept(confirmDelete);setConfirmDelete(null);}} style={btn("danger")}>Delete Department</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
