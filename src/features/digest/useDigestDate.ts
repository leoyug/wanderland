import { useEffect, useState } from "react";
import { localDateKey } from "@/src/domain/digest";

/** Update at local midnight and after waking a suspended extension tab. */
export function useDigestDate() {
  const [date, setDate] = useState(() => localDateKey(Date.now()));
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const update = () => {
      setDate(localDateKey(Date.now()));
      clearTimeout(timer);
      const next = new Date(); next.setHours(24, 0, 0, 0);
      timer = setTimeout(update, next.getTime() - Date.now() + 20);
    };
    update(); window.addEventListener("focus", update);
    return () => { clearTimeout(timer); window.removeEventListener("focus", update); };
  }, []);
  return date;
}
