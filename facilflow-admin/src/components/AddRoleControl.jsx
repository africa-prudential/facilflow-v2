import { useState } from "react";
import { C, btn, inp, LBL } from "../theme.js";
import { Modal } from "./ui.jsx";
import { createChangeRole, updateChangeRole } from "../lib/supabase.js";

const slugify = (label) =>
  label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

export default function AddRoleControl({
  changeRoles,
  setChangeRoles,
  flash,
  onSaved,
  role,
}) {
  const isEdit = !!role;
  const [show, setShow] = useState(false);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const open = () => {
    setLabel(isEdit ? role.label : "");
    setShow(true);
  };

  const close = () => {
    setShow(false);
    setLabel("");
  };

  const save = async () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      if (isEdit) {
        const saved = await updateChangeRole(role.key, trimmed);
        setChangeRoles(p => (p || []).map(r => (r.key === saved.key ? saved : r)));
        flash("Role updated");
        onSaved?.(saved);
      } else {
        const base = slugify(trimmed) || "role";
        const existingKeys = new Set((changeRoles || []).map(r => r.key));
        let key = base, i = 2;
        while (existingKeys.has(key)) key = `${base}_${i++}`;
        const saved = await createChangeRole(key, trimmed);
        setChangeRoles(p => [...(p || []), saved]);
        flash("Role created");
        onSaved?.(saved);
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
        <button
          type="button"
          onClick={open}
          title="Edit role"
          style={{ ...btn("ghost"), padding: "3px 7px", fontSize: 11 }}
        >
          ✎
        </button>
      ) : (
        <button
          type="button"
          onClick={open}
          style={{ ...btn("primary"), whiteSpace: "nowrap" }}
        >
          + New Role
        </button>
      )}
      {show && (
        <Modal title={isEdit ? "Edit Role" : "New Approval Role"} onClose={close} w={420}>
          <div>
            <label style={LBL}>Role Name</label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              style={inp()}
              placeholder="e.g. Level 3 Approver"
              autoFocus
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 18,
              paddingTop: 16,
              borderTop: `1px solid ${C.border}`,
            }}
          >
            <button onClick={close} style={btn("ghost")}>
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || !label.trim()}
              style={btn("primary")}
            >
              {saving ? "Saving…" : isEdit ? "Save" : "Add"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
