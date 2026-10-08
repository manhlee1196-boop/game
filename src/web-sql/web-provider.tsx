// ===== Bản "rỗng" dùng cho Android / iOS =====
//
// TẠI SAO CÓ FILE NÀY:
// Metro resolve module theo platform. Với cùng đường dẫn
// `./web-sql/web-provider`, Metro sẽ chọn:
//   - platform web           -> web-provider.web.tsx  (sql.js thật)
//   - platform android / ios -> web-provider.tsx      (file này)
//
// Nếu `store.tsx` import thẳng `./web-db` (thư viện `sql.js`), Metro sẽ kéo
// `sql.js` vào cả bundle Android/iOS. `sql.js` là thư viện Node và có
// `require("node:fs")` → bundle native fail với:
//   "Unable to resolve module node:fs from node_modules/sql.js/dist/sql-wasm.js"
// và EAS build APK dừng ở bước "Bundling" / `bundleReleaseJsAndResources`.
//
// Tách như thế này nên bundle native không bao giờ chạm tới `sql.js`,
// đồng thời file base64 ~860 KB `sql-wasm-b64.ts` cũng không nằm trong APK.
import React, { type ReactNode } from 'react';

export function WebProvider({ children }: { children?: ReactNode }) {
  // Không bao giờ được render: DataProvider chỉ dùng WebProvider khi Platform.OS === 'web'.
  return <>{children}</>;
}
