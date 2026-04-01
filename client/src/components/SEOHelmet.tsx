import { useEffect } from "react";

interface SEOHelmetProps {
  title?: string;
  description?: string;
}

export default function SEOHelmet({ title, description }: SEOHelmetProps) {
  useEffect(() => {
    const baseTitle = "クチコミラボ";
    document.title = title ? `${title} | ${baseTitle}` : baseTitle;

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
    }
  }, [title, description]);

  return null;
}
