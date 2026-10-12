// Bulk import for the school modules.
//
// One backend endpoint pair serves every module, keyed by the same ModuleName
// the list pages already use, so there is nothing per-module here.

import axios from "axios";
import { api } from "@/lib/api";
import { postOne, toApiError, type MutationResult } from "@/lib/apiClient";
import { importEndpoints } from "@/utils/apiEndPoints";
import type { ImportResult } from "@/types/school";
import type { ModuleName } from "./school";

export type TemplateFormat = "csv" | "xlsx";

/** File types the server accepts, for the file picker. */
export const IMPORT_ACCEPT =
  ".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const templateName = (module: ModuleName, format: TemplateFormat) =>
  `${module.charAt(0).toUpperCase()}${module.slice(1)}ImportTemplate.${format}`;

/** Hands a blob to the browser as a download. */
const saveBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const importService = {
  /** Downloads a header-only template for the module. */
  downloadTemplate: async (module: ModuleName, format: TemplateFormat): Promise<void> => {
    try {
      const response = await api.get<Blob>(importEndpoints.template(), {
        params: { module, format },
        responseType: "blob",
      });
      saveBlob(response.data, templateName(module, format));
    } catch (error) {
      // With responseType "blob" an error body is a Blob too; decode it so
      // the server's message survives.
      if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
        try {
          error.response.data = JSON.parse(await error.response.data.text());
        } catch {
          // Not JSON; fall through to the generic message.
        }
      }
      throw toApiError(error, "Failed to download the template.");
    }
  },

  /**
   * Uploads a .csv, .xls or .xlsx file. Resolves even when some rows fail —
   * the per-row outcome is in `data.rows`. Rejects only when the file as a
   * whole is refused (unknown columns, unreadable file, and so on).
   */
  upload: (module: ModuleName, file: File): Promise<MutationResult<ImportResult>> => {
    const form = new FormData();
    form.append("File", file);

    return postOne<ImportResult>(importEndpoints.upload(), form, "Import failed.", {
      params: { module },
      // The shared instance defaults to JSON, which axios would apply to the
      // FormData too; multipart lets the browser add the boundary.
      headers: { "Content-Type": "multipart/form-data" },
      // Thousands of rows are created one by one, so allow well past the default.
      timeout: 5 * 60 * 1000,
    });
  },
};
