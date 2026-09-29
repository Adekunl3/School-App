"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { ApiError } from "@/lib/apiClient";
import { IMPORT_ACCEPT, importService, type TemplateFormat } from "@/services/imports";
import type { ModuleName } from "@/services/school";
import type { ImportResult } from "@/types/school";

/**
 * Bulk import for one module: download a template, upload a filled-in
 * .csv/.xls/.xlsx, then review which rows were created and which failed.
 *
 * Rows are saved independently, so a file with a few bad rows still creates
 * the rest; the failures are listed with their spreadsheet row numbers so
 * they can be fixed and re-uploaded on their own.
 */
const ImportModal = ({
  table,
  noun,
  onSuccess,
}: {
  table: ModuleName;
  /** Plural noun for the copy, e.g. "attendance records". */
  noun: string;
  /** Called when at least one record was created, so the list can refresh. */
  onSuccess?: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState<TemplateFormat | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setError(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const close = () => {
    if (uploading) return;
    setOpen(false);
    reset();
  };

  const downloadTemplate = async (format: TemplateFormat) => {
    setDownloading(format);
    try {
      await importService.downloadTemplate(table, format);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Failed to download the template.");
    } finally {
      setDownloading(null);
    }
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const response = await importService.upload(table, file);
      const outcome = response.data;
      setResult(outcome);

      if (outcome && outcome.created > 0) onSuccess?.();

      if (outcome && outcome.failed > 0) {
        toast.error(response.message);
      } else {
        toast.success(response.message);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError("Import failed. Please try again."));
    } finally {
      setUploading(false);
    }
  };

  const failures = result?.rows.filter((row) => !row.success) ?? [];

  return (
    <>
      <button
        type="button"
        className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow"
        onClick={() => setOpen(true)}
        title={`Import ${noun}`}
        aria-label={`Import ${noun}`}
      >
        <Image src="/upload.png" alt="" width={16} height={16} />
      </button>

      {open && (
        <div className="w-screen h-screen fixed left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-4 rounded-md relative w-full md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[45%] max-h-[90vh] overflow-y-auto">
            <div className="p-4 flex flex-col gap-4">
              <h2 className="text-lg font-semibold capitalize">Import {noun}</h2>

              <div className="text-sm text-gray-600 flex flex-col gap-2">
                <p>
                  Upload a .csv, .xls or .xlsx file with one record per row and the column
                  names in the first row. Start from a template to get the columns right.
                </p>
                <div className="flex flex-wrap gap-2">
                  {(["xlsx", "csv"] as const).map((format) => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => void downloadTemplate(format)}
                      disabled={downloading !== null}
                      className="border border-gray-300 py-1 px-3 rounded-md text-xs disabled:opacity-60"
                    >
                      {downloading === format
                        ? "Downloading..."
                        : format === "xlsx"
                        ? "Excel template"
                        : "CSV template"}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={onSubmit} className="flex flex-col gap-3">
                <input
                  ref={inputRef}
                  type="file"
                  accept={IMPORT_ACCEPT}
                  disabled={uploading}
                  onChange={(event) => {
                    setFile(event.target.files?.[0] ?? null);
                    setError(null);
                    setResult(null);
                  }}
                  className="text-sm file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-lamaSkyLight file:text-sm"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={!file || uploading}
                    aria-busy={uploading}
                    className="bg-blue-400 text-white py-2 px-4 rounded-md disabled:opacity-60"
                  >
                    {uploading ? "Importing..." : "Import"}
                  </button>
                  {uploading && (
                    <span className="text-xs text-gray-500">
                      Large files can take a minute. Keep this window open.
                    </span>
                  )}
                </div>
              </form>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 rounded-md p-3">
                  <p className="font-medium">{error.message}</p>
                  {error.errors.length > 0 && (
                    <ul className="list-disc ml-5 mt-1">
                      {error.errors.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {result && (
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                      {result.totalRows} row{result.totalRows === 1 ? "" : "s"} read
                    </span>
                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">
                      {result.created} created
                    </span>
                    {result.failed > 0 && (
                      <span className="px-2 py-1 rounded-full bg-red-100 text-red-700">
                        {result.failed} failed
                      </span>
                    )}
                  </div>

                  {failures.length > 0 && (
                    <>
                      <p className="text-gray-600">
                        These rows were not imported. Fix them and upload just those rows again;
                        rows already created would be rejected as duplicates.
                      </p>
                      <div className="overflow-x-auto max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                        <table className="w-full text-left">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="p-2 w-16">Row</th>
                              <th className="p-2">Problem</th>
                            </tr>
                          </thead>
                          <tbody>
                            {failures.map((row) => (
                              <tr key={row.rowNumber} className="border-t border-gray-200 align-top">
                                <td className="p-2 font-medium">{row.rowNumber}</td>
                                <td className="p-2 text-red-700">{row.errors.join(" ")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={reset}
                      className="border border-gray-300 py-2 px-4 rounded-md"
                    >
                      Import another file
                    </button>
                    <button
                      type="button"
                      onClick={close}
                      className="border border-gray-300 py-2 px-4 rounded-md"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="absolute top-4 right-4 cursor-pointer disabled:opacity-40"
              onClick={close}
              disabled={uploading}
              aria-label="Close"
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ImportModal;
