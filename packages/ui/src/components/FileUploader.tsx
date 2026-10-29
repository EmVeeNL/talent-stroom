import { useId, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { cx } from "../classnames.ts";
export interface FileUploaderProps {
  label: string;
  hint?: string;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  files?: File[];
  onFilesChange?: (files: File[]) => void;
  error?: string;
  required?: boolean;
  chooseLabel: string;
  removeLabel: (name: string) => string;
  wrongTypeMessage: (name: string) => string;
  tooLargeMessage: (name: string, sizeMb: number) => string;
}
export function FileUploader({
  label,
  hint,
  accept = ".pdf,.docx",
  maxSize = 10 * 1024 * 1024,
  multiple = false,
  files,
  onFilesChange,
  error,
  required,
  chooseLabel,
  removeLabel,
  wrongTypeMessage,
  tooLargeMessage,
}: FileUploaderProps) {
  const uid = useId(),
    input = useRef<HTMLInputElement>(null),
    [local, setLocal] = useState<File[]>([]),
    [validation, setValidation] = useState("");
  const selected = files ?? local;
  const message = error ?? validation;
  const update = (next: File[]) => {
    if (files === undefined) setLocal(next);
    onFilesChange?.(next);
  };
  const add = (incoming: FileList | null) => {
    if (!incoming) return;
    const accepted = accept.split(",").map((x) => x.trim().toLowerCase());
    const next = [...selected];
    for (const file of Array.from(incoming)) {
      if (
        accepted.length &&
        !accepted.some((ext) => (ext.startsWith(".") ? file.name.toLowerCase().endsWith(ext) : file.type === ext))
      ) {
        setValidation(wrongTypeMessage(file.name));
        continue;
      }
      if (file.size > maxSize) {
        setValidation(tooLargeMessage(file.name, maxSize / 1024 / 1024));
        continue;
      }
      next.push(file);
      setValidation("");
      if (!multiple) break;
    }
    update(next);
  };
  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    add(e.currentTarget.files);
    e.currentTarget.value = "";
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    add(e.dataTransfer.files);
  };
  return (
    <div className={cx("ts-field", message && "ts-field--invalid")}>
      <label className="ts-field__label" htmlFor={uid}>
        {label}
        {required && (
          <span className="ts-field__required" aria-hidden="true">
            {" *"}
          </span>
        )}
      </label>
      {hint && <p className="ts-field__hint">{hint}</p>}
      <div className="ts-upload" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
        <input
          ref={input}
          id={uid}
          type="file"
          accept={accept}
          multiple={multiple}
          required={required}
          onChange={onInput}
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? `${uid}-error` : undefined}
        />
        <p>{label}</p>
        <button type="button" onClick={() => input.current?.click()}>
          {chooseLabel}
        </button>
        <span className="ts-field__hint">
          {accept.toUpperCase().replaceAll(", ", " of ").replaceAll(",", " of ")} · max. {maxSize / 1024 / 1024} MB
        </span>
      </div>
      {selected.length > 0 && (
        <ul className="ts-upload__list">
          {selected.map((file, index) => (
            <li key={`${file.name}-${index}`}>
              <span>
                {file.name} · {new Intl.NumberFormat("nl-NL").format(file.size / 1024)} kB
              </span>
              <button
                type="button"
                aria-label={removeLabel(file.name)}
                onClick={() => update(selected.filter((_, i) => i !== index))}
              >
                {removeLabel(file.name)}
              </button>
            </li>
          ))}
        </ul>
      )}
      {message && (
        <p className="ts-field__error" id={`${uid}-error`} role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
