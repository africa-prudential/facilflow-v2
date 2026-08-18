import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { C, inp } from "../theme.js";

export const isEmptyHtml = (html) => !html || !html.replace(/<[^>]*>/g, "").trim();

const toolBtn = (active) => ({
  display:"inline-flex", alignItems:"center", justifyContent:"center",
  width:26, height:24, border:"none", borderRadius:4, cursor:"pointer",
  background:active?C.brand+"1A":"transparent", color:active?C.brand:C.muted,
});

export default function RichTextEditor({value, onChange, placeholder, error, minHeight=80}){
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [3] } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: { class: "rt-editor-content" },
    },
    onUpdate: ({editor}) => onChange(editor.getHTML()),
  }, []);

  if(!editor) return null;

  return (
    <div style={{...inp(!!error), padding:0, overflow:"hidden"}}>
      <div style={{display:"flex",gap:2,padding:"4px 6px",borderBottom:`1px solid ${C.border}`,background:C.pageBg}}>
        <button type="button" onClick={()=>editor.chain().focus().toggleBold().run()} style={toolBtn(editor.isActive("bold"))}><Bold size={13}/></button>
        <button type="button" onClick={()=>editor.chain().focus().toggleItalic().run()} style={toolBtn(editor.isActive("italic"))}><Italic size={13}/></button>
        <button type="button" onClick={()=>editor.chain().focus().toggleBulletList().run()} style={toolBtn(editor.isActive("bulletList"))}><List size={13}/></button>
        <button type="button" onClick={()=>editor.chain().focus().toggleOrderedList().run()} style={toolBtn(editor.isActive("orderedList"))}><ListOrdered size={13}/></button>
      </div>
      <EditorContent editor={editor} style={{padding:"8px 11px", minHeight, fontSize:13, color:C.ink}}/>
      <style>{`
        .rt-editor-content{outline:none;}
        .rt-editor-content p{margin:0 0 6px;}
        .rt-editor-content p:last-child{margin-bottom:0;}
        .rt-editor-content ul,.rt-editor-content ol{margin:0 0 6px;padding-left:20px;}
        .rt-editor-content p.is-editor-empty:first-child::before{
          content:attr(data-placeholder); float:left; color:${C.faint}; pointer-events:none; height:0;
        }
      `}</style>
    </div>
  );
}
