import { readCurrentPage } from "@/src/capture/readCurrentPage";

export default defineUnlistedScript({
  globalName: true,
  main() {
    return readCurrentPage();
  },
});
