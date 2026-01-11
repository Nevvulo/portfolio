import { NodeViewContent, type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import type { CalloutType } from "../extensions/Callout";
import { CalloutWrapper, ComponentWrapper } from "../styles";

const CALLOUT_ICONS: Record<CalloutType, JSX.Element> = {
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
    </svg>
  ),
  tip: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
    </svg>
  ),
};

const CALLOUT_LABELS: Record<CalloutType, string> = {
  info: "Info",
  warning: "Warning",
  tip: "Tip",
};

export function EditorCallout({ node, selected, updateAttributes }: NodeViewProps) {
  const type = (node.attrs.type || "info") as CalloutType;

  const cycleType = () => {
    const types: CalloutType[] = ["info", "warning", "tip"];
    const currentIndex = types.indexOf(type);
    const nextType = types[(currentIndex + 1) % types.length];
    updateAttributes({ type: nextType });
  };

  return (
    <NodeViewWrapper>
      <ComponentWrapper $selected={selected}>
        <CalloutWrapper $type={type}>
          <div
            className="callout-header"
            onClick={cycleType}
            style={{ cursor: "pointer" }}
            title="Click to change type"
          >
            {CALLOUT_ICONS[type]}
            <span>{CALLOUT_LABELS[type]}</span>
          </div>
          <div className="callout-content">
            <NodeViewContent />
          </div>
        </CalloutWrapper>
      </ComponentWrapper>
    </NodeViewWrapper>
  );
}

export default EditorCallout;
