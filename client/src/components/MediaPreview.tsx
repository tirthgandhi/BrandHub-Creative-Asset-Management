import { FileText, Download } from "lucide-react";
import { mediaUrl, type Media } from "../services/media";
export function MediaPreview({ item }: { item: Media }) {
  if (item.mediaType === "video") return <video src={mediaUrl(item.url)} poster={item.thumbnailUrl ? mediaUrl(item.thumbnailUrl) : undefined} controls preload="metadata" playsInline />;
  if (item.mediaType === "image") return <img src={mediaUrl(item.url)} alt={item.title} loading="lazy" />;
  return <div className="document-preview"><FileText size={42} aria-hidden="true" /><strong>{item.originalFilename || item.title}</strong><span>{(item.fileSize / 1024).toFixed(1)} KB · Project document</span><a className="ui-button ui-button--ghost" href={mediaUrl(item.url)} download={item.originalFilename || item.title}><Download size={16} />Download file</a></div>;
}
