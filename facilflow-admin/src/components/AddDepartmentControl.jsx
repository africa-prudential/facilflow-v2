import { useState } from "react";
import { Pencil } from "lucide-react";
import { C, btn, inp, LBL } from "../theme.js";
import { Modal } from "./ui.jsx";
import { createDepartment, renameDepartment } from "../lib/supabase.js";

export default function AddDepartmentControl({ departments, setDepartments, flash, tid, department }) {
  const isEdit = !!department;
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const open = () => {
    setName(isEdit ? department.name : "");
    setDescription(isEdit ? (department.description||"") : "");
    setShow(true);
  };
  const close = () => { setShow(false); setName(""); setDescription(""); };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const clash = (departments||[]).some(d=>d.name.toLowerCase()===trimmed.toLowerCase() && d.id!==department?.id);
    if (clash) {
      flash("A department with that name already exists", "error");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        const saved = await renameDepartment(department.id, department.name, trimmed, description, tid);
        setDepartments(p => (p||[]).map(d => d.id===saved.id ? saved : d));
        flash("Department updated");
      } else {
        const saved = await createDepartment(trimmed, tid, description);
        setDepartments(p => [...(p||[]), saved]);
        flash("Department created");
      }
      close();
    } catch (e) {
      flash(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {isEdit ? (
        <button type="button" onClick={open} title="Edit department" style={{ ...btn("ghost"), padding: "3px 7px", fontSize: 11 }}>
          <Pencil size={11}/>
        </button>
      ) : (
        <button type="button" onClick={open} style={{ ...btn("primary"), whiteSpace: "nowrap" }}>
          + New Department
        </button>
      )}
      {show && (
        <Modal title={isEdit ? "Edit Department" : "New Department"} onClose={close} w={420}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={LBL}>Department Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                style={inp()}
                placeholder="e.g. Engineering"
                autoFocus
              />
            </div>
            <div>
              <label style={LBL}>Description (optional)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ ...inp(), minHeight: 70, resize: "vertical" }}
                placeholder="What this department covers…"
              />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <button onClick={close} style={btn("ghost")}>Cancel</button>
            <button onClick={save} disabled={saving || !name.trim()} style={btn("primary")}>
              {saving ? "Saving…" : isEdit ? "Save" : "Add"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
