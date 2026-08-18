import DOMPurify from "dompurify";
import { C } from "../theme.js";

const hasHtmlTags = (v) => /<[a-z][\s\S]*>/i.test(v || "");

export default function RichTextView({value, style}){
  if(!value) return null;
  const html = hasHtmlTags(value) ? value : `<p>${value}</p>`;
  const clean = DOMPurify.sanitize(html);
  return (
    <>
      <div
        className="rt-content"
        style={{fontSize:13, color:C.ink, lineHeight:1.6, whiteSpace: hasHtmlTags(value) ? "normal" : "pre-wrap", ...style}}
        dangerouslySetInnerHTML={{__html: clean}}
      />
      <style>{`
        .rt-content p{margin:0 0 8px;}
        .rt-content p:last-child{margin-bottom:0;}
        .rt-content ul,.rt-content ol{margin:0 0 8px;padding-left:20px;}
        .rt-content h3{font-size:14px;margin:0 0 6px;color:${C.ink};}
      `}</style>
    </>
  );
}
